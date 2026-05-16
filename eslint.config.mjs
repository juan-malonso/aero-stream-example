import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

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

export default [
  {
    ignores: [
      '.next/**',
      '.open-next/**',
      '.wrangler/**',
      'node_modules/**',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: browserGlobals,
      parserOptions: {
        project: false,
      },
    },
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-console': 'off',
    },
  },
  eslintConfigPrettier,
];
