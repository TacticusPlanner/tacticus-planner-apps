import js from "@eslint/js"
import globals from "globals"
import jsxA11y from "eslint-plugin-jsx-a11y"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { createNodeResolver, importX } from "eslint-plugin-import-x"
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript"
import vitest from "@vitest/eslint-plugin"
import testingLibrary from "eslint-plugin-testing-library"
import regexp from "eslint-plugin-regexp"
import pluginQuery from "@tanstack/eslint-plugin-query"
import deMorgan from "eslint-plugin-de-morgan"
import unicorn from "eslint-plugin-unicorn"
import sonarjs from "eslint-plugin-sonarjs"
import eslintReact from "@eslint-react/eslint-plugin"
import noUseEffect from "eslint-plugin-react-you-might-not-need-an-effect"
import { defineConfig, globalIgnores } from "eslint/config"
import {
  sizingRestrictions,
  tailwindSizingConfig,
} from "../../packages/ui/eslint.tailwind-sizing.js"

// ui-style-guide rule 3. Radix `Toggle`/`ToggleGroupItem` set aria-pressed themselves, so only a
// hand-written attribute matches.
const HAND_ROLLED_TOGGLE = {
  selector: "JSXAttribute[name.name='aria-pressed']",
  message:
    "Hand-rolled toggle (ui-style-guide rule 3). Use `SegmentedControl` (or `ToggleGroup`) for 2–4 exclusive options, or a `ToggleGroupItem` with `FILTER_CHIP_CLASS_NAME` for an on/off filter.",
}

// ui-style-guide rule 1: the page's one `<h1>` is the shell's title (`PageHeader` on desktop, the
// mobile header), so a page uses `<h2>` and below. A screen outside the shell disables it with a
// reason.
const PAGE_H1 = {
  selector: "JSXOpeningElement[name.name='h1']",
  message:
    "The page title is the shell's `<h1>` (ui-style-guide rule 1: `PageHeader` on desktop, the mobile header). Use `<h2>` or below inside a page.",
}

// ui-style-guide (tooltips): a native `title` shows late, never on touch and never on focus. Name an
// icon button with `IconButton`, cut text with `TruncatedText`, and anything else with `Tooltip`.
// Lowercase elements and the shared components that pass `title` through to the DOM; a component's
// own `title` prop (a dialog's or a card's heading) is not a tooltip. An `<iframe>` needs its title.
const NATIVE_TITLE = {
  selector:
    "JSXOpeningElement:matches([name.name=/^(?!iframe$)[a-z]/], [name.name=/^(Button|Badge|ToggleGroupItem|Link|DropdownMenuItem|TableHead)$/]) > JSXAttribute[name.name='title']",
  message:
    "Native `title` tooltip (ui-style-guide: tooltips). Use `IconButton` for an icon-only button, `TruncatedText` for text that may be cut off, or `Tooltip` for anything else.",
}

// ui-style-guide rule 14: a raw `<button>` carries its own hover, focus and press styles. Use
// `Button` (`variant="link"` for a text action), `IconButton`, or `Pressable` for a card, tile, row
// or portrait that acts.
const RAW_BUTTON = {
  selector: "JSXOpeningElement[name.name='button']",
  message:
    'Raw `<button>` (ui-style-guide rule 14). Use `Button` (`variant="link"` for a text action), `IconButton` for an icon-only action, or `Pressable` for a card, tile, row or portrait.',
}

// ui-style-guide rule 11: the shared `Spinner` is the one spinner.
const HOME_MADE_SPINNER_ICON = {
  selector:
    "ImportDeclaration[source.value='lucide-react'] > ImportSpecifier[imported.name=/^Loader/]",
  message:
    "Home-made spinner (ui-style-guide rule 11). Use `Spinner` from `@workspace/ui/components/spinner`, or a `Skeleton` for content with a known shape.",
}

// ui-style-guide copy rule 11: numbers are formatted in the app language through one helper.
const RAW_NUMBER_FORMAT = {
  selector:
    "NewExpression[callee.object.name='Intl'][callee.property.name='NumberFormat']",
  message:
    "Build number formats with `useNumberFormat()` (or `numberFormat(locale)`) from `@/shared/lib` (ui-style-guide copy rule 11), so they follow the app language and are cached.",
}
const RAW_DATE_FORMAT = {
  selector:
    "NewExpression[callee.object.name='Intl'][callee.property.name='DateTimeFormat']",
  message:
    "Build date formats with `dateTimeFormat(locale, options)` from `@/shared/lib` (ui-style-guide copy rule 11), or use a shared date helper (`formatShortDate`, `formatDateRange`…), so they are cached and stay consistent.",
}
const TO_LOCALE_STRING = {
  selector:
    "CallExpression[callee.property.name=/^toLocale(Date|Time)?String$/]",
  message:
    "Format through the shared helpers, not `toLocaleString` (ui-style-guide copy rule 11): `useNumberFormat().format(value)` or `numberFormat(locale)` for a number, `dateTimeFormat(locale, options).format(date)` or a shared date helper (`formatShortDate`…) for a date. Both are in `@/shared/lib`.",
}

