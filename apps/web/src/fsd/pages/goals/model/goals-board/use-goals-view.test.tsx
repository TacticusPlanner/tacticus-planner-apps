import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { useGoalsView } from "./use-goals-view"
import { readPreference, storedPreference, writePreference } from "@/shared/lib"

describe("useGoalsView", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    writePreference(storedPreference("goals", "view"), undefined)
  })

  it.each([
    [null, "Cards"],
    ["Cards", "Cards"],
    ["Table", "Table"],
    ["Grid", "Cards"],
  ])("reads a stored %s as %s", (stored, expected) => {
    if (stored) writePreference(storedPreference("goals", "view"), stored)

    expect(renderHook(() => useGoalsView()).result.current.view).toBe(expected)
  })

  it("stores a change and passes it to every reader at once", () => {
    const page = renderHook(() => useGoalsView())
    const layout = renderHook(() => useGoalsView())

    act(() => page.result.current.setView("Table"))

    expect(page.result.current.view).toBe("Table")
    expect(layout.result.current.view).toBe("Table")
    expect(readPreference(storedPreference("goals", "view"))).toBe("Table")
  })

  it("follows a change made in another tab", () => {
    const view = renderHook(() => useGoalsView())

    writePreference(storedPreference("goals", "view"), "Table")
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "tp.goals" }))
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
