// Setup for files that run in jsdom: matchers, Testing Library and the browser APIs jsdom lacks.
import "@testing-library/jest-dom/vitest"

import { cleanup, configure } from "@testing-library/react"
import { afterEach, vi } from "vitest"

import "./i18n-instance"

// Reads go through a real (fake-)IndexedDB, so `findBy*` waits on async storage; the 1 s default
// is too tight when the whole suite runs in parallel.
configure({ asyncUtilTimeout: 3000 })

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

// Registered after setup.ts's hook, so it runs first (after-hooks run in reverse): unmount before
// the databases are reset.
afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
