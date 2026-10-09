# Releasing the VSCode extension

## Automatic Marketplace updates

After the first Marketplace upload, GitHub Actions can publish updates without
anyone downloading or uploading a VSIX. When a change to the VS Code extension
or its generated grammar lands on `main`, the workflow runs the extension
checks and builds a verified VSIX. It publishes only after the publisher's
OIDC trust is configured and the repository Actions variable
`VSCODE_MARKETPLACE_AUTO_PUBLISH` is set to `true`. Until then, the workflow
builds the package but skips publishing. Each published update must raise the version in
`textmate-mux/vscode-language-mux/package.json` in the same change. The
workflow fails if the version does not increase, since the Marketplace will
not accept a version that was already published.

The Marketplace publishing job uses `vsce publish --oidc` and does not store a
PAT in GitHub. The publisher must trust this GitHub repository and the
`.github/workflows/publish-vscode.yml` workflow. The job uses the
`vscode-marketplace` GitHub Actions environment. Create that environment and
allow deployments from `main` and `v*` tags. Configure the repository,
workflow, and environment in the Marketplace publisher settings after the
first upload. Then add the repository variable
`VSCODE_MARKETPLACE_AUTO_PUBLISH=true` under Settings → Secrets and variables →
Actions → Variables. If the publisher page does not offer a trusted-publishing
setting, leave the variable unset. The workflow will still build verified
VSIX artifacts, but it will not try to publish. Microsoft's documented
fallback is Microsoft Entra ID with a managed identity; that needs Azure
account setup and a federated GitHub Actions identity.

## First publication

The first Visual Studio Marketplace release is uploaded from the publisher
management page. From the repository root, run `npm ci`,
`npm run package:vscode`, and `npm run verify:vscode-package`. Upload
`dist/language-mux.vsix` from
[Marketplace publisher management](https://marketplace.visualstudio.com/manage).
The package is version `0.13.0`. This is a one-time step to create the listing.
Once the listing and trusted-publishing policy are in place, future versioned
changes publish from GitHub Actions automatically.

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

## Manual tagged package workflow

The `Publish VSCode extension` workflow also supports tagged builds. It stores
the verified VSIX, SHA-256 digest, and tag/source/version metadata on a GitHub
Release for that tag, creating a draft release when one does not exist. Later
runs for the same tag verify that metadata and reuse the exact assets, so a
registry retry cannot rebuild different bytes. Unverified or partial assets
fail closed. Use this workflow when you need a durable tagged VSIX or want to
publish to Open VSX.

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
