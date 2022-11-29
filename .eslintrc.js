module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['xo', 'prettier'],
  overrides: [
    {
      extends: ['xo-typescript', 'prettier'],
      files: ['*.ts', '*.tsx'],
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {},
};
