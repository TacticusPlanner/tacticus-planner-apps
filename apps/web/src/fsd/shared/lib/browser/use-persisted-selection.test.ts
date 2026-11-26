// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { storedPreference } from "./stored-preference"
import { usePersistedSelection } from "./use-persisted-selection"

type Choice = "a" | "b" | "c"
const isChoice = (value: unknown): value is Choice =>
  value === "a" || value === "b" || value === "c"

const preference = storedPreference("teams", "mode")
const stored = () => window.localStorage.getItem("tp.teams")

describe("usePersistedSelection", () => {
  beforeEach(() => window.localStorage.clear())

  it("falls back when nothing is stored yet", () => {
    const { result } = renderHook(() =>
      usePersistedSelection(preference, isChoice, "a")
    )
    expect(result.current[0]).toBe("a")
  })

  it("reads a previously stored value on mount", () => {
    window.localStorage.setItem("tp.teams", JSON.stringify({ mode: "b" }))
    const { result } = renderHook(() =>
      usePersistedSelection(preference, isChoice, "a")
    )
    expect(result.current[0]).toBe("b")
  })

  it("falls back when the stored value is invalid", () => {
    window.localStorage.setItem(
      "tp.teams",
      JSON.stringify({ mode: "not-a-choice" })
    )
    const { result } = renderHook(() =>
      usePersistedSelection(preference, isChoice, "a")
    )
    expect(result.current[0]).toBe("a")
  })

  it("persists a new selection in its record and survives remount", () => {
    window.localStorage.setItem("tp.teams", JSON.stringify({ layout: "table" }))
    const { result, unmount } = renderHook(() =>
      usePersistedSelection(preference, isChoice, "a")
    )
    act(() => result.current[1]("c"))
    expect(result.current[0]).toBe("c")
    expect(JSON.parse(stored() ?? "null")).toEqual({
      layout: "table",
      mode: "c",
    })
    unmount()

    const { result: remounted } = renderHook(() =>
      usePersistedSelection(preference, isChoice, "a")
    )
    expect(remounted.current[0]).toBe("c")
  })

  it("updates every mounted reader of the same preference", () => {
    const first = renderHook(() =>
      usePersistedSelection(preference, isChoice, "a")
    )
    const second = renderHook(() =>
      usePersistedSelection(preference, isChoice, "a")
    )
    act(() => first.result.current[1]("b"))
    expect(second.result.current[0]).toBe("b")
  })

  it("degrades to the in-memory fallback when localStorage throws", () => {
    const getItem = vi
      .spyOn(window.localStorage.__proto__, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked")
      })
    const { result } = renderHook(() =>
      usePersistedSelection(preference, isChoice, "a")
    )
    expect(result.current[0]).toBe("a")
    getItem.mockRestore()
  })
})
