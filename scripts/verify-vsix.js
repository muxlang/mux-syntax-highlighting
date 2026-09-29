#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const archive = path.resolve(__dirname, '..', 'dist', 'language-mux.vsix');
if (!fs.existsSync(archive)) {
  throw new Error(`VSIX not found: ${archive}; run npm run package:vscode first`);
}

const listing = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8' });
if (listing.status !== 0) {
  throw new Error(`Could not list VSIX contents: ${listing.stderr}`);
}

const files = new Set(listing.stdout.split(/\r?\n/).filter(Boolean));
const required = [
  'extension/package.json',
  'extension/source.mux.json',
  'extension/language-configuration.json',
  'extension/mux-icon.png',
  'extension/LICENSE.txt',
  'extension/readme.md',
  'extension/extension.bundle.js',
];
const missing = required.filter((file) => !files.has(file));
if (missing.length > 0) {
  throw new Error(`VSIX is missing required files: ${missing.join(', ')}`);
}

const manifest = spawnSync('unzip', ['-p', archive, 'extension/package.json'], {
  encoding: 'utf8',
});
if (manifest.status !== 0) {
  throw new Error(`Could not read VSIX manifest: ${manifest.stderr}`);
}
const packageJson = JSON.parse(manifest.stdout);
const grammar = packageJson.contributes?.grammars?.find((item) => item.language === 'mux');
if (
  packageJson.publisher !== 'mux-lang' ||
  packageJson.name !== 'language-mux' ||
  grammar?.scopeName !== 'source.mux' ||
  grammar?.path !== './source.mux.json' ||
  packageJson.main !== 'extension.bundle.js' ||
  packageJson.contributes?.configuration?.properties?.['mux.serverPath']?.default !== 'mux'
) {
  throw new Error('VSIX manifest does not declare the maintained Mux grammar and LSP client');
}

console.log(`VSIX contents verified (${files.size} files).`);
