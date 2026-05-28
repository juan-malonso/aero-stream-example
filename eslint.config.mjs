import eslint from '@eslint/js';
import eslintCommentsPlugin from '@eslint-community/eslint-plugin-eslint-comments';
import nextPlugin from '@next/eslint-plugin-next';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import promisePlugin from 'eslint-plugin-promise';
import regexpPlugin from 'eslint-plugin-regexp';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unicornPlugin from 'eslint-plugin-unicorn';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

import { createAeroStreamAppLintConfig } from '../aero-stream/eslint.config.mjs';

const browserGlobals = {
  clearInterval: 'readonly',
  console: 'readonly',
  document: 'readonly',
  fetch: 'readonly',
  FormData: 'readonly',
  globalThis: 'readonly',
  Headers: 'readonly',
  navigator: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  setInterval: 'readonly',
  URL: 'readonly',
};

export default tseslint.config(
  ...createAeroStreamAppLintConfig({
    eslint,
    eslintCommentsPlugin,
    globals: browserGlobals,
    importPlugin,
    prettierConfig,
    promisePlugin,
    regexpPlugin,
    sonarjsPlugin,
    simpleImportSort,
    tsconfigRootDir: import.meta.dirname,
    tseslint,
    unicornPlugin,
    unusedImportsPlugin,
  }),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
);
