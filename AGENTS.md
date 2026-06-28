# mux-syntax-highlighting: AI Agent Guidelines

TextMate-family syntax highlighting for Mux (VSCode/Sublime/JetBrains) + the
editor-support configs + the canonical syntax spec. Part of the multi-repo
[muxlang](https://github.com/muxlang) ecosystem. Tree-sitter is a SEPARATE repo
(`tree-sitter-mux`).

## Critical Rules

- **No special characters** - avoid em-dashes, emojis, or other non-ASCII in code,
  comments, or commit messages.
- **Understand existing code first**; follow existing patterns.
- **Generated artifacts are generated, not hand-edited:** `textmate-mux/source.mux.json`
  (+ the vscode copy) come from `generate-syntax.js` (gitignored); the
  `editor-support/` configs come from `build_syntax_highlighting.py`. Edit the spec,
  then regenerate.

## The spec feeds THREE repos (keep vendored copies in sync)

The canonical spec drives three highlighting consumers, each vendoring its artifact:
1. This repo's TextMate grammar.
2. `tree-sitter-mux` - its `grammar.js` reads a VENDORED copy of `syntax-matrix.json`,
   and `queries/highlights.scm` is generated from the spec.
3. `mux-website` - its Shiki grammar `src/shiki/mux.json`.

When you change the spec, update the vendored copies in those repos. A cross-repo
parity-check mechanism is planned follow-up.

## One canonical spec

`shared/syntax-matrix.json` is the SINGLE source of truth (validated against the
compiler lexer). Both generators read it:
- `generate-syntax.js` - the TextMate grammar.
- `build_syntax_highlighting.py` - the editor-support configs (Sublime, JetBrains,
  Helix/Neovim queries, vscode config). It adapts the matrix via `spec_from_matrix()`.

The old `editor-support/spec/definitions.json` was deleted (it had drifted - e.g.
listed `ok`/`err` as keywords and `::`/`->` as operators, none of which are real
Mux tokens). Optional future cleanup: port the Python generator into JS so there is
one generator as well as one spec, and emit the website Shiki grammar from here too.

## Helix

`editor-support/helix/languages.toml` uses a GIT grammar source pointing at
`muxlang/tree-sitter-mux` (NOT a local path - that would dangle).

## Development / CI

```bash
node scripts/check-parity.js                          # TextMate parity (CI)
python3 scripts/build_syntax_highlighting.py --check  # editor-support parity (CI)
```

CI runs both parity checks + a SonarQube scan. The VSCode extension is packaged
with `vsce` (release flow); versions are independent (no cross-repo sync).

## Related repos

- `tree-sitter-mux` - tree-sitter grammar (Neovim/Helix/Emacs).
- `mux-website` - docs site (third spec consumer, Shiki).
- `mux-compiler` - the language/compiler.

**Add to this document as you learn vital information.**
