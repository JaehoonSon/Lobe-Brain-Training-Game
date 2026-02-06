// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const unusedImports = require("eslint-plugin-unused-imports");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "import/no-duplicates": "off",
      "import/namespace": "off",
      "import/no-unresolved": "off",
      // Disabled: unrs-resolver native binding issues
      "import/order": "off",
      // Disable base rules and use unused-imports instead (auto-fixable)
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Disable exhaustive-deps - often gives false positives with callbacks
      "react-hooks/exhaustive-deps": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: ["dist/*", "supabase/functions/**/*"],
  },
]);
