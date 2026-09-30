#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const yauzl = require('yauzl');

const archive = path.resolve(__dirname, '..', 'dist', 'language-mux.vsix');

function openZip(file) {
  return new Promise((resolve, reject) => {
    yauzl.open(file, { lazyEntries: true }, (error, zipFile) => {
      if (error) reject(error);
      else resolve(zipFile);
    });
  });
}

function nextEntry(zipFile) {
  return new Promise((resolve, reject) => {
    const finish = (result) => {
      zipFile.off('entry', onEntry);
      zipFile.off('end', onEnd);
      zipFile.off('error', onError);
      resolve(result);
    };
    const onEntry = (entry) => finish(entry);
    const onEnd = () => finish(null);
    const onError = (error) => {
      zipFile.off('entry', onEntry);
      zipFile.off('end', onEnd);
      zipFile.off('error', onError);
      reject(error);
    };

    zipFile.once('entry', onEntry);
    zipFile.once('end', onEnd);
    zipFile.once('error', onError);
    zipFile.readEntry();
  });
}

function readEntry(zipFile, entry) {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error) {
        reject(error);
        return;
      }

      const chunks = [];
      const onData = (chunk) => chunks.push(chunk);
      const onError = (streamError) => reject(streamError);
      const onEnd = () => resolve(Buffer.concat(chunks).toString('utf8'));
      stream.on('data', onData);
      stream.once('error', onError);
      stream.once('end', onEnd);
    });
  });
}

async function readVsix(file) {
  const zipFile = await openZip(file);
  const files = new Set();
  let manifest;

  try {
    let entry = await nextEntry(zipFile);
    while (entry) {
      files.add(entry.fileName);
      if (entry.fileName === 'extension/package.json') {
        manifest = await readEntry(zipFile, entry);
      }
      entry = await nextEntry(zipFile);
    }
  } finally {
    zipFile.close();
  }

  return { files, manifest };
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
