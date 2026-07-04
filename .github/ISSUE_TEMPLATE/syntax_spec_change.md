---
name: Syntax spec change
about: Propose a change to syntax-matrix.json (canonical spec)
title: ""
labels: needs triage
assignees: DerekCorniello
---

## Motivation

<!-- Why should the spec change? -->

## Proposed change

<!-- Which tokens, scopes, or rules change? -->

## Downstream sync checklist

<!-- Spec changes require updates in tree-sitter-mux and mux-website too. -->

- [ ] Regenerate TextMate grammar and editor-support in this repo
- [ ] Verify generated artifacts with `node scripts/check-parity.js` and `node scripts/build-editor-support.js --check`
- [ ] Update tree-sitter-mux vendored syntax-matrix.json and regenerated `queries/highlights.scm`
- [ ] Update mux-website Monaco and Shiki definitions

## Example code

```mux

```
