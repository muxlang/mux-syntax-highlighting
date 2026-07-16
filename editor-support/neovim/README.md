# Neovim Integration

Mux highlighting in Neovim uses the generated Tree-sitter query at:

- `editor-support/neovim/queries/mux/highlights.scm`

To wire this into `nvim-treesitter`, follow the Neovim section of
[tree-sitter-mux/INTEGRATION.md](https://github.com/muxlang/tree-sitter-mux/blob/main/INTEGRATION.md):
register `mux` as a custom parser (with `generate = true` on the `main` branch,
or `requires_generate_from_grammar = true` on `master`, since the parser is not
committed), add the `.mux` filetype, then `:TSInstall mux`. If you manage queries
by hand instead, copy the `queries/mux` directory here into your runtime path.

The query file is generated. Do not edit it directly.
