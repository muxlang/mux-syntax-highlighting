# mux-syntax-highlighting

TextMate-family syntax highlighting for the [Mux programming language](https://github.com/muxlang)
- **VSCode, Sublime, JetBrains** - plus drop-in editor configs and the **canonical
syntax spec**. Part of the multi-repo [muxlang](https://github.com/muxlang) ecosystem.

Tree-sitter-based highlighting (Neovim, Helix, Emacs) lives in the separate
[tree-sitter-mux](https://github.com/muxlang/tree-sitter-mux) repo.

## Structure

- `shared/syntax-matrix.json` - the canonical syntax spec (single source of truth).
- `textmate-mux/` - TextMate grammar (generated from the spec).
  `vscode-language-mux/` is the VSCode extension package.
- `editor-support/` - drop-in configs for Sublime, JetBrains, Helix, and Neovim
  (queries generated from `editor-support/spec/definitions.json`).
- `scripts/` -
  - `generate-syntax.js` - generates the TextMate grammar from the spec.
  - `check-parity.js` - verifies the TextMate grammar matches the spec.
  - `build-editor-support.js` - generates/validates the editor-support configs.

## Development

```bash
node scripts/generate-syntax.js                     # regenerate the TextMate grammar
node scripts/check-parity.js                        # verify TextMate parity (CI)
node scripts/build-editor-support.js                # regenerate editor-support configs
node scripts/build-editor-support.js --check        # verify editor-support parity (CI)
```

CI runs the two parity checks plus a SonarQube scan.

## The spec feeds three repos

The canonical spec drives three highlighting consumers, each of which vendors its
generated artifact:
1. This repo's TextMate grammar.
2. `tree-sitter-mux`'s grammar + `queries/highlights.scm` (vendors a copy of the spec).
3. `mux-website`'s Shiki grammar (`src/shiki/mux.json`).

When you change the spec, update the vendored copies in those repos. There is a
single canonical spec - `shared/syntax-matrix.json` - read by both generators
(`generate-syntax.js` for the TextMate grammar, `build-editor-support.js` for
the editor-support configs).

## Related repositories

- [tree-sitter-mux](https://github.com/muxlang/tree-sitter-mux) - tree-sitter grammar (Neovim/Helix/Emacs)
- [mux-website](https://github.com/muxlang/mux-website) - docs site (third spec consumer)
- [mux-compiler](https://github.com/muxlang/mux-compiler) - the language/compiler

## License

[MIT](LICENSE)
