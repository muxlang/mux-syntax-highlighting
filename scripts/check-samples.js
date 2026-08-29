#!/usr/bin/env node

// Keep the checked-in samples useful by making them executable consumers of
// the canonical syntax matrix. This deliberately checks representative
// lexemes rather than requiring every token in one teaching sample.

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function executableSource(source) {
  return source
    .replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ' ')
    .replace(/"""[\s\S]*?"""|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, ' ');
}

function patternFor(term) {
  if (!/^[A-Za-z0-9_]+$/.test(term)) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const adjacentOperator = '[!%&*+\\-./:<=>?^|~]';
    return new RegExp(`(?<!${adjacentOperator})${escaped}(?!${adjacentOperator})`);
  }
  return new RegExp(`(?<![A-Za-z0-9_])${term}(?![A-Za-z0-9_])`);
}

function assertTokens(source, terms, label) {
  const missing = terms.filter((term) => !patternFor(term).test(source));
  assert(missing.length === 0, `${label} is missing: ${missing.join(', ')}`);
}

const matrix = readJson('shared/syntax-matrix.json');
const cases = [
  {
    path: 'shared/linguist/sample.mux',
    keywords: ['func', 'returns', 'if', 'match', 'none', 'true'],
    types: ['void'],
    operators: ['=', '>', '+'],
    delimiters: ['(', ')', '{', '}'],
    literals: ['42', '3.14', '"Mux"'],
  },
  {
    path: 'shared/samples/validation.mux',
    keywords: ['auto', 'class', 'interface', 'enum', 'for', 'while', 'return', 'in', 'none'],
    types: ['int', 'string', 'result'],
    operators: ['=', '-=', '**', '==', '&&', '||', '!', '&', '.', '<', '>'],
    delimiters: ['[', ']', ','],
    literals: ['1_000', '3.14e-2', "'a'", '"hello"', '"""'],
  },
];

const allKeywords = Object.values(matrix.keywords).flat();
const allTypes = matrix.types.builtin;
const allOperators = Object.values(matrix.operators)
  .flat()
  .map((item) => item.symbol);
const allDelimiters = matrix.delimiters.map((item) => item.symbol);

for (const testCase of cases) {
  const source = readText(testCase.path);
  const code = executableSource(source);
  assert(source.trim().length > 0, `${testCase.path} is empty`);
  assert(source.includes('//') || source.includes('/*'), `${testCase.path} has no comment sample`);

  assertTokens(code, testCase.keywords, `${testCase.path} keywords`);
  assertTokens(code, testCase.types, `${testCase.path} types`);
  assertTokens(code, testCase.operators, `${testCase.path} operators`);
  assertTokens(code, testCase.delimiters, `${testCase.path} delimiters`);
  assertTokens(source, testCase.literals, `${testCase.path} literals`);

  for (const token of testCase.keywords) {
    assert(allKeywords.includes(token), `Unknown keyword: ${token}`);
  }
  for (const token of testCase.types) {
    assert(allTypes.includes(token), `Unknown type: ${token}`);
  }
  for (const token of testCase.operators) {
    assert(allOperators.includes(token), `Unknown operator: ${token}`);
  }
  for (const token of testCase.delimiters) {
    assert(allDelimiters.includes(token), `Unknown delimiter: ${token}`);
  }
}

const validation = readText('shared/samples/validation.mux');
assert(validation.includes('"""\nmulti-line\nstring\n"""'), 'multiline string sample is missing');
assert(validation.includes('numbers[1:3]'), 'slice sample is missing');
assert(validation.includes('auto _unused'), 'leading underscore identifier sample is missing');

console.log(`Syntax sample checks passed (${cases.length} samples).`);
