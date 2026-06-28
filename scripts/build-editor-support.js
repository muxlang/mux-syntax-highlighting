#!/usr/bin/env node

// Generates the editor-support configs (TextMate for VSCode/JetBrains, Sublime,
// tree-sitter highlight queries for Neovim/Helix) from the canonical
// shared/syntax-matrix.json. Ported from the former build_syntax_highlighting.py
// so the whole toolchain is Node.

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SPEC_PATH = path.join(REPO_ROOT, 'shared', 'syntax-matrix.json');
const PUSH_LINE = '      push:';
const POP_TRUE_LINE = '          pop: true';
const TEXTMATE_FILENAME = 'mux.tmLanguage.json';
const TREE_SITTER_HIGHLIGHTS = 'highlights.scm';

function readSpec() {
  const matrix = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8'));
  return specFromMatrix(matrix);
}

// Adapt the canonical syntax-matrix.json into the structure the editor-support
// generators consume. syntax-matrix.json is the single source of truth (validated
// against the compiler lexer).
function specFromMatrix(matrix) {
  const keywords = matrix.keywords;
  const operators = {};
  for (const [category, entries] of Object.entries(matrix.operators)) {
    operators[category] = entries.map(entry => entry.symbol);
  }
  const brackets = matrix.delimiters
    .map(d => d.symbol)
    .filter(s => ['(', ')', '{', '}', '[', ']'].includes(s));
  const delimiters = matrix.delimiters
    .map(d => d.symbol)
    .filter(s => [',', ':'].includes(s));
  return {
    language: {
      name: matrix.language,
      scope_name: matrix.scope,
      file_extensions: matrix.file_extensions.map(ext => ext.replace(/^\./, '')),
    },
    keywords: {
      control: keywords.control,
      // is/as/in are operator keywords in the matrix; group them with
      // declarations for keyword highlighting.
      declaration: [...keywords.declaration, ...keywords.operator],
      literal: [...keywords.boolean_literals, ...keywords.constant],
    },
    types: { builtin: matrix.types.builtin },
    operators,
    punctuation: { brackets, delimiters },
    // Word-bounded presentation regexes for editor highlighting; the canonical
    // spec carries lexer-style patterns, not these editor variants.
    regex: {
      identifier: String.raw`\b[_A-Za-z][_A-Za-z0-9]*\b`,
      number: String.raw`\b(?:\d+\.\d+|\d+)\b`,
    },
  };
}

function groupedKeywords(spec) {
  return [...spec.keywords.control, ...spec.keywords.declaration];
}

function escapeRegexTerms(terms) {
  const specials = ['.', '^', '$', '*', '+', '?', '{', '}', '[', ']', '|', '(', ')'];
  return terms.map(term => {
    let value = term;
    for (const ch of specials) {
      value = value.split(ch).join('\\' + ch);
    }
    return value;
  });
}

function uniqueInOrder(items) {
  return [...new Set(items)];
}

function allOperatorTerms(spec) {
  const terms = [];
  for (const group of Object.values(spec.operators)) {
    terms.push(...group);
  }
  return terms;
}

