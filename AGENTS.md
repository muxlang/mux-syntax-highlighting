# mux-syntax-highlighting

`mux-syntax-highlighting` owns the canonical Mux syntax matrix and the
TextMate-family, VSCode, Sublime, and JetBrains highlighting packages.

Cross-repository architecture and release facts live in
[`mux-context`](https://github.com/muxlang/mux-context). Read its canonical
[`SKILL.md`](https://github.com/muxlang/mux-context/blob/main/SKILL.md) before
changing syntax consumed by the compiler, tree-sitter, or website.

## Invariants

- `shared/syntax-matrix.json` is the single syntax source of truth.
- Regenerate TextMate and editor-support outputs with the provided Node
  scripts; generated files are not hand-edited.
- Propagate syntax changes to `tree-sitter-mux` and the website's consumers,
  then prove parity before merging.

## Quality gate

Run `node scripts/check-parity.js` and
`node scripts/build-editor-support.js --check` before committing.

## Documentation

See [`README.md`](README.md) and the generator documentation under `scripts/`.
