import tjsrEslintConfig from '@tjsr/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig({
  extends: [
    ...tjsrEslintConfig,
  ],
  files: ["**/*.ts"],
  ignores: ["dist/**"],
});