function buildTextmate(spec) {
  const language = spec.language;
  const keywordPattern = escapeRegexTerms(groupedKeywords(spec)).join('|');
  const literalPattern = escapeRegexTerms(spec.keywords.literal).join('|');
  const typePattern = escapeRegexTerms(spec.types.builtin).join('|');
  const operatorPattern = escapeRegexTerms(uniqueInOrder(allOperatorTerms(spec))).join('|');

  return {
    $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
    name: language.name,
    scopeName: language.scope_name,
    fileTypes: language.file_extensions,
    patterns: [
      { include: '#comments' },
      { include: '#strings' },
      { include: '#numbers' },
      { include: '#keywords' },
      { include: '#types' },
      { include: '#operators' },
      { include: '#punctuation' },
      { include: '#identifiers' },
    ],
    repository: {
      comments: {
        patterns: [
          { name: 'comment.line.double-slash.mux', match: '//.*$' },
          { name: 'comment.block.mux', begin: String.raw`/\*`, end: String.raw`\*/` },
        ],
      },
      strings: {
        patterns: [
          {
            name: 'string.quoted.double.mux',
            begin: '"',
            end: '"',
            patterns: [{ name: 'constant.character.escape.mux', match: String.raw`\\.` }],
          },
          {
            name: 'string.quoted.single.mux',
            begin: "'",
            end: "'",
            patterns: [{ name: 'constant.character.escape.mux', match: String.raw`\\.` }],
          },
        ],
      },
      numbers: {
        patterns: [{ name: 'constant.numeric.mux', match: spec.regex.number }],
      },
      keywords: {
        patterns: [
          { name: 'keyword.control.mux', match: String.raw`\b(?:${keywordPattern})\b` },
          { name: 'constant.language.mux', match: String.raw`\b(?:${literalPattern})\b` },
        ],
      },
      types: {
        patterns: [{ name: 'storage.type.builtin.mux', match: String.raw`\b(?:${typePattern})\b` }],
      },
      operators: {
        patterns: [{ name: 'keyword.operator.mux', match: `(?:${operatorPattern})` }],
      },
      punctuation: {
        patterns: [
          { name: 'punctuation.bracket.mux', match: String.raw`[(){}\[\]]` },
          { name: 'punctuation.separator.mux', match: '[,:]' },
        ],
      },
      identifiers: {
        patterns: [{ name: 'variable.other.readwrite.mux', match: spec.regex.identifier }],
      },
    },
  };
}

function buildSublimeSyntax(spec) {
  const language = spec.language;
  const keywords = groupedKeywords(spec);
  const literals = spec.keywords.literal;
  const types = spec.types.builtin;
  const operatorTerms = allOperatorTerms(spec);

  const keywordPattern = escapeRegexTerms(keywords).join('|');
  const literalPattern = escapeRegexTerms(literals).join('|');
  const typePattern = escapeRegexTerms(types).join('|');
  const sortedOperators = [...operatorTerms].sort((a, b) => b.length - a.length);
  const operatorPattern = escapeRegexTerms(sortedOperators).join('|');

  return [
    '%YAML 1.2',
    '---',
    `name: ${language.name}`,
    'file_extensions:',
    ...language.file_extensions.map(ext => `  - ${ext}`),
    `scope: ${language.scope_name}`,
    'contexts:',
    '  main:',
    '    - include: comments',
    '    - include: strings',
    '    - include: numbers',
    '    - include: keywords',
    '    - include: types',
    '    - include: operators',
    '    - include: punctuation',
    '  comments:',
    '    - match: //.*$',
    '      scope: comment.line.double-slash.mux',
    String.raw`    - match: /\*`,
    '      scope: punctuation.definition.comment.begin.mux',
    PUSH_LINE,
    '        - meta_scope: comment.block.mux',
    String.raw`        - match: \*/`,
    '          scope: punctuation.definition.comment.end.mux',
    POP_TRUE_LINE,
    '  strings:',
    '    - match: \'"\'',
    '      scope: punctuation.definition.string.begin.mux',
    PUSH_LINE,
    '        - meta_scope: string.quoted.double.mux',
    String.raw`        - match: '\.'`,
    '          scope: constant.character.escape.mux',
    '        - match: \'"\'',
    '          scope: punctuation.definition.string.end.mux',
    POP_TRUE_LINE,
    '    - match: "\'"',
    '      scope: punctuation.definition.string.begin.mux',
    PUSH_LINE,
    '        - meta_scope: string.quoted.single.mux',
    String.raw`        - match: '\.'`,
    '          scope: constant.character.escape.mux',
    '        - match: "\'"',
    '          scope: punctuation.definition.string.end.mux',
    POP_TRUE_LINE,
    '  numbers:',
    `    - match: '${spec.regex.number}'`,
    '      scope: constant.numeric.mux',
    '  keywords:',
    String.raw`    - match: '\b(?:${keywordPattern})\b'`,
    '      scope: keyword.control.mux',
    String.raw`    - match: '\b(?:${literalPattern})\b'`,
    '      scope: constant.language.mux',
    '  types:',
    String.raw`    - match: '\b(?:${typePattern})\b'`,
    '      scope: storage.type.builtin.mux',
    '  operators:',
    `    - match: '(?:${operatorPattern})'`,
    '      scope: keyword.operator.mux',
    '  punctuation:',
    String.raw`    - match: '[(){}\[\]]'`,
    '      scope: punctuation.bracket.mux',
    "    - match: '[,:]'",
    '      scope: punctuation.separator.mux',
    '...',
    '',
  ].join('\n');
}

