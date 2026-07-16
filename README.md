<div align="center">

<img src="https://mux-lang.dev/img/mux-logo.png" alt="Mux Logo" width="120">

# mux-syntax-highlighting

**TextMate-family syntax highlighting and the canonical syntax spec for [Mux](https://github.com/muxlang)**

[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![Sonar Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=muxlang_mux-syntax-highlighting&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=muxlang_mux-syntax-highlighting)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=muxlang_mux-syntax-highlighting&metric=coverage)](https://sonarcloud.io/summary/new_code?id=muxlang_mux-syntax-highlighting)

</div>

Syntax highlighting for VSCode, Sublime, and JetBrains - plus drop-in editor
configs and the **canonical syntax spec** that every downstream highlighter is
generated from. Tree-sitter-based highlighting (Neovim, Helix, Emacs) lives in the
separate [tree-sitter-mux](https://github.com/muxlang/tree-sitter-mux) repo.

---

## Installation

See [INSTALL.md](INSTALL.md) for per-editor setup (VSCode, Sublime, JetBrains,
and the tree-sitter editors). Everything installs from source for now; a
one-command install per editor is planned follow-up.

---

## Structure

- `shared/syntax-matrix.json` - the canonical syntax spec (single source of truth).
- `textmate-mux/` - TextMate grammar (generated from the spec).
  `vscode-language-mux/` is the VSCode extension package.
- `editor-support/` - drop-in configs for Sublime, JetBrains, and VSCode,
  generated from the spec. Tree-sitter editors (Neovim, Helix, Emacs) are
  configured from [tree-sitter-mux](https://github.com/muxlang/tree-sitter-mux),
  which owns the grammar they use.
- `scripts/` -
  - `generate-syntax.js` - generates the TextMate grammar from the spec.
  - `check-parity.js` - verifies the TextMate grammar matches the spec.
  - `build-editor-support.js` - generates/validates the editor-support configs.

---

## Development

```bash
node scripts/generate-syntax.js                     # regenerate the TextMate grammar
node scripts/check-parity.js                        # verify TextMate parity (CI)
node scripts/build-editor-support.js                # regenerate editor-support configs
node scripts/build-editor-support.js --check        # verify editor-support parity (CI)
```

CI runs the two parity checks plus a SonarQube scan.

---

## Consumers of syntax-matrix.json

`shared/syntax-matrix.json` is the canonical language spec, but it fans out to
several downstream consumers that hold their own copies. `scripts/check-parity.js`
only validates artifacts generated inside THIS repo; it does not know about the
downstream consumers, so a spec change can merge here while every downstream copy
silently goes stale.

Whenever you change `shared/syntax-matrix.json`, treat the following as a required
checklist and update every consumer:

- [ ] In-repo generated TextMate grammar (`textmate-mux/source.mux.json` + the
      VSCode package copy) and the `editor-support/` configs. Regenerate with
      `generate-syntax.js` / `build-editor-support.js`; verified in CI by
      `scripts/check-parity.js` and `build-editor-support.js --check`.
- [ ] `tree-sitter-mux` - vendors a copy of `syntax-matrix.json` at its repo root
      (`grammar.js` reads it, `queries/highlights.scm` is generated from it).
- [ ] `mux-website` - hand-maintained Monaco (`src/monaco/muxLanguage.ts`) and
      Shiki (`src/shiki/mux.json`) definitions.

The `tree-sitter-mux` and `mux-website` consumers have their own drift checks
tracked in their own repos, but a spec change here must still be propagated to
them explicitly. A cross-repo parity-check mechanism is planned follow-up (see
muxlang/mux-context).

When you change the spec, update the vendored copies in those repos. There is a
single canonical spec - `shared/syntax-matrix.json` - read by both generators
(`generate-syntax.js` for the TextMate grammar, `build-editor-support.js` for
the editor-support configs).

---

## Related repositories

| Repo | What it is |
|------|------------|
| [tree-sitter-mux](https://github.com/muxlang/tree-sitter-mux) | Tree-sitter grammar (Neovim/Helix/Emacs) |
| [mux-website](https://github.com/muxlang/mux-website) | Docs site (mux-lang.dev), third spec consumer (Shiki) |
| [mux-compiler](https://github.com/muxlang/mux-compiler) | The language, compiler, and CLI |
| [mux-context](https://github.com/muxlang/mux-context) | Cross-repo architecture, design rationale, glossary, releases |

---

## License

[MIT](LICENSE) - Maintained by [Derek Corniello](https://github.com/DerekCorniello)
