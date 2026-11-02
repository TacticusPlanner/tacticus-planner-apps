import "fake-indexeddb/auto"

import { afterEach, vi } from "vitest"

import { resetTestAuth } from "./auth"
import { resetTestDatabases } from "./seed"

// Real English translations instead of the app's HTTP-backed instance (see ./i18n-instance.ts).
vi.mock("@/shared/config/i18n/i18n", () => import("./i18n-instance"))
// One test-owned MSAL stub; drive it with `setTestAuth` (see ./auth.ts).
vi.mock("@azure/msal-react", () => import("./auth"))

afterEach(async () => {
  resetTestAuth()
  await resetTestDatabases()
})

// `.test.ts` files run in the node environment and skip the DOM setup (see vite.config.ts).
if (typeof document !== "undefined") await import("./setup-dom")
