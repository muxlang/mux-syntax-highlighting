# Releasing the VSCode extension

The VSCode package is published from a version tag by the `Publish VSCode
extension` workflow. The workflow stores the verified VSIX, SHA-256 digest,
and tag/source/version metadata on a GitHub Release for that tag, creating a
draft release when one does not exist. Later runs for the same tag verify that
metadata and reuse the exact assets, so a registry retry cannot rebuild
different bytes. Unverified or partial assets fail closed. Ordinary CI runs
never publish.

## One-time setup

The extension publisher in
`textmate-mux/vscode-language-mux/package.json` must be registered in the
[Visual Studio Marketplace](https://marketplace.visualstudio.com/manage), and
the account must control that publisher. Configure its trusted-publishing
policy to trust the `muxlang/mux-syntax-highlighting` repository,
`.github/workflows/publish-vscode.yml`, and the `vscode-marketplace` GitHub
Actions environment. The workflow uses `vsce publish --oidc` with the lockfile-
pinned `@vscode/vsce` 4.0.0; it stores no Marketplace or Azure credential in
GitHub. Create the `vscode-marketplace` environment and restrict it to version
tags (`v*`). Add required reviewers if publishing should require a separate
approval. Follow the [VSCE trusted publishing instructions](https://github.com/microsoft/vscode-vsce#trusted-publishing)
when configuring the Marketplace publisher.

For Open VSX, first claim the `mux-lang` namespace and sign the publisher
agreement. Configure that namespace with a trusted publisher for the
`muxlang/mux-syntax-highlighting` repository,
`.github/workflows/publish-vscode.yml`, and the `open-vsx` environment. Create
the GitHub Actions environment and restrict it to version tags (`v*`);
environment reviewers can gate publication. This uses Open VSX trusted
publishing through GitHub OIDC and stores no Open VSX token in GitHub. Follow
the [Open VSX trusted publishing instructions](https://github.com/eclipse-openvsx/openvsx/blob/main/cli/README.md#trusted-publishing)
when configuring the namespace.

The workflow's environment names are part of the OIDC identity. Keep them
aligned with the federated credentials and trusted-publisher settings.

## Release steps

1. Update the extension version and changelog, then merge the release changes.
2. Create and push a tag named `v<version>` from the release commit.
3. Run `Publish VSCode extension` with that tag selected as the workflow ref
   and release-tag input. The workflow checks that both refs match and that
   the tag matches the extension manifest version. Choose `none` to build and
   verify the release asset for inspection, or choose one or both registries
   to publish.
4. If a destination environment has reviewers, inspect the package job and
   artifact before approving its publishing job. Each publishing job verifies
   the digest of the durable VSIX before upload. To retry a failed destination,
   run the workflow again for the same tag and choose only that destination.

Each run also uploads the VSIX as a workflow artifact for 30 days. The release
assets remain available for later retries. To install locally, use
`code --install-extension language-mux.vsix`.

If a release already has the VSIX and checksum but no build metadata, the
workflow stops rather than trusting that package. Set `release_tag` to the
extension version, then remove the old assets:

```sh
release_tag=v0.13.0
gh release delete-asset "$release_tag" language-mux.vsix
gh release delete-asset "$release_tag" language-mux.vsix.sha256
```

Run the workflow with destination `none` to build and inspect a verified
package. If the recorded build metadata does not match the tag, remove all
three assets before rebuilding:

```sh
gh release delete-asset "$release_tag" language-mux.vsix
gh release delete-asset "$release_tag" language-mux.vsix.sha256
gh release delete-asset "$release_tag" language-mux.build.json
```
