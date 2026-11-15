import { defineConfig } from "steiger"
import fsd from "@feature-sliced/steiger-plugin"

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ["./src/fsd/**"],
    rules: {
      "fsd/insignificant-slice": "off",
      // Opt-in rules (not in the recommended preset).
      // Imports inside a slice stay relative, so a slice never imports its own public API.
      "fsd/import-locality": "error",
      // Public APIs list their exports explicitly instead of `export *`.
      "fsd/no-wildcard-exports": "error",
    },
  },
  {
    // FSD names `providers` as a standard App segment (React provider components), but steiger's
    // segments-by-purpose rule does not exempt it.
    files: ["./src/fsd/app/providers/**"],
    rules: {
      "fsd/segments-by-purpose": "off",
    },
  },
])