function buildTreesitterQuery(spec) {
  const keywords = groupedKeywords(spec);
  const literals = spec.keywords.literal;
  const types = spec.types.builtin;
  const operatorTerms = allOperatorTerms(spec);

  const lines = [
    ';;; Generated by scripts/build-editor-support.js',
    ';;; Keep in sync with shared/syntax-matrix.json',
    '',
    '(comment) @comment',
    '(line_comment) @comment',
    '(block_comment) @comment',
    '(string_literal) @string',
    '(char_literal) @string.special',
    '(int_literal) @number',
    '(float_literal) @number.float',
    '',
    '(identifier) @variable',
    '(function_declaration name: (identifier) @function)',
    '(call_expression function: (identifier) @function.call)',
    '(type_identifier) @type',
    '',
    '[',
  ];
  for (const keyword of keywords) {
    lines.push(`  "${keyword}"`);
  }
  lines.push('] @keyword', '', '[');
  for (const literal of literals) {
    lines.push(`  "${literal}"`);
  }
  lines.push('] @constant.builtin', '', '[');
  for (const typ of types) {
    lines.push(`  "${typ}"`);
  }
  lines.push('] @type.builtin', '', '[');
  for (const operator of uniqueInOrder(operatorTerms)) {
    lines.push(`  "${operator}"`);
  }
  lines.push('] @operator', '', '[');
  for (const bracket of spec.punctuation.brackets) {
    lines.push(`  "${bracket}"`);
  }
  lines.push('] @punctuation.bracket', '', '[');
  for (const delimiter of spec.punctuation.delimiters) {
    lines.push(`  "${delimiter}"`);
  }
  lines.push('] @punctuation.delimiter', '');

  return lines.join('\n');
}

function buildLanguageConfiguration() {
  return {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [['{', '}'], ['[', ']'], ['(', ')']],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [['{', '}'], ['[', ']'], ['(', ')'], ['"', '"'], ["'", "'"]],
  };
}

function toJson(payload) {
  return JSON.stringify(payload, null, 2) + '\n';
}

function generateOutputs(spec) {
  const textmate = buildTextmate(spec);
  const sublime = buildSublimeSyntax(spec);
  const treesitter = buildTreesitterQuery(spec);
  const languageConfig = buildLanguageConfiguration();

  const textmateJson = toJson(textmate);
  const languageConfigJson = toJson(languageConfig);

  const r = (...parts) => path.join(REPO_ROOT, ...parts);
  return new Map([
    [r('editor-support', 'textmate', TEXTMATE_FILENAME), textmateJson],
    [r('editor-support', 'vscode', 'syntaxes', TEXTMATE_FILENAME), textmateJson],
    [r('editor-support', 'vscode', 'language-configuration.json'), languageConfigJson],
    [r('editor-support', 'jetbrains', 'textmate', TEXTMATE_FILENAME), textmateJson],
    [r('editor-support', 'sublime', 'Mux.sublime-syntax'), sublime],
    [r('editor-support', 'treesitter', 'queries', TREE_SITTER_HIGHLIGHTS), treesitter],
    [r('editor-support', 'neovim', 'queries', 'mux', TREE_SITTER_HIGHLIGHTS), treesitter],
    [r('editor-support', 'helix', 'runtime', 'queries', 'mux', TREE_SITTER_HIGHLIGHTS), treesitter],
  ]);
}

function syncOutput(filePath, expected, checkOnly) {
  if (fs.existsSync(filePath)) {
    const actual = fs.readFileSync(filePath, 'utf8');
    if (actual === expected) {
      return false;
    }
  }
  if (checkOnly) {
    process.stderr.write(`Stale: ${filePath}\n`);
  } else {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, expected);
  }
  return true;
}

function run(checkOnly) {
  const spec = readSpec();
  const outputs = generateOutputs(spec);

  let hadDifference = false;
  for (const [filePath, expected] of outputs) {
    hadDifference = syncOutput(filePath, expected, checkOnly) || hadDifference;
  }

  return checkOnly && hadDifference ? 1 : 0;
}

const checkOnly = process.argv.includes('--check');
process.exit(run(checkOnly));
