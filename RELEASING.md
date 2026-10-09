# Releasing the VSCode extension

The VSCode package is published from a version tag by the `Publish VSCode
extension` workflow. The workflow stores the verified VSIX, SHA-256 digest,
and tag/source/version metadata on a GitHub Release for that tag, creating a
draft release when one does not exist. Later runs for the same tag verify that
metadata and reuse the exact assets, so a registry retry cannot rebuild
different bytes. Unverified or partial assets fail closed. Ordinary CI runs
never publish.

## First publication

The first Visual Studio Marketplace release is uploaded from the publisher
management page. The verified package is attached to the GitHub Release by the
workflow below. Download `language-mux.vsix`, then upload it from
[Marketplace publisher management](https://marketplace.visualstudio.com/manage).
This is Microsoft's documented first-publish path; it does not need a PAT or a
GitHub publishing secret.

The `marketplace` workflow destination uses `vsce publish --oidc`. Use it only
if the publisher account has a trusted-publishing policy for repository
`muxlang/mux-syntax-highlighting`, workflow
`.github/workflows/publish-vscode.yml`, and the `vscode-marketplace` GitHub
Actions environment. The workflow stores no Marketplace credential. If that
policy is not available in publisher management, choose `none` and upload the
verified VSIX manually as described above.

For Open VSX, first claim the `muxlang` namespace and sign the publisher
agreement. This namespace is separate from the Visual Studio Marketplace
publisher. Configure it with a trusted publisher for the
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
