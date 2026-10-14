# Releasing the VSCode extension

## Automatic Marketplace updates

After the first Marketplace upload, GitHub Actions can publish updates without
anyone downloading or uploading a VSIX. When a change to the VS Code extension
or its generated grammar lands on `main`, the workflow runs the extension
checks and builds a verified VSIX. Once automatic publishing is enabled, the
workflow saves that exact package and its build metadata on a draft GitHub
Release tagged `v<version>`, then publishes those bytes to the Marketplace.
The manual tagged workflow reuses the saved assets, so retrying Open VSX does
not rebuild a different package. Marketplace publishing starts after the
managed identity is configured and the repository Actions variable
`VSCODE_MARKETPLACE_AUTO_PUBLISH` is set to `true`. Until then, the workflow
builds the package but skips publishing. Each published update must raise the
version in `textmate-mux/vscode-language-mux/package.json` in the same change.
The workflow fails if the version does not increase, since the Marketplace will
not accept a version that was already published.

Marketplace publishing uses a user-assigned Microsoft Entra managed identity.
GitHub Actions signs in through workload identity federation, then `vsce
publish --azure-credential` obtains a short-lived token. No Marketplace PAT is
stored in GitHub.

Set up the identity once:

1. In the `muxlang` Marketplace publisher, add the managed identity as a
   **Contributor**.
2. In the identity's federated credentials, use issuer
   `https://token.actions.githubusercontent.com`, subject
   `repo:muxlang/mux-syntax-highlighting:environment:marketplace`, and audience
   `api://AzureADTokenExchange`.
3. In repository Settings → Environments, create `marketplace` and allow the
   `main` branch and `v*` tags. Add `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and
   `AZURE_SUBSCRIPTION_ID` as environment secrets.
4. Run **Verify VS Code Marketplace authentication** from the Actions tab on
   `main`. It checks the Azure login and Marketplace publisher access without
   publishing anything.
5. After that check passes, add the repository variable
   `VSCODE_MARKETPLACE_AUTO_PUBLISH=true` under Settings → Secrets and variables
   → Actions → Variables to enable automatic publication.

The automatic workflow only publishes after all CI jobs pass and the extension
version increases. It saves the verified VSIX and digest on the matching GitHub
release before publishing. The tagged workflow uses the same Azure identity for
Marketplace publication. Open VSX publishing remains a separate step and uses
its own trusted-publishing environment.

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

The `marketplace` environment name is part of the OIDC identity. Keep it aligned
with the federated credential subject.

## Manual tagged package workflow

The `Publish VSCode extension` workflow also supports tagged builds. It stores
the verified VSIX, SHA-256 digest, and tag/source/version metadata on a GitHub
Release for that tag, creating a draft release when one does not exist. Later
runs for the same tag verify that metadata and reuse the exact assets, so a
registry retry cannot rebuild different bytes. Unverified or partial assets
fail closed. For versions published automatically to the Marketplace, the
workflow has already created this release and the tagged run reuses its exact
VSIX. Use this workflow to publish that package to Open VSX.

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
