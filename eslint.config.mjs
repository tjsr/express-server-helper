import tjsrEslintConfig from '@tjsr/eslint-config';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import-x';

// Keep the shared import rules compatible with ESLint 10.
const compatibleConfig = tjsrEslintConfig.map((config) => config.plugins?.import
  ? { ...config, plugins: { ...config.plugins, import: importPlugin } }
  : config);

export default defineConfig({
  extends: [
    ...compatibleConfig,
  ],
  files: ["**/*.ts"],
  ignores: ["dist/**"],
});
