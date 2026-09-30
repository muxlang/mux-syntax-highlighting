'use strict';

const vscode = require('vscode');
const { LanguageClient } = require('vscode-languageclient/node');

const minimumMuxVersion = '0.12.0';
const installGuide = 'https://mux-lang.dev/docs/getting-started/quick-start';
let client;

function createClient(context) {
  const command = vscode.workspace.getConfiguration('mux').get('serverPath', 'mux');
  const serverOptions = {
    command,
    args: ['lsp'],
  };
  const clientOptions = {
    documentSelector: [{ scheme: 'file', language: 'mux' }],
    outputChannelName: 'Mux Language Server',
  };
  client = new LanguageClient('mux', 'Mux Language Server', serverOptions, clientOptions);
  context.subscriptions.push(client);
  return client.start();
}

async function activate(context) {
  try {
    await createClient(context);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const action = 'Open install guide';
    const selected = await vscode.window.showErrorMessage(
      `Mux language server could not start. Install Mux ${minimumMuxVersion} or newer, make sure mux is on PATH or set mux.serverPath, then restart VSCode.\n${detail}`,
      action,
    );
    if (selected === action) {
      await vscode.env.openExternal(vscode.Uri.parse(installGuide));
    }
  }
}

async function deactivate() {
  if (client) {
    await client.stop();
  }
}

module.exports = { activate, deactivate };
