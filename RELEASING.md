# Releasing the VS Code extension

GitHub Actions builds and verifies a VSIX when you start the release workflow.
It does not publish to the Visual Studio Marketplace. You upload the VSIX from
the Marketplace publisher page yourself.

## Build a release VSIX

1. Update the extension version in `textmate-mux/vscode-language-mux/package.json`
   and merge the release change.
2. Create and push a tag named `v<version>` from that commit. For example,
   version `0.13.1` uses tag `v0.13.1`.
3. In GitHub Actions, run **Publish VSCode extension**. Select the tag as the
   workflow ref, enter the same tag as `release_tag`, and choose `none` as the
   destination.
4. Download `mux-programming-language.vsix` from the draft GitHub release or
   workflow artifacts. Upload it on the [Marketplace publisher page](https://marketplace.visualstudio.com/manage).

The workflow checks that the tag matches the extension version. It stores the
verified VSIX, SHA-256 digest, and build metadata on the GitHub release. A later
run for the same tag reuses those assets and verifies their metadata before
uploading them again.

To install the package locally, run
`code --install-extension mux-programming-language.vsix`.

## Recover a failed release package

The workflow stops if a GitHub release has a VSIX and checksum but no build
metadata. Remove the partial assets, then run the workflow again with destination
`none`:

```sh
release_tag=v0.13.1
gh release delete-asset "$release_tag" mux-programming-language.vsix
gh release delete-asset "$release_tag" mux-programming-language.vsix.sha256
```

If the saved build metadata doesn't match the tag, remove all three assets
before rebuilding:

```sh
gh release delete-asset "$release_tag" mux-programming-language.vsix
gh release delete-asset "$release_tag" mux-programming-language.vsix.sha256
gh release delete-asset "$release_tag" mux-programming-language.build.json
```

## Publish to Open VSX

After the `muxlang` namespace claim is approved, create an Open VSX access
token. On your local machine, run `npx ovsx login muxlang` and enter the token
when prompted. The CLI stores it in the OS credential manager. Then publish the
verified VSIX:

```sh
npx ovsx publish dist/mux-programming-language.vsix
```

This publishes the extension as `muxlang.mux-programming-language`, matching
the Visual Studio Marketplace ID. See the [Open VSX publishing instructions](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions).
