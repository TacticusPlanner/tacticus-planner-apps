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

  function dispatchPreloadError() {
    const event = new Event("vite:preloadError", { cancelable: true })
    window.dispatchEvent(event)
    return event
  }

  it("reloads once and suppresses Vite's rethrow on the first failure", () => {
    const event = dispatchPreloadError()

    expect(reload).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it("keeps suppressing while the reload is in flight, without reloading again", () => {
    dispatchPreloadError()
    const second = dispatchPreloadError()

    expect(reload).toHaveBeenCalledTimes(1)
    expect(second.defaultPrevented).toBe(true)
  })

  it("lets the failure propagate when an earlier document already used the reload", () => {
    window.sessionStorage.setItem("tp:stale-reload:/home", "previous-document")

    const event = dispatchPreloadError()

    expect(reload).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })
})
