import "fake-indexeddb/auto"

import { afterEach, vi } from "vitest"

import { resetTestAuth } from "./auth"

// Pin the runtime's default locale, as `env.TZ` pins the zone in vite.config.ts. Node takes it from
// the OS (ignoring LANG/LC_ALL on Windows), so an en-GB or uk-UA machine formats "6 Sept 2026" where
// tests expect CI's "Sep 6, 2026". Only calls that pass no locale change; explicit ones are untouched.
const TEST_LOCALE = "en-US"
const withLocale = (locales: unknown) => locales ?? TEST_LOCALE
for (const name of [
  "DateTimeFormat",
  "NumberFormat",
  "Collator",
  "PluralRules",
  "RelativeTimeFormat",
  "ListFormat",
] as const) {
  const Original = Intl[name] as unknown as new (
    locales?: unknown,
    options?: unknown
  ) => object
  const Pinned = function (locales?: unknown, options?: unknown) {
    return new Original(withLocale(locales), options)
  }
  Pinned.prototype = Original.prototype
  Object.defineProperty(Pinned, "supportedLocalesOf", {
    value: Intl[name].supportedLocalesOf,
  })
  Object.defineProperty(Intl, name, { value: Pinned, configurable: true })
}
for (const [proto, method] of [
  [Date.prototype, "toLocaleString"],
  [Date.prototype, "toLocaleDateString"],
  [Date.prototype, "toLocaleTimeString"],
  [Number.prototype, "toLocaleString"],
  [BigInt.prototype, "toLocaleString"],
] as const) {
  // Indexing the union of prototypes directly does not type-check (no shared toLocaleDateString).
  const original = (proto as unknown as Record<string, unknown>)[method] as (
    this: unknown,
    locales?: unknown,
    options?: unknown
  ) => string
  Object.defineProperty(proto, method, {
    value(this: unknown, locales?: unknown, options?: unknown) {
      return original.call(this, withLocale(locales), options)
    },
    configurable: true,
    writable: true,
  })
}
const localeCompare = String.prototype.localeCompare
Object.defineProperty(String.prototype, "localeCompare", {
  value(this: string, that: string, locales?: unknown, options?: unknown) {
    return localeCompare.call(
      this,
      that,
      withLocale(locales) as string,
      options as Intl.CollatorOptions
    )
  },
  configurable: true,
  writable: true,
})

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
