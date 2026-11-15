import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { useGoalsView } from "./use-goals-view"

const KEY = "goals.overview.view"

describe("useGoalsView", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.localStorage.removeItem(KEY)
  })

  it.each([
    [null, "Cards"],
    ["Cards", "Cards"],
    ["Table", "Table"],
    ["Grid", "Cards"],
  ])("reads a stored %s as %s", (stored, expected) => {
    if (stored) window.localStorage.setItem(KEY, stored)

    expect(renderHook(() => useGoalsView()).result.current.view).toBe(expected)
  })

  it("stores a change and passes it to every reader at once", () => {
    const page = renderHook(() => useGoalsView())
    const layout = renderHook(() => useGoalsView())

    act(() => page.result.current.setView("Table"))

    expect(page.result.current.view).toBe("Table")
    expect(layout.result.current.view).toBe("Table")
    expect(window.localStorage.getItem(KEY)).toBe("Table")
  })

  it("follows a change made in another tab", () => {
    const view = renderHook(() => useGoalsView())

    window.localStorage.setItem(KEY, "Table")
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: KEY }))
    })

    expect(view.result.current.view).toBe("Table")
  })

  it("keeps the choice for this visit when the browser refuses the write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "QuotaExceededError")
    })
    const view = renderHook(() => useGoalsView())

    act(() => view.result.current.setView("Table"))
    expect(view.result.current.view).toBe("Table")

    vi.restoreAllMocks()
    act(() => view.result.current.setView("Cards"))
    expect(view.result.current.view).toBe("Cards")
  })
})
