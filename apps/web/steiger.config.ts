import { defineConfig } from "steiger"
import fsd from "@feature-sliced/steiger-plugin"

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: [
      "./src/fsd/entities/upgrade/**",
      "./src/fsd/entities/catalog/**",
      "./src/fsd/features/view-settings/**",
      "./src/fsd/widgets/sidebar/**",
    ],
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
])