// Selectors that apply to logic files too, not only components.
const STYLE_GUIDE_LOGIC = [
  HOME_MADE_SPINNER_ICON,
  RAW_NUMBER_FORMAT,
  RAW_DATE_FORMAT,
  TO_LOCALE_STRING,
]

// Prefix for a Tailwind class: any variants (`md:`, `dark:`, `[&_svg]:`) and a leading `!`.
const classPrefix = String.raw`^(?:[^\s]*:)?!?`

// ui-style-guide rule 12: status meaning comes from tokens, not raw palette colours.
const RAW_STATUS_COLOUR = {
  pattern: String.raw`${classPrefix}(?:text|bg|border(?:-[xytblrse])?|ring|fill|stroke|outline|decoration|divide|from|via|to)-(?:red|orange|amber|yellow|lime|green|emerald|teal|rose)-\d{2,3}(?:\/\d+)?!?$`,
  message:
    "Raw status colour (ui-style-guide rule 12). Use the tokens: `text-destructive` for errors, `bg-warning`/`text-warning-foreground` for warnings, `bg-success`/`text-success-foreground` for success, `bg-info-bg` for info.",
}

// ui-style-guide rule 11: `animate-spin` outside the shared `Spinner` is a home-made spinner.
const HOME_MADE_SPINNER_CLASS = {
  pattern: String.raw`${classPrefix}animate-spin!?$`,
  message:
    "Home-made spinner (ui-style-guide rule 11). Use `Spinner` from `@workspace/ui/components/spinner`.",
}

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
      regexp.configs.recommended,
      pluginQuery.configs["flat/recommended"],
      deMorgan.configs.recommended,
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
      // Rules from the strict type-checked preset that catch real bugs at no style cost.
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { considerDefaultExhaustiveForUnions: true },
      ],
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-misused-spread": "error",
      "@typescript-eslint/no-meaningless-void-operator": "error",
      "@typescript-eslint/no-unnecessary-type-conversion": "error",
      "@typescript-eslint/no-useless-default-assignment": "error",
    },
  },
  {
    // Import graph hygiene. Layer boundaries are steiger's job; these catch cycles and duplicates.
    files: ["**/*.{ts,tsx}"],
    plugins: { "import-x": importX },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          project: `${import.meta.dirname}/tsconfig.app.json`,
        }),
        createNodeResolver(),
      ],
    },
    rules: {
      "import-x/no-cycle": ["error", { ignoreExternal: true }],
      "import-x/no-self-import": "error",
      "import-x/no-duplicates": "error",
      // `import type { X }` on its own line; verbatimModuleSyntax keeps it erased.
      "import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // `importOriginal<typeof import("…")>()` is vitest's mock idiom.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { disallowTypeAnnotations: false },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
    },
  },
  {
    // A few autofixable unicorn rules that read better and carry no style debate.
    files: ["**/*.{ts,tsx}"],
    plugins: { unicorn },
    rules: {
      "unicorn/prefer-string-replace-all": "error",
      "unicorn/prefer-split-limit": "error",
      "unicorn/new-for-builtins": "error",
      "unicorn/explicit-length-check": "error",
      "unicorn/no-negated-array-predicate": "error",
      "unicorn/prefer-direct-iteration": "error",
    },
  },
  {
    // Web storage goes through `safeStorage` / `safeSessionStorage` and the key registry
    // (spec: browser-storage-resilience); only safe-storage.ts and tests touch it directly.
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/fsd/shared/lib/browser/safe-storage.ts",
      "**/*.test.{ts,tsx}",
      "src/test/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-globals": [
        "error",
        ...["localStorage", "sessionStorage"].map((name) => ({
          name,
          message:
            "Use safeStorage / safeSessionStorage from @/shared/lib with a key from storage-keys.ts.",
        })),
      ],
      "no-restricted-properties": [
        "error",
        ...["localStorage", "sessionStorage"].flatMap((property) =>
          ["window", "globalThis", "self"].map((object) => ({
            object,
            property,
            message:
              "Use safeStorage / safeSessionStorage from @/shared/lib with a key from storage-keys.ts.",
          }))
        ),
      ],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    plugins: { vitest, "testing-library": testingLibrary },
    rules: {
      ...vitest.configs.recommended.rules,
      // `expect(value, message)` is a valid two-argument form in vitest.
      "vitest/valid-expect": ["error", { maxArgs: 2 }],
      // Helpers named expect* (expectPath, expectTriggerControlsListbox) assert too.
      "vitest/expect-expect": [
        "error",
        { assertFunctionNames: ["expect", "expect*"] },
      ],
      "vitest/no-focused-tests": "error",
      // Table-driven tests branch on the case; those conditionals are deliberate.
      "vitest/no-conditional-expect": "off",
      "testing-library/prefer-find-by": "error",
      "testing-library/no-await-sync-events": "error",
      "testing-library/await-async-queries": "error",
      "testing-library/await-async-utils": "error",
      "testing-library/no-wait-for-side-effects": "error",
      "testing-library/no-wait-for-multiple-assertions": "error",
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
    // FSD allows `@x` cross-import surfaces only on the entities layer, and toasts come from
    // `@workspace/ui`, not `sonner` directly.
    files: ["src/fsd/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "sonner",
              message:
                "Import `toast` from `@workspace/ui/lib/toast`; the app's one `<Toaster />` is `@workspace/ui/components/sonner`.",
            },
          ],
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
  {
    // Tier 2: high-signal rules with existing hits. Warn while each is burned down in its own PR,
    // then raise it to error at zero. See the ESLint survey for counts.
    files: ["**/*.{ts,tsx}"],
    ignores: ["steiger.config.ts"],
    plugins: { sonarjs, "@eslint-react": eslintReact },
    rules: {
      // A lookup that can miss narrows or goes through `required()` (shared/lib), which names what
      // is missing. Tests keep `!` (warn, below).
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowString: true,
          allowNumber: false,
          allowNullableBoolean: true,
          allowNullableString: true,
        },
      ],
      "@typescript-eslint/no-unnecessary-condition": "error",
      "unicorn/no-array-sort": "error",
      "unicorn/require-array-sort-compare": "error",
      "unicorn/consistent-function-scoping": "warn",
      "sonarjs/cognitive-complexity": ["warn", 15],
      "@eslint-react/no-nested-component-definitions": "error",
      "@eslint-react/purity": "error",
    },
  },
  {
    // Tests, fixtures and benches assert on known data, so `!` there stays a warning.
    files: [
      "**/*.test.{ts,tsx}",
      "**/*.test-fixture.ts",
      "**/*.bench.ts",
      "src/test/**/*.{ts,tsx}",
      "e2e/**/*.ts",
    ],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    rules: {
      "testing-library/no-node-access": "warn",
      "testing-library/no-container": "warn",
    },
  },
  {
    // Effects that should be event handlers or derived values (react.dev "You Might Not Need an
    // Effect"). The rules are heuristic: an effect that really syncs with the DOM, the URL or
    // another external system keeps a disable that says which.
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-you-might-not-need-an-effect": noUseEffect },
    rules: {
      ...Object.fromEntries(
        Object.keys(noUseEffect.configs.recommended.rules).map((rule) => [
          rule,
          "error",
        ])
      ),
      // Flags any guarded effect, so most hits were real DOM, URL or storage syncs kept with a
      // disable. Off, like no-array-index-key, rather than disabled at every call site.
      "react-you-might-not-need-an-effect/no-event-handler": "off",
    },
  },
  {
    // ui-style-guide guard rails. Hits that predate them are listed in eslint-suppressions.json;
    // after fixing one, run `pnpm lint:eslint --prune-suppressions` so the count cannot come back.
    files: ["src/fsd/**/*.tsx"],
    ignores: ["**/*.test.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        HAND_ROLLED_TOGGLE,
        PAGE_H1,
        NATIVE_TITLE,
        RAW_BUTTON,
        ...STYLE_GUIDE_LOGIC,
      ],
    },
  },
  {
    // The same guard rails for logic files: spinners and number formats only.
    files: ["src/fsd/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-syntax": ["error", ...STYLE_GUIDE_LOGIC],
    },
  },
  {
    // The app shell renders the page title, so its `<h1>`s are the allowed ones.
    files: ["src/fsd/app/layout/**/*.tsx"],
    ignores: ["**/*.test.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        HAND_ROLLED_TOGGLE,
        NATIVE_TITLE,
        RAW_BUTTON,
        ...STYLE_GUIDE_LOGIC,
      ],
    },
  },
  {
    // The shared formatters are the one place that builds `Intl.NumberFormat` and
    // `Intl.DateTimeFormat`; `date-locale.ts` reads the device's own format settings.
    files: [
      "src/fsd/shared/lib/format/format-number.ts",
      "src/fsd/shared/lib/format/format-date-time.ts",
      "src/fsd/shared/lib/format/date-locale.ts",
    ],
    rules: { "no-restricted-syntax": "off" },
  },
  tailwindSizingConfig,
  {
    // ui-style-guide rules 11 and 12 on top of the sizing restrictions (one list per file wins).
    files: ["src/fsd/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "better-tailwindcss/no-restricted-classes": [
        "error",
        {
          restrict: [
            ...sizingRestrictions,
            RAW_STATUS_COLOUR,
            HOME_MADE_SPINNER_CLASS,
          ],
        },
      ],
    },
  },
])
