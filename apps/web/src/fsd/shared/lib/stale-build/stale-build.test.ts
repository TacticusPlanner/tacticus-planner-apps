import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { isStaleBuildError, reloadOnceForStaleBuild } from "./stale-build"

function named(name: string, message = "") {
  const error = new Error(message)
  error.name = name
  return error
}

describe("isStaleBuildError", () => {
  it.each([
    [
      "Chromium import failure",
      new TypeError(
        "Failed to fetch dynamically imported module: https://x/assets/goals-abc.js"
      ),
    ],
    [
      "WebKit import failure",
      new TypeError("Importing a module script failed."),
    ],
    [
      "Firefox import failure",
      new TypeError(
        "error loading dynamically imported module: https://x/a.js"
      ),
    ],
    ["Dexie closed connection", named("DatabaseClosedError")],
    ["Dexie version mismatch", named("VersionError")],
    ["Dexie invalid state", named("InvalidStateError")],
    [
      "react-router wrapped import failure",
      { error: new TypeError("Failed to fetch dynamically imported module") },
    ],
    [
      "error with a stale cause",
      new Error("render failed", { cause: named("DatabaseClosedError") }),
    ],
  ])("recognises %s", (_label, error) => {
    expect(isStaleBuildError(error)).toBe(true)
  })

  it.each([
    ["a plain render error", new Error("Cannot read properties of undefined")],
    ["a thrown string", "boom"],
    ["null", null],
    ["a 404 ApiError", named("ApiError", "API request failed: 404")],
  ])("ignores %s", (_label, error) => {
    expect(isStaleBuildError(error)).toBe(false)
  })
})

describe("reloadOnceForStaleBuild", () => {
  const reload = vi.fn()
  const key = "tp:stale-reload:/plan?project=1"

  beforeEach(() => {
    window.sessionStorage.clear()
    vi.stubGlobal("location", {
      pathname: "/plan",
      search: "?project=1",
      reload,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    reload.mockReset()
  })

  it("reloads on the first failure for a URL and marks it in session storage", () => {
    expect(reloadOnceForStaleBuild()).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(window.sessionStorage.getItem(key)).not.toBeNull()
  })

  it("reports the reload as in flight to later callers in the same document", () => {
    reloadOnceForStaleBuild()
    expect(reloadOnceForStaleBuild()).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it("refuses a second reload for a URL an earlier document already reloaded", () => {
    // A marker left by the previous document (what a real reload produces).
    window.sessionStorage.setItem(key, "previous-document")
    expect(reloadOnceForStaleBuild()).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })

  it("reloads again for a different URL", () => {
    reloadOnceForStaleBuild()
    vi.stubGlobal("location", { pathname: "/dailies", search: "", reload })
    expect(reloadOnceForStaleBuild()).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it("shows the page instead of reloading when session storage is unavailable", () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked")
      })
    expect(reloadOnceForStaleBuild()).toBe(false)
    expect(reload).not.toHaveBeenCalled()
    getItem.mockRestore()
  })
})
