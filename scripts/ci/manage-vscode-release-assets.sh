#!/usr/bin/env bash
set -euo pipefail

mode=${1:?Usage: manage-vscode-release-assets.sh auto|tagged}
release_tag=${RELEASE_TAG:?RELEASE_TAG is required}
repository=${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}
version=$(node -p "require('./textmate-mux/vscode-language-mux/package.json').version")

case "$mode" in
  auto)
    source_commit=${SOURCE_COMMIT:?SOURCE_COMMIT is required in auto mode}
    if [[ "$version" != "${VERSION:?VERSION is required in auto mode}" ]]; then
      echo "The checked version does not match the extension manifest." >&2
      exit 1
    fi
    ;;
  tagged)
    source_commit=$(git rev-parse "$release_tag^{commit}")
    if [[ "$release_tag" != "v$version" ]]; then
      echo "Release tag $release_tag does not match extension version $version." >&2
      exit 1
    fi
    ;;
  *)
    echo "Unknown release asset mode: $mode" >&2
    exit 2
    ;;
esac

resolve_tag_commit() {
  git ls-remote --tags origin "refs/tags/$release_tag" "refs/tags/$release_tag^{}" |
    awk -v tag="refs/tags/$release_tag" '
      $2 == tag { commit = $1 }
      $2 == tag "^{}" { commit = $1 }
      END { print commit }
    '
}

tag_commit=$(resolve_tag_commit)
if [[ -n "$tag_commit" && "$tag_commit" != "$source_commit" ]]; then
  echo "Tag $release_tag points to $tag_commit, not $source_commit." >&2
  exit 1
fi
if [[ -z "$tag_commit" ]]; then
  git push origin "$source_commit:refs/tags/$release_tag" || true
  tag_commit=$(resolve_tag_commit)
fi
if [[ "$tag_commit" != "$source_commit" ]]; then
  echo "Could not create or verify tag $release_tag at $source_commit." >&2
  exit 1
fi

if ! gh release view "$release_tag" --repo "$repository" >/dev/null 2>&1; then
  gh release create "$release_tag" \
    --repo "$repository" \
    --draft \
    --target "$source_commit" \
    --title "Mux VSCode extension $release_tag" \
    --notes "Verified VSIX artifact for $release_tag." \
    || gh release view "$release_tag" --repo "$repository" >/dev/null
fi

read_asset_state() {
  local names
  names=$(gh release view "$release_tag" --repo "$repository" --json assets --jq '[.assets[].name]')
  has_vsix=$(jq -r 'index("language-mux.vsix") != null' <<< "$names")
  has_digest=$(jq -r 'index("language-mux.vsix.sha256") != null' <<< "$names")
  has_metadata=$(jq -r 'index("language-mux.build.json") != null' <<< "$names")
}

download_assets() {
  rm -f dist/language-mux.vsix dist/language-mux.vsix.sha256 dist/language-mux.build.json
  gh release download "$release_tag" \
    --repo "$repository" \
    --pattern language-mux.vsix \
    --pattern language-mux.vsix.sha256 \
    --pattern language-mux.build.json \
    --dir dist
}

wait_for_complete_assets() {
  local attempt=0
  while [[ "$attempt" -lt 12 ]]; do
    attempt=$((attempt + 1))
    sleep 5
    read_asset_state
    if [[ "$has_vsix" == true && "$has_digest" == true && "$has_metadata" == true ]] && download_assets; then
      return 0
    fi
  done
  return 1
}

mkdir -p dist
read_asset_state
if [[ "$has_vsix" == true && "$has_digest" == true && "$has_metadata" == true ]]; then
  download_assets
elif [[ "$has_vsix" == false && "$has_digest" == false && "$has_metadata" == false ]]; then
  if [[ "$mode" == tagged ]]; then
    npm run package:vscode
    npm run verify:vscode-package
    (cd dist && sha256sum language-mux.vsix > language-mux.vsix.sha256)
  fi

  (cd dist && sha256sum --check language-mux.vsix.sha256)
  digest=$(sha256sum dist/language-mux.vsix | cut -d ' ' -f 1)
  jq -n \
    --arg repository "$repository" \
    --arg release_tag "$release_tag" \
    --arg source_commit "$source_commit" \
    --arg version "$version" \
    --arg sha256 "$digest" \
    '{repository: $repository, release_tag: $release_tag, source_commit: $source_commit, version: $version, sha256: $sha256}' \
    > dist/language-mux.build.json
  if ! gh release upload "$release_tag" --repo "$repository" \
    dist/language-mux.vsix dist/language-mux.vsix.sha256 dist/language-mux.build.json; then
    echo "Another run may be persisting this release; waiting for its complete asset set."
    if ! wait_for_complete_assets; then
      echo "No complete VSIX asset set appeared for $release_tag." >&2
      exit 1
    fi
  fi
else
  echo "Release $release_tag has a partial VSIX asset set; waiting for the other writer to finish." >&2
  if ! wait_for_complete_assets; then
    echo "No complete VSIX asset set appeared for $release_tag." >&2
    exit 1
  fi
fi

(cd dist && sha256sum --check language-mux.vsix.sha256)
digest=$(sha256sum dist/language-mux.vsix | cut -d ' ' -f 1)
if ! jq -e \
  --arg repository "$repository" \
  --arg release_tag "$release_tag" \
  --arg source_commit "$source_commit" \
  --arg version "$version" \
  --arg sha256 "$digest" \
  '.repository == $repository and .release_tag == $release_tag and .source_commit == $source_commit and .version == $version and .sha256 == $sha256' \
  dist/language-mux.build.json >/dev/null; then
  echo "Release $release_tag has VSIX metadata that does not match its source or package." >&2
  exit 1
fi
npm run verify:vscode-package
