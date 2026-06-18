import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
  resolve: {
    alias: {
      "@workspace/ui": path.resolve(__dirname, "./src"),
      "@workspace/ui/components": path.resolve(__dirname, "./src/components"),
      "@workspace/ui/hooks": path.resolve(__dirname, "./src/hooks"),
      "@workspace/ui/lib": path.resolve(__dirname, "./src/lib"),
    },
  },
})
