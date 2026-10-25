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
   workflow ref and enter the same tag as `release_tag`.
4. Download `language-mux.vsix` from the draft GitHub release or workflow
   artifacts. Upload it on the [Marketplace publisher page](https://marketplace.visualstudio.com/manage)
   or manually through the Open VSX publisher page.

The workflow checks that the tag matches the extension version. It stores the
verified VSIX, SHA-256 digest, and build metadata on the GitHub release. A later
run for the same tag reuses those assets and verifies their metadata before
uploading them again.

To install the package locally, run `code --install-extension language-mux.vsix`.

## Recover a failed release package

The workflow stops if a GitHub release has a VSIX and checksum but no build
metadata. Remove the partial assets, then run the workflow again with destination
`none`:

```sh
release_tag=v0.13.0
gh release delete-asset "$release_tag" language-mux.vsix
gh release delete-asset "$release_tag" language-mux.vsix.sha256
```

If the saved build metadata doesn't match the tag, remove all three assets
before rebuilding:

```sh
gh release delete-asset "$release_tag" language-mux.vsix
gh release delete-asset "$release_tag" language-mux.vsix.sha256
gh release delete-asset "$release_tag" language-mux.build.json
```

## Upload to Open VSX

To publish manually, sign in to Open VSX, accept its publisher agreement, and
claim the `muxlang` namespace if needed. The extension's `publisher` field is
`muxlang`, so the namespace must match. Upload the downloaded
`language-mux.vsix` from the Open VSX publisher page. See the
[Open VSX publishing instructions](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions)
for account and namespace setup.
