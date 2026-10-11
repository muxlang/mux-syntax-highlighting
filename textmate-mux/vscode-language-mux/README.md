# Mux Language Support for VSCode

Provides syntax highlighting, language configuration, and a client for the
compiler's `mux lsp` server for Mux files (`.mux`) in Visual Studio Code.

Install **Mux Language Support** from the Visual Studio Marketplace or Open VSX.
The extension identifier is `muxlang.language-mux`.

## Features
- Syntax highlighting (keywords, strings, comments, operators, literals)
- Language configuration (bracket matching, auto-closing pairs, comment toggling)
- Mux language icon in the Extensions panel
- Live diagnostics, safe fixes, and formatting when `mux` is installed
- Document symbols, go-to-definition, hover, completion, and signature help
  through the Mux language server

The server command defaults to `mux` on PATH. Set the machine-scoped
`mux.serverPath` VSCode setting to use another compiler executable.

## Development

### Prerequisites
- Node.js and npm
- From the repository root: `npm ci`

The extension grammar is generated from `../../shared/syntax-matrix.json` via `../../scripts/generate-syntax.js`.

### Build and Package
`source.mux.json` is generated and not committed. From the repository root:
```bash
npm run package:vscode            # generates the grammar and packages runtime dependencies
npm run verify:vscode-package
```

### Install Locally
```bash
code --install-extension dist/language-mux.vsix
```

Reload the window afterward (Ctrl+Shift+P -> "Developer: Reload Window").

See [../../INSTALL.md](../../INSTALL.md) for the full cross-editor install guide.

### Test Changes
1. Edit `../../shared/syntax-matrix.json`
2. Run `npm run package:vscode` from the repository root
3. Install the `.vsix` in VSCode
4. Reload window (Ctrl+Shift+P -> "Developer: Reload Window")

## File Structure
- `language-configuration.json` - Editor behavior (brackets, comments)
- `mux-icon.png` - Extension icon
- `extension.js` - VSCode client for `mux lsp`
- `package.json` - VSCode extension manifest

## Scope Names
The grammar uses standard TextMate scope names:
- `keyword.control.mux` - if, else, for, while, match, as, in, is
- `keyword.declaration.mux` - auto, func, returns, return, const, class, interface, enum, import
- `constant.language.mux` - none, true, false, common
- `string.quoted.*.mux` - Single and double-quoted strings
- `comment.*.mux` - Line and block comments

Colors are determined by the active VSCode theme, not the grammar itself.
