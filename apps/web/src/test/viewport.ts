import { vi } from "vitest"

/**
 * Emulates a viewport width for `useIsMobile()` and other `matchMedia` readers: sets
 * `window.innerWidth` and answers `(max-width: Npx)` / `(min-width: Npx)` queries against it.
 * Call `vi.unstubAllGlobals()` (or re-call) to change it.
 */
export function setViewportWidth(width: number) {
  vi.stubGlobal("innerWidth", width)
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      const max = /max-width:\s*(\d+)px/.exec(query)
      const min = /min-width:\s*(\d+)px/.exec(query)
      const matches =
        (!max || width <= Number(max[1])) && (!min || width >= Number(min[1]))
      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
    })
  )
}
