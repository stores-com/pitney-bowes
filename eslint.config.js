const globals = require('globals');
const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        ignores: ['node_modules/*'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.mocha
            }
        },
        rules: {
            'brace-style': ['error', '1tbs', { allowSingleLine: true }],
            'comma-dangle': ['error', 'never'],
            'dot-notation': 'error',
            'no-array-constructor': 'error',
            'no-console': 'off',
            'no-fallthrough': 'off',
            'no-inline-comments': 'warn',
            'no-trailing-spaces': 'error',
            'no-unused-vars': ['error', { caughtErrors: 'none' }],
            'object-curly-spacing': ['error', 'always'],
            quotes: ['error', 'single'],
            semi: ['error', 'always']
        }
    }
];
