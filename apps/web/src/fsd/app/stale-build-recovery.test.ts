import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { installPreloadErrorRecovery } from "./stale-build-recovery"

describe("installPreloadErrorRecovery", () => {
  const reload = vi.fn()
  let uninstall: () => void

  beforeEach(() => {
    window.sessionStorage.clear()
    vi.stubGlobal("location", { pathname: "/home", search: "", reload })
    uninstall = installPreloadErrorRecovery(window)
  })

  afterEach(() => {
    uninstall()
    vi.unstubAllGlobals()
    reload.mockReset()
  })

  const importFailure = new TypeError(
    "Failed to fetch dynamically imported module: https://app.example.test/assets/goals-Ab1_c.js"
  )
  const stylesheetFailure = new Error(
    "Unable to preload CSS for https://app.example.test/assets/goals-Ab1_c.css"
  )

  function dispatchPreloadError(payload: Error = importFailure) {
    const event = Object.assign(
      new Event("vite:preloadError", { cancelable: true }),
      { payload }
    )
    window.dispatchEvent(event)
    return event
  }

  it("reloads once on a failed import but lets it reject", () => {
    // Suppressing it would make Vite resolve the import with `undefined`, which React.lazy then
    // dereferences ("Cannot read properties of undefined (reading 'default')").
    const event = dispatchPreloadError()

    expect(reload).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(false)
  })

  it("reloads once and suppresses a stylesheet failure, so the import still runs", () => {
    const event = dispatchPreloadError(stylesheetFailure)

    expect(reload).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it("does not reload again while the reload is in flight", () => {
    dispatchPreloadError(stylesheetFailure)
    const second = dispatchPreloadError(stylesheetFailure)
    const third = dispatchPreloadError()

    expect(reload).toHaveBeenCalledTimes(1)
    expect(second.defaultPrevented).toBe(true)
    expect(third.defaultPrevented).toBe(false)
  })

  it("never reloads for the optional analytics SDK chunk (blocked or deleted)", () => {
    const event = Object.assign(
      new Event("vite:preloadError", { cancelable: true }),
      {
        payload: new Error(
          "Failed to fetch dynamically imported module: https://app.example.test/assets/posthog-Ab1_c.js"
        ),
      }
    )
    window.dispatchEvent(event)

    expect(reload).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it("lets the failure propagate when an earlier document already used the reload", () => {
    window.sessionStorage.setItem("tp:stale-reload:/home", "previous-document")

    const event = dispatchPreloadError(stylesheetFailure)

    expect(reload).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })
})
