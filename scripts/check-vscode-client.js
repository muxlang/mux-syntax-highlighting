#!/usr/bin/env node

const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

let serverPath = 'mux';
let constructed;
let stopped = false;
let startError;
let errorMessage;
let openedGuide;
const originalLoad = Module._load;

class MockLanguageClient {
  constructor(id, name, serverOptions, clientOptions) {
    constructed = { id, name, serverOptions, clientOptions };
  }

  async start() {
    if (startError) {
      throw startError;
    }
  }

  async stop() {
    stopped = true;
  }
}

Module._load = function (request, parent, isMain) {
  if (request === 'vscode') {
    return {
      workspace: {
        getConfiguration: () => ({ get: (_key, fallback) => serverPath ?? fallback }),
      },
      window: {
        showErrorMessage: async (message, action) => {
          errorMessage = { message, action };
          return action;
        },
      },
      env: {
        openExternal: async (uri) => {
          openedGuide = uri;
        },
      },
      Uri: { parse: (uri) => uri },
    };
  }
  if (request === 'vscode-languageclient/node') {
    return { LanguageClient: MockLanguageClient };
  }
  return originalLoad.call(this, request, parent, isMain);
};

async function verify() {
  try {
    const extension = require(
      path.resolve(__dirname, '..', 'textmate-mux', 'vscode-language-mux', 'extension.js'),
    );
    const context = { subscriptions: [] };

    await extension.activate(context);
    assert.equal(constructed.id, 'mux');
    assert.equal(constructed.serverOptions.command, 'mux');
    assert.deepEqual(constructed.serverOptions.args, ['lsp']);
    assert.deepEqual(constructed.clientOptions.documentSelector, [
      { scheme: 'file', language: 'mux' },
    ]);
    assert.equal(context.subscriptions.length, 1);

    await extension.deactivate();
    assert.equal(stopped, true);

    serverPath = '/opt/mux/bin/mux';
    await extension.activate({ subscriptions: [] });
    assert.equal(constructed.serverOptions.command, serverPath);

    startError = new Error('server exited before initialization');
    await extension.activate({ subscriptions: [] });
    assert.match(errorMessage.message, /Install Mux 0\.12\.0 or newer/);
    assert.match(errorMessage.message, /mux\.serverPath/);
    assert.equal(errorMessage.action, 'Open install guide');
    assert.equal(openedGuide, 'https://mux-lang.dev/docs/getting-started/quick-start');
  } finally {
    Module._load = originalLoad;
  }
}

verify().then(() => console.log('VSCode client startup checks passed.'));
