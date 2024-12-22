import eslint from '@eslint/js';
import prettiereslint from 'eslint-config-prettier';
import chaifriendlyeslint from 'eslint-plugin-chai-friendly';
import importeslint from 'eslint-plugin-import-x';
import jsoneslint from 'eslint-plugin-json';
import { configs as liteslint } from 'eslint-plugin-lit';
import mochaeslint from 'eslint-plugin-mocha';
import nodeeslint from 'eslint-plugin-n';
import promiseeslint from 'eslint-plugin-promise';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tsdoc from 'eslint-plugin-tsdoc';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist'],
  },
  eslint.configs.recommended,
  liteslint['flat/recommended'],
  jsoneslint.configs['recommended-with-comments'],
  mochaeslint.configs.flat.recommended,
  promiseeslint.configs['flat/recommended'],
  importeslint.flatConfigs.recommended,
  importeslint.flatConfigs.typescript,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettiereslint,
  {
    plugins: {
      tsdoc,
      'simple-import-sort': simpleImportSort,
      '@typescript-eslint': tseslint.plugin,
    },

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.webextensions,
      },
    },

    settings: {
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import-x/resolver': {
        typescript: {},
      },
    },
    rules: {
      'import-x/no-unresolved': [
        'error',
        {
          ignore: ['csv-parse/sync'],
        },
      ],

      'block-scoped-var': 'error',
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'eol-last': 'error',
      'no-trailing-spaces': 'error',

      quotes: [
        'warn',
        'single',
        {
          avoidEscape: true,
        },
      ],

      'linebreak-style': ['error', 'unix'],
      'no-tabs': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unicode-bom': 'error',
      'promise/prefer-await-to-then': 'error',
      curly: 'error',
      'mocha/prefer-arrow-callback': 'error',

      // TODO(#792): Remove/evaluate following rules once errors are fixed.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      'import-x/no-named-as-default-member': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // End of rules to fix.
      '@typescript-eslint/no-empty-function': [
        'error',
        {
          allow: ['private-constructors'],
        },
      ],

      'tsdoc/syntax': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.json'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      'tsdoc/syntax': 'off',
    },
  },
  {
    files: ['**/*_test.ts'],
    plugins: { 'chai-friendly': chaifriendlyeslint },
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      'chai-friendly/no-unused-expressions': 'error',
    },
  },
  {
    files: [
      // Enumeration of node scripts and configs.
      '**/web-test-runner.config.js',
      'utils/*',
      '**/snowpack.config.cjs',
      '**/commitlint.config.cjs',
      '**/.prettierrc.cjs',
      '**/eslint.config.js',
    ],
    extends: [nodeeslint.configs['flat/recommended']],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.cjs', '.ts'],
        },
      },
    },
  }
);
