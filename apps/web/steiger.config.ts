import { defineConfig } from "steiger"
import fsd from "@feature-sliced/steiger-plugin"

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ["./src/fsd/**"],
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
  {
    // Rule added in steiger 0.8; these segments predate it.
    files: [
      "./src/fsd/app/providers/**",
      "./src/fsd/entities/legendary-event/assets/**",
    ],
    rules: {
      "fsd/segments-by-purpose": "off",
    },
  },
])
