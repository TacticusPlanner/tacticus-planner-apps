import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usePersistedSelection } from "./use-persisted-selection"

type Choice = "a" | "b" | "c"
const isChoice = (value: unknown): value is Choice =>
  value === "a" || value === "b" || value === "c"

describe("usePersistedSelection", () => {
  beforeEach(() => window.localStorage.clear())

  it("falls back when nothing is stored yet", () => {
    const { result } = renderHook(() =>
      usePersistedSelection("test-key", isChoice, "a")
    )
    expect(result.current[0]).toBe("a")
  })

  it("reads a previously stored value on mount", () => {
    window.localStorage.setItem("test-key", "b")
    const { result } = renderHook(() =>
      usePersistedSelection("test-key", isChoice, "a")
    )
    expect(result.current[0]).toBe("b")
  })

  it("falls back when the stored value is invalid", () => {
    window.localStorage.setItem("test-key", "not-a-choice")
    const { result } = renderHook(() =>
      usePersistedSelection("test-key", isChoice, "a")
    )
    expect(result.current[0]).toBe("a")
  })

  it("persists a new selection and survives remount", () => {
    const { result, unmount } = renderHook(() =>
      usePersistedSelection("test-key", isChoice, "a")
    )
    act(() => result.current[1]("c"))
    expect(result.current[0]).toBe("c")
    unmount()

    const { result: remounted } = renderHook(() =>
      usePersistedSelection("test-key", isChoice, "a")
    )
    expect(remounted.current[0]).toBe("c")
  })

  it("degrades to the in-memory fallback when localStorage throws", () => {
    const getItem = vi
      .spyOn(window.localStorage.__proto__, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked")
      })
    const { result } = renderHook(() =>
      usePersistedSelection("test-key", isChoice, "a")
    )
    expect(result.current[0]).toBe("a")
    getItem.mockRestore()
  })
})
