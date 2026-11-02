import "fake-indexeddb/auto"

import { afterEach, vi } from "vitest"

import { resetTestAuth } from "./auth"

// Real English translations instead of the app's HTTP-backed instance (see ./i18n-instance.ts).
vi.mock("@/shared/config/i18n/i18n", () => import("./i18n-instance"))
// One test-owned MSAL stub; drive it with `setTestAuth` (see ./auth.ts).
vi.mock("@azure/msal-react", () => import("./auth"))

afterEach(async () => {
  resetTestAuth()
  // Drop whatever databases the test opened, without importing the storage packages: most files
  // open none. Dexie closes its connections on `versionchange`, so the delete is not blocked.
  const databases = await indexedDB.databases()
  await Promise.all(
    databases.flatMap(({ name }) => (name ? [deleteDatabase(name)] : []))
  )
})

function deleteDatabase(name: string) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name)
    request.onsuccess = () => resolve()
    request.onerror = () =>
      reject(request.error ?? new Error(`Could not delete ${name}`))
  })
}

// `.test.ts` files run in the node environment and skip the DOM setup (see vite.config.ts).
if (typeof document !== "undefined") await import("./setup-dom")
