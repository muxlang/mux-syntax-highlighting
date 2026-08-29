const eslint = require('@eslint/js');

module.exports = [
  {
    ignores: ['node_modules/**', 'textmate-mux/vscode-language-mux/node_modules/**'],
  },
  eslint.configs.recommended,
  {
    files: ['scripts/**/*.js', '*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        console: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'multi-line'],
    },
  },
];
