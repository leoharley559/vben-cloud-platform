import { defineConfig } from '@vben/eslint-config';

/**
 * App-local ESLint config: pin TypeScript project to tsconfig.json so
 * src TypeScript files are not parsed with tsconfig.node.json (vite only).
 */
export default defineConfig([
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
