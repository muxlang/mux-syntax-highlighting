#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const yauzl = require('yauzl');

const archive = path.resolve(__dirname, '..', 'dist', 'language-mux.vsix');
const packageManifest = path.resolve(
  __dirname,
  '..',
  'textmate-mux',
  'vscode-language-mux',
  'package.json',
);

function openZip(file) {
  return new Promise((resolve, reject) => {
    yauzl.open(file, { lazyEntries: true }, (error, zipFile) => {
      if (error) reject(error);
      else resolve(zipFile);
    });
  });
}

function readEntriesAndManifest(zipFile) {
  return new Promise((resolve, reject) => {
    const entries = [];
    let manifest;
    const cleanup = () => {
      zipFile.off('entry', onEntry);
      zipFile.off('end', onEnd);
      zipFile.off('error', onError);
    };
    const onEntry = (entry) => {
      entries.push(entry);
      if (entry.fileName === 'extension/package.json') {
        readEntry(zipFile, entry).then(onManifestRead, onError);
      } else {
        zipFile.readEntry();
      }
    };
    const onManifestRead = (contents) => {
      manifest = contents;
      zipFile.readEntry();
    };
    const onEnd = () => {
      cleanup();
      resolve({ entries, manifest });
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };

    zipFile.on('entry', onEntry);
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

  try {
    const { entries, manifest } = await readEntriesAndManifest(zipFile);
    const files = new Set(entries.map((entry) => entry.fileName));
    return { files, manifest };
  } finally {
    zipFile.close();
  }
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
    'extension/changelog.md',
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
  const expectedPackage = JSON.parse(fs.readFileSync(packageManifest, 'utf8'));
  if (packageJson.version !== expectedPackage.version) {
    throw new Error(
      `VSIX version ${packageJson.version} does not match source version ${expectedPackage.version}`,
    );
  }

  const grammar = packageJson.contributes?.grammars?.find((item) => item.language === 'mux');
  if (
    packageJson.publisher !== 'muxlang' ||
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
