// Setup for files that run in jsdom: matchers, Testing Library and the browser APIs jsdom lacks.
import "@testing-library/jest-dom/vitest"

import { cleanup, configure } from "@testing-library/react"
import { afterEach, vi } from "vitest"

import { forgetUnsavedPreferences } from "@/shared/lib"

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
// jsdom lacks these, though the DOM types declare them.
const jsdomWindow: Partial<Pick<Window, "matchMedia">> = window
const jsdomElement: Partial<
  Pick<
    HTMLElement,
    | "scrollIntoView"
    | "hasPointerCapture"
    | "releasePointerCapture"
    | "setPointerCapture"
  >
> = window.HTMLElement.prototype
if (jsdomWindow.matchMedia === undefined) {
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
jsdomElement.scrollIntoView ??= vi.fn()
// jsdom defines scrollTo but only logs "Not implemented".
window.scrollTo = vi.fn()
// jsdom 31+ applies stylesheets to computed styles, so vaul's injected `animation-name` on a closing
// drawer now reaches Radix Presence, which then waits for an `animationend` jsdom never fires and
// leaves the closed drawer mounted. Tests don't animate, as with reduced motion.
const noMotion = document.createElement("style")
noMotion.textContent =
  "*, *::before, *::after { animation: none !important; transition: none !important; }"
document.head.append(noMotion)
jsdomElement.hasPointerCapture ??= vi.fn()
jsdomElement.releasePointerCapture ??= vi.fn()
jsdomElement.setPointerCapture ??= vi.fn()

// Registered after setup.ts's hook, so it runs first (after-hooks run in reverse): unmount before
// the databases are reset.
afterEach(() => {
  cleanup()
  window.localStorage.clear()
  forgetUnsavedPreferences()
})
