import { defineConfig } from "@playwright/test"

// Request-count measurements against a running stack (Aspire or `pnpm dev`).
// Set VITE_APP_URL to the web URL the Aspire dashboard shows.
export default defineConfig({
  testDir: "e2e",
  reporter: "list",
  use: {
    baseURL: process.env.VITE_APP_URL ?? "http://localhost:5173",
    storageState: "e2e/.auth/user.json",
  },
})
