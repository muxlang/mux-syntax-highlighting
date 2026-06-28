#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const { execFileSync } = require('node:child_process');

function readText(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, key) => {
        if (key === '$schema') {
          return acc;
        }
        acc[key] = sortValue(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(sortValue(value), null, 2);
}

function flattenNumbers(matrix) {
  return Object.values(matrix.operators).flatMap(items => items.map(item => item.symbol));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertContainsAll(haystack, needles, label) {
  const missing = needles.filter(needle => !haystack.includes(needle));
  assert(missing.length === 0, `${label} missing: ${missing.join(', ')}`);
}

const matrix = readJson('shared/syntax-matrix.json');
// Regenerate the TextMate grammar from the canonical spec. (The tree-sitter
// grammar + highlights now live in the tree-sitter-mux repo; their parity is
// checked there.)
const safePath = ['/usr/bin', '/usr/local/bin', '/bin'].filter(p => fs.existsSync(p)).join(path.delimiter);
const execOptions = { stdio: 'inherit', env: { ...process.env, PATH: safePath } };
execFileSync(process.execPath, [path.join(root, 'scripts', 'generate-syntax.js')], execOptions);

const textmateCanonical = readJson('textmate-mux/source.mux.json');
const textmatePackage = readJson('textmate-mux/vscode-language-mux/source.mux.json');

assert(
  stableStringify(textmateCanonical) === stableStringify(textmatePackage),
  'TextMate canonical grammar and VSCode package grammar are out of sync',
);

const normalizedTextmate = readText('textmate-mux/source.mux.json').replaceAll('\\', '');

const expectedKeywords = [
  ...matrix.keywords.control,
  ...matrix.keywords.declaration,
  ...matrix.keywords.operator,
  ...matrix.keywords.constant,
  ...matrix.keywords.boolean_literals,
];
const expectedOperators = flattenNumbers(matrix);
const expectedDelimiters = matrix.delimiters.map(item => item.symbol);

assertContainsAll(normalizedTextmate, expectedKeywords, 'TextMate keywords');
assertContainsAll(normalizedTextmate, expectedOperators, 'TextMate operators');
assertContainsAll(normalizedTextmate, expectedDelimiters, 'TextMate delimiters');

assertContainsAll(
  normalizedTextmate,
  [
    'comment.line.double-slash.mux',
    'comment.block.mux',
    'string.quoted.single.mux',
    'string.quoted.double.mux',
    'string.quoted.triple.double.mux',
    'variable.language.mux',
    'variable.other.mux',
  ],
  'TextMate scopes',
);

console.log('Mux TextMate syntax parity checks passed.');
