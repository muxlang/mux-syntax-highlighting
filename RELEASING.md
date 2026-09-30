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
[Visual Studio Marketplace](https://marketplace.visualstudio.com/manage). Grant
that publisher access to the Azure identity used by the workflow.

Create a GitHub Actions environment named `vscode-marketplace`. Add the
environment secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and
`AZURE_SUBSCRIPTION_ID`. In Microsoft Entra, create a federated credential for
the GitHub repository environment subject
`repo:muxlang/mux-syntax-highlighting:environment:vscode-marketplace`, then give
that identity the Marketplace publisher permissions. Set environment reviewers
if publishing should require an additional approval. The workflow uses
`azure/login` and `vsce --azure-credential`, so it does not need a long-lived
Azure DevOps token.

For Open VSX, first claim the `mux-lang` namespace on Open VSX and grant it
access to the extension. Configure that namespace with a trusted publisher for
the `muxlang/mux-syntax-highlighting` GitHub repository and the
`open-vsx` environment. Create a GitHub Actions environment named `open-vsx`;
environment reviewers can gate publication. This uses Open VSX trusted
publishing through GitHub OIDC and stores no Open VSX token in GitHub.

The workflow's environment names are part of the OIDC identity. Keep them
aligned with the federated credentials and trusted-publisher settings.

## Release steps

1. Update the extension version and changelog, then merge the release changes.
2. Create and push a tag named `v<version>` from the release commit. The
   workflow checks that the tag matches the extension manifest version.
3. Run `Publish VSCode extension` with that tag. Choose `none` to build and
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
workflow stops rather than trusting that package. Remove those two assets with
`gh release delete-asset <tag> language-mux.vsix` and
`gh release delete-asset <tag> language-mux.vsix.sha256`, then run with
destination `none` to build and inspect a verified package.
If the recorded build metadata does not match the tag, remove the VSIX, digest,
and build metadata assets before rebuilding with destination `none`.
