// @ts-check
const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
    root: true,
    env: {
        node: true
    },
    extends: [
        'eslint:recommended',
        'prettier',
        'plugin:n/recommended',
        'plugin:import/recommended',
        'eslint-config-async'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    plugins: ['prettier', 'n'],
    ignorePatterns: ['node_modules', 'playground/utils-project-template'],
    rules: {
        'linebreak-style': ['off', 'unix'],
        'no-console': 'off',
        'no-unused-vars': [
            'error',
            {
                args: 'none'
            }
        ],
        'keyword-spacing': ['error'],
        'no-useless-escape': ['off'],
        'require-atomic-updates': 'off',
        'n/handle-callback-err': 'off',
        'n/no-sync': 'off',
        'n/no-callback-literal': 'off'
    }
});
