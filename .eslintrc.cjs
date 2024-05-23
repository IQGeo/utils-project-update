// @ts-check
const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
    root: true,
    env: {
        node: true
    },
    extends: [
        'airbnb-base',
        'eslint:recommended',
        'prettier',
        'plugin:n/recommended',
        'plugin:import/recommended'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    plugins: ['n', 'prettier'],
    ignorePatterns: ['node_modules'],
    rules: {
        'no-console': 'off',
        'no-param-reassign': [2, { props: false }],
        'no-new': 'off',
        'no-restricted-syntax': 'off',
        'no-cond-assign': ['error', 'except-parens'],
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
        'arrow-body-style': 'off',
        'consistent-return': 'off',
        'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
        camelcase: 'off',

        'import/prefer-default-export': 'off',
        'import/extensions': 'off',
        'import/no-extraneous-dependencies': ['error', { devDependencies: ['.eslintrc.cjs'] }],

        'n/shebang': 'off',
        'n/no-process-exit': 'off'
    },
    settings: {
        'import/resolver': {
            node: true
        }
    }
});
