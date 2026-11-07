// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'replica/*'],
  },
  {
    // TypeScript already checks imports; this rule misreads re-exported enums (Notifications.AndroidImportance).
    rules: { 'import/namespace': 'off' },
  },
]);
