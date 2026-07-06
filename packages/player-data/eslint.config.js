import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist", "coverage"]),
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.ts"],
    ignores: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "max-lines": [
        "error",
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  // This package is framework-agnostic player-data sync/storage logic — no JSX/React allowed. Move
  // any UI code to apps/web instead (see shared/player-data for the provider that consumes this).
  {
    files: ["**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message:
            ".tsx files are not allowed in @workspace/player-data — this package is pure TS sync/storage logic with no React/JSX. Put UI code in apps/web instead.",
        },
      ],
    },
  },
])
