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
CI runs each parity check once, alongside sample checks. The VSCode client
tests run in a separate job that uploads LCOV for SonarQube. The required
Syntax Checks status combines those jobs, which can run in parallel.

## Documentation

See [`README.md`](README.md) and the generator documentation under `scripts/`.
See the [cross-repo testing policy](https://github.com/muxlang/mux-context/blob/main/docs/testing-policy.md)
for the boundary between syntax-matrix checks and downstream parser tests.
