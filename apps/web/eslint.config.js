import js from "@eslint/js"
import globals from "globals"
import jsxA11y from "eslint-plugin-jsx-a11y"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"
import { tailwindSizingConfig } from "../../packages/ui/eslint.tailwind-sizing.js"

export default defineConfig([
  // schema.d.ts is generated from the API's OpenAPI document (pnpm api:types).
  globalIgnores(["dist", "coverage", "src/fsd/shared/api/schema.d.ts"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
  {
    // Tests keep the promise rules; vi.fn mocks and loosely typed fixtures make the
    // no-unsafe-* / unbound-method / require-await rules noise there.
    files: ["**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}", "e2e/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/require-await": "off",
      // Its contextual check misreads widening fixture/mock assertions (`undefined as unknown`,
      // `{ ... } as ReadState<T>`) as unnecessary; removing them breaks type inference.
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
    },
  },
  {
    // FSD allows `@x` cross-import surfaces only on the entities layer. A warning until the
    // existing feature-to-feature `@x` imports are refactored away; then raise it to an error.
    files: ["src/fsd/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              regex: String.raw`^@/(?:features|widgets|pages)/[^/]+/@x(?:/|$)`,
              message:
                "`@x` is for the entities layer only. Merge the slices, move the shared logic into an entity, compose from a page, or import the slice's public API.",
            },
          ],
        },
      ],
    },
  },
  {
    // steiger only checks src/fsd, so files outside it (main.tsx, src/test fixtures) import
    // slices through their public API here.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/fsd/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: String.raw`^@/(?:pages|widgets|features|entities)/[^/]+/.+`,
              message:
                "Import the slice's public API (`@/<layer>/<slice>`), not its internal files.",
            },
          ],
        },
      ],
    },
  },
  {
    // The steiger plugin's types come from @steiger/toolkit, which is not resolvable from here.
    files: ["steiger.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      // A ceiling that stops runaway files without manufacturing split-out hooks.
      "max-lines": [
        "warn",
        {
          max: 800,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  tailwindSizingConfig,
])
