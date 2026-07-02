# mux-syntax-highlighting: AI Agent Guidelines

TextMate-family syntax highlighting for Mux (VSCode/Sublime/JetBrains) + the
editor-support configs + the canonical syntax spec. Part of the multi-repo
[muxlang](https://github.com/muxlang) ecosystem. Tree-sitter is a SEPARATE repo
(`tree-sitter-mux`).

> Cross-repo architecture, design rationale, the feature map, and the release
> process live in [muxlang/mux-context](https://github.com/muxlang/mux-context).

## Critical Rules

- **No special characters** - avoid em-dashes, emojis, or other non-ASCII in code,
  comments, or commit messages.
- **Understand existing code first**; follow existing patterns.
- **Generated artifacts are generated, not hand-edited:** `textmate-mux/source.mux.json`
  (+ the vscode copy) come from `generate-syntax.js` (gitignored); the
  `editor-support/` configs come from `build-editor-support.js`. Edit the spec,
  then regenerate.

## Consumers of syntax-matrix.json (keep every copy in sync)

`shared/syntax-matrix.json` is the canonical spec, but it fans out to downstream
consumers that hold their own copies. `scripts/check-parity.js` only validates
artifacts generated INSIDE this repo; it does NOT know about the downstream
consumers, so a spec change can merge here while every downstream copy silently
goes stale.

When you change the spec, treat this as a required checklist and update ALL of:
1. In-repo generated artifacts: the TextMate grammar (`textmate-mux/source.mux.json`
   + the VSCode package copy) and the `editor-support/` configs. Regenerate, then
   verify with `scripts/check-parity.js` and `build-editor-support.js --check` (CI).
2. `tree-sitter-mux` - its `grammar.js` reads a VENDORED copy of `syntax-matrix.json`
   at the repo root, and `queries/highlights.scm` is generated from the spec.
3. `mux-website` - its hand-maintained Monaco (`src/monaco/muxLanguage.ts`) and
   Shiki (`src/shiki/mux.json`) definitions.

Consumers 2 and 3 have their own drift checks tracked in their own repos, but a
spec change here must still be propagated to them explicitly. A cross-repo
parity-check mechanism is planned follow-up (see muxlang/mux-context).

## One canonical spec

`shared/syntax-matrix.json` is the SINGLE source of truth (validated against the
compiler lexer). Both generators read it:
- `generate-syntax.js` - the TextMate grammar.
- `build-editor-support.js` - the editor-support configs (Sublime, JetBrains,
  Helix/Neovim queries, vscode config). It adapts the matrix via `specFromMatrix()`.

The old `editor-support/spec/definitions.json` was deleted (it had drifted - e.g.
listed `ok`/`err` as keywords and `::`/`->` as operators, none of which are real
Mux tokens). Both generators are now Node (the Python generator was ported).
Optional future cleanup: emit the website Shiki grammar from here too.

## Helix

`editor-support/helix/languages.toml` uses a GIT grammar source pointing at
`muxlang/tree-sitter-mux` (NOT a local path - that would dangle).

## Development / CI

```bash
node scripts/check-parity.js                  # TextMate parity (CI)
node scripts/build-editor-support.js --check  # editor-support parity (CI)
```

CI runs both parity checks + a SonarQube scan. The VSCode extension is packaged
with `vsce` (release flow); versions are independent (no cross-repo sync).

## Related repos

- `tree-sitter-mux` - tree-sitter grammar (Neovim/Helix/Emacs).
- `mux-website` - docs site (third spec consumer, Shiki).
- `mux-compiler` - the language/compiler.

**Add to this document as you learn vital information.**
