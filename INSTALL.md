# Installing Mux syntax highlighting

Install instructions for the Mux editor packages maintained in this and the
`tree-sitter-mux` repository. VSCode and Neovim include Mux LSP setup. Helix has
manual grammar and LSP configuration. Sublime Text and JetBrains support
highlighting; Emacs setup is manual.

| Editor | Support | Section |
| --- | --- | --- |
| VSCode | Highlighting and LSP | [VSCode](#vscode) |
| Neovim | Tree-sitter highlighting and LSP | [Tree-sitter editors](#tree-sitter-editors-neovim-helix-emacs) |
| Helix | Tree-sitter highlighting and LSP, manual setup | [Tree-sitter editors](#tree-sitter-editors-neovim-helix-emacs) |
| Emacs | Manual Tree-sitter setup | [Tree-sitter editors](#tree-sitter-editors-neovim-helix-emacs) |
| Sublime Text | Syntax highlighting | [Sublime Text](#sublime-text) |
| JetBrains IDEs | TextMate highlighting | [JetBrains IDEs](#jetbrains-ides) |

## VSCode

The maintained extension is `mux-lang.language-mux`. Install **Mux Language
Support** from the Visual Studio Marketplace. In VS Code, search the Extensions
view for that name, or run:

```bash
code --install-extension mux-lang.language-mux
```

For VSCodium and other editors configured to use Open VSX, search for the same
extension or run:

```bash
codium --install-extension mux-lang.language-mux
```

To install from source or test a local build, run these commands from the
repository root:

```bash
npm ci
npm run package:vscode           # generates the grammar and creates dist/language-mux.vsix
code --install-extension dist/language-mux.vsix
```

Reload the window (`Ctrl+Shift+P` -> "Developer: Reload Window") and open any
`.mux` file. Colors come from your active VSCode theme, not the grammar.

Repackage and verify the VSIX after changing the syntax spec or extension.

## Tree-sitter editors (Neovim, Helix, Emacs)

Neovim, Helix, and Emacs use the committed grammar in
[muxlang/tree-sitter-mux](https://github.com/muxlang/tree-sitter-mux). Its
[integration guide](https://github.com/muxlang/tree-sitter-mux/blob/main/INTEGRATION.md)
has the install steps. Neovim uses the Mux-owned plugin, which builds the parser
with an installed C compiler and configures highlighting and `mux lsp`. Helix
uses a manual language configuration and query install. Emacs setup remains
manual. None require the Tree-sitter CLI to download or generate the grammar.

## Sublime Text

Copy the syntax definition into your user packages:

```bash
# Linux
cp editor-support/sublime/Mux.sublime-syntax \
  ~/.config/sublime-text/Packages/User/
# macOS
cp editor-support/sublime/Mux.sublime-syntax \
  ~/Library/Application\ Support/Sublime\ Text/Packages/User/
```

On Windows the destination is `%APPDATA%\Sublime Text\Packages\User\`.

Sublime picks up `.mux` files automatically once the syntax is installed.

## JetBrains IDEs

JetBrains IDEs (IntelliJ, GoLand, PyCharm, ...) read TextMate bundles:

1. Open **Settings -> Editor -> TextMate Bundles**.
2. Add `editor-support/jetbrains/textmate/` (contains `mux.tmLanguage.json`).
3. Apply. `.mux` files now highlight using the bundled grammar and your active
   TextMate color scheme.
