// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  forgetUnsavedPreferences,
  readPreference,
  storedPreference,
  useStoredFlag,
  useStoredPreference,
  writePreference,
} from "./stored-preference"

const sort = storedPreference("collection", "sort")
const view = storedPreference("collection", "view")
const stored = () => JSON.parse(localStorage.getItem("tp.collection") ?? "null")

const parseSort = (value: unknown) =>
  typeof value === "string" ? value : "name"
const parseList = (value: unknown) => (Array.isArray(value) ? value : [])

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  forgetUnsavedPreferences()
})

describe("stored preferences", () => {
  it("keeps the fields of one feature in one record", () => {
    writePreference(sort, "power")
    writePreference(view, "table")

    expect(stored()).toEqual({ sort: "power", view: "table" })
    expect(readPreference(sort)).toBe("power")
  })

  it("removes a field, and the record once it is empty", () => {
    writePreference(sort, "power")
    writePreference(view, "table")

    writePreference(sort, undefined)
    expect(stored()).toEqual({ view: "table" })

    writePreference(view, undefined)
    expect(localStorage.getItem("tp.collection")).toBeNull()
  })

  it("reads an unreadable record as empty", () => {
    localStorage.setItem("tp.collection", "{not json")
    expect(readPreference(sort)).toBeUndefined()

    localStorage.setItem("tp.collection", "[1,2]")
    expect(readPreference(sort)).toBeUndefined()
  })

  it("keeps a refused write for this visit", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError")
    })

    expect(writePreference(sort, "power")).toBe(false)
    expect(readPreference(sort)).toBe("power")
  })
})

describe("useStoredPreference", () => {
  it("updates every mounted reader, including other preferences' records left alone", () => {
    writePreference(view, "table")
    const first = renderHook(() => useStoredPreference(sort, parseSort))
    const second = renderHook(() => useStoredPreference(sort, parseSort))

    act(() => first.result.current[1]("power"))

    expect(second.result.current[0]).toBe("power")
    expect(stored()).toEqual({ view: "table", sort: "power" })
  })

  it("picks up a change made by another tab", () => {
    const { result } = renderHook(() => useStoredPreference(sort, parseSort))

    act(() => {
      localStorage.setItem("tp.collection", JSON.stringify({ sort: "rank" }))
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "tp.collection",
          storageArea: localStorage,
        })
      )
    })

    expect(result.current[0]).toBe("rank")
  })

  it("keeps the same parsed object until the stored value changes", () => {
    const fields = storedPreference("dailies", "raidsFilters")
    writePreference(fields, ["a"])
    const { result, rerender } = renderHook(() =>
      useStoredPreference(fields, parseList)
    )
    const first = result.current[0]

    rerender()

    expect(result.current[0]).toBe(first)
  })
})

describe("useStoredFlag", () => {
  it("falls back until set, then remembers a boolean", () => {
    const open = storedPreference("legendaryEvents", "tokenPlanOpen")
    const { result } = renderHook(() => useStoredFlag(open, true))
    expect(result.current[0]).toBe(true)

    act(() => result.current[1](false))

    expect(result.current[0]).toBe(false)
    expect(readPreference(open)).toBe(false)
  })
})
