import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist", "coverage"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "react-refresh/only-export-components": [
        "error",
        {
          allowExportNames: ["buttonVariants"],
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      // Higher than the 500-line default elsewhere: packages/ui vendors shadcn CLI-generated
      // primitives (e.g. sidebar.tsx bundles Sidebar/SidebarProvider/SidebarMenu/... in one file
      // by shadcn convention), so the limit is raised here rather than exempted or hand-split.
      "max-lines": [
        "error",
        {
          max: 700,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
])
