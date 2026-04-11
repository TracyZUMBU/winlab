// https://docs.expo.dev/guides/using-eslint/
const path = require('path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// Pin parser path for eslint-plugin-import: string "@typescript-eslint/parser" can resolve to
// apps/mobile/node_modules (empty in hoisted workspaces) when ESLint runs from the editor.
const typeScriptImportParserPath = require.resolve('@typescript-eslint/parser', {
  paths: [__dirname, path.join(__dirname, '..', '..')],
});

module.exports = defineConfig([
  expoConfig,
  {
    settings: {
      'import/parsers': {
        [typeScriptImportParserPath]: ['.ts', '.tsx', '.cts', '.mts', '.d.ts'],
      },
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
