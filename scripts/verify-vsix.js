#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const yauzl = require('yauzl');

const archive = path.resolve(__dirname, '..', 'dist', 'language-mux.vsix');

function readVsix(file) {
  return new Promise((resolve, reject) => {
    yauzl.open(file, { lazyEntries: true }, (openError, zipFile) => {
      if (openError) {
        reject(openError);
        return;
      }

      const files = new Set();
      let manifest;

      zipFile.on('error', reject);
      zipFile.on('end', () => resolve({ files, manifest }));
      zipFile.on('entry', (entry) => {
        files.add(entry.fileName);
        if (entry.fileName !== 'extension/package.json') {
          zipFile.readEntry();
          return;
        }

        zipFile.openReadStream(entry, (streamError, stream) => {
          if (streamError) {
            reject(streamError);
            return;
          }

          const chunks = [];
          stream.on('error', reject);
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => {
            manifest = Buffer.concat(chunks).toString('utf8');
            zipFile.readEntry();
          });
        });
      });

      zipFile.readEntry();
    });
  });
}

async function verify() {
  if (!fs.existsSync(archive)) {
    throw new Error(`VSIX not found: ${archive}; run npm run package:vscode first`);
  }

  const { files, manifest } = await readVsix(archive);
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
  if (!manifest) {
    throw new Error('VSIX is missing extension/package.json');
  }

  const packageJson = JSON.parse(manifest);
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
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
