import "@testing-library/jest-dom/vitest"
import "fake-indexeddb/auto"

import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

import { resetTestAuth } from "./auth"
import "./i18n-instance"
import { resetTestDatabases } from "./seed"

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
window.HTMLElement.prototype.hasPointerCapture ??= vi.fn()
window.HTMLElement.prototype.releasePointerCapture ??= vi.fn()
window.HTMLElement.prototype.setPointerCapture ??= vi.fn()

afterEach(async () => {
  cleanup()
  window.localStorage.clear()
  resetTestAuth()
  await resetTestDatabases()
})
