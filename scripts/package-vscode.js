#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const extension = path.join(root, 'textmate-mux', 'vscode-language-mux');
const dist = path.join(root, 'dist');
const output = path.join(dist, 'language-mux.vsix');
const vsce = path.join(root, 'node_modules', '@vscode', 'vsce', 'vsce');
const esbuild = path.join(root, 'node_modules', 'esbuild', 'bin', 'esbuild');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

fs.mkdirSync(dist, { recursive: true });
const generator = spawnSync(process.execPath, [path.join(root, 'scripts', 'generate-syntax.js')], {
  cwd: root,
  stdio: 'inherit',
});
if (generator.status !== 0) {
  process.exit(generator.status ?? 1);
}

const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'mux-vscode-package-'));
fs.cpSync(extension, staging, {
  recursive: true,
  filter: (source) => !source.split(path.sep).includes('node_modules'),
});
const install = spawnSync(npm, ['ci', '--omit=dev', '--ignore-scripts'], {
  cwd: staging,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
const bundle =
  install.status === 0
    ? spawnSync(
        esbuild,
        [
          path.join(staging, 'extension.js'),
          '--bundle',
          '--minify',
          '--platform=node',
          '--format=cjs',
          '--external:vscode',
          `--outfile=${path.join(staging, 'extension.bundle.js')}`,
        ],
        { cwd: staging, stdio: 'inherit' },
      )
    : install;
const pack =
  bundle.status === 0
    ? spawnSync(process.execPath, [vsce, 'package', '--no-dependencies', '--out', output], {
        cwd: staging,
        stdio: 'inherit',
      })
    : bundle;
fs.rmSync(staging, { recursive: true, force: true });
process.exit(pack.status ?? 1);
