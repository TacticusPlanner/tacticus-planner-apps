// Shared Tailwind sizing lint config for packages/ui and apps/web (imported from there).
// Sizes come from the theme scale, never from hardcoded px/rem values: see
// .agents/skills/ui-sizing/SKILL.md for the guideline and what to use instead.
import { fileURLToPath } from "node:url"
import betterTailwind from "eslint-plugin-better-tailwindcss"
import { getDefaultSelectors } from "eslint-plugin-better-tailwindcss/defaults"

// Resolve tailwindcss and the theme from packages/ui, also when apps/web lints.
const cwd = fileURLToPath(new URL(".", import.meta.url))
const entryPoint = fileURLToPath(
  new URL("./src/styles/globals.css", import.meta.url)
)

// Optional variant prefix (`md:`, `group-hover:`, `[&_svg]:`…), legacy leading `!`, and negative sign.
// Patterns also accept the trailing `!` important modifier (`h-[22px]!`).
const prefix = String.raw`^(?:[^\s]*:)?!?-?`
// An arbitrary length: `[13px]`, `[0.65rem]`, `[-1.5px]`, `[1em]`.
const length = String.raw`\[-?[\d.]+(?:px|rem|em)\]`

const sizeUtilities = [
  "size",
  "[hw]",
  "min-[hw]",
  "max-[hw]",
  "gap(?:-[xy])?",
  "space-[xy]",
  "[pm][xytblrse]?",
  "inset(?:-[xy])?",
  "top",
  "right",
  "bottom",
  "left",
  "translate-[xy]",
  "leading",
  "tracking",
  "basis",
  String.raw`rounded(?:-[a-z]+)?`,
  String.raw`(?:border|ring|outline)(?:-[a-z]+)?`,
].join("|")

// Class strings kept in constants (`const ROW_GRID = "grid …"`, `outlinedText`, `rowClasses`).
const classVariableNames = String.raw`^(?:[A-Z][A-Z0-9_]*|.*(?:[Cc]lass(?:Name)?(?:es|s)?|[Ss]tyles?|Grid|Layout|Text|Variants?))$|^layout$`

export const tailwindSizingConfig = {
  files: ["**/*.{ts,tsx}"],
  plugins: { "better-tailwindcss": betterTailwind },
  settings: {
    "better-tailwindcss": {
      cwd,
      entryPoint,
      selectors: [
        ...getDefaultSelectors(),
        {
          kind: "variable",
          name: classVariableNames,
          match: [{ type: "strings" }],
        },
      ],
    },
  },
  rules: {
    // One spelling per class: `px-1 py-1` → `p-1`, `text-xs leading-tight` → `text-xs/tight`,
    // `h-[32px]` → `h-8`. Autofixable with `eslint --fix`.
    "better-tailwindcss/enforce-canonical-classes": "error",
    "better-tailwindcss/no-restricted-classes": [
      "error",
      {
        restrict: [
          {
            pattern: `${prefix}text-${length}!?$`,
            message:
              "Hardcoded text size. Use text-2xs (badge numerals only) or text-xs … text-4xl — see the ui-sizing skill.",
          },
          {
            pattern: String.raw`^(?:[^\s]*:)?(?:grid-(?:cols|rows)-\[|\[grid-template-[a-z-]+:).*\dpx`,
            message:
              "Hardcoded px in a grid template. Use rem tracks (28px → 1.75rem) so they follow the root size.",
          },
          {
            pattern: `${prefix}(?:${sizeUtilities})-${length}!?$`,
            message:
              "Hardcoded length. Use the spacing/radius scale (e.g. size-3.5, h-6, w-105, rounded-lg) — see the ui-sizing skill.",
          },
        ],
      },
    ],
  },
}
