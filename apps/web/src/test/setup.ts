import "@testing-library/jest-dom/vitest"
import "fake-indexeddb/auto"

import { cleanup, configure } from "@testing-library/react"
import { afterEach, vi } from "vitest"

import { resetTestAuth } from "./auth"
import "./i18n-instance"
import { resetTestDatabases } from "./seed"

// Reads go through a real (fake-)IndexedDB, so `findBy*` waits on async storage; the 1 s default
// is too tight when the whole suite runs in parallel.
configure({ asyncUtilTimeout: 3000 })

// Real English translations instead of the app's HTTP-backed instance (see ./i18n-instance.ts).
vi.mock("@/shared/config/i18n/i18n", () => import("./i18n-instance"))
// One test-owned MSAL stub; drive it with `setTestAuth` (see ./auth.ts).
vi.mock("@azure/msal-react", () => import("./auth"))

// jsdom lacks these APIs that Radix UI primitives (slider, popover, etc.) rely on.
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}
window.HTMLElement.prototype.scrollIntoView ??= vi.fn()
// jsdom defines scrollTo but only logs "Not implemented".
window.scrollTo = vi.fn()
window.HTMLElement.prototype.hasPointerCapture ??= vi.fn()
window.HTMLElement.prototype.releasePointerCapture ??= vi.fn()
window.HTMLElement.prototype.setPointerCapture ??= vi.fn()

afterEach(async () => {
  cleanup()
  window.localStorage.clear()
  resetTestAuth()
  await resetTestDatabases()
})
