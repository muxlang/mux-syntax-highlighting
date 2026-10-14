# Releasing the VS Code extension

GitHub Actions builds and verifies a VSIX when you start the release workflow.
It does not publish to the Visual Studio Marketplace. You upload the VSIX from
the Marketplace publisher page yourself.

## Build a release VSIX

1. Update the extension version in `textmate-mux/vscode-language-mux/package.json`
   and merge the release change.
2. Create and push a tag named `v<version>` from that commit. For example,
   version `0.13.0` uses tag `v0.13.0`.
3. In GitHub Actions, run **Publish VSCode extension**. Select the tag as the
   workflow ref, enter the same tag as `release_tag`, and choose `none` as the
   destination.
4. Download `language-mux.vsix` from the draft GitHub release or workflow
   artifacts. Upload it on the [Marketplace publisher page](https://marketplace.visualstudio.com/manage).

The workflow checks that the tag matches the extension version. It stores the
verified VSIX, SHA-256 digest, and build metadata on the GitHub release. A later
run for the same tag reuses those assets and verifies their metadata before
uploading them again.

To install the package locally, run `code --install-extension language-mux.vsix`.

## Publish to Open VSX

Open VSX publishing remains an optional manual workflow action. First claim the
`muxlang` namespace and configure trusted publishing for the
`muxlang/mux-syntax-highlighting` repository, this workflow file, and the
`open-vsx` GitHub environment. Then run **Publish VSCode extension** using the
release tag and choose `open-vsx`. The workflow verifies the saved VSIX digest
before publishing. See the [Open VSX trusted publishing instructions](https://github.com/eclipse-openvsx/openvsx/blob/main/cli/README.md#trusted-publishing).
