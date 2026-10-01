import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { emptyRaidsFilters } from "./raids-filters.domain"
import { useRaidsFilters } from "./use-raids-filters"

const KEY = "raids-filters.v1"

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe("useRaidsFilters", () => {
  it("starts empty, round-trips through storage and survives a remount", () => {
    const first = renderHook(() => useRaidsFilters())
    expect(first.result.current[0]).toEqual(emptyRaidsFilters)

    act(() =>
      first.result.current[1]({
        ...emptyRaidsFilters,
        enemiesFactions: ["Orks"],
        enemiesMin: 4,
      })
    )
    expect(first.result.current[0].enemiesFactions).toEqual(["Orks"])
    first.unmount()

    const second = renderHook(() => useRaidsFilters())
    expect(second.result.current[0]).toMatchObject({
      enemiesFactions: ["Orks"],
      enemiesMin: 4,
    })
  })

  it("falls back to the empty filter for invalid stored data", () => {
    window.localStorage.setItem(KEY, "{not json")
    expect(renderHook(() => useRaidsFilters()).result.current[0]).toEqual(
      emptyRaidsFilters
    )

    window.localStorage.setItem(KEY, JSON.stringify({ slots: "five" }))
    expect(renderHook(() => useRaidsFilters()).result.current[0]).toEqual(
      emptyRaidsFilters
    )
  })

  it("reads a filter stored before enemy traits existed", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ slots: [5], enemiesTypes: ["Grot"], enemiesMin: 4 })
    )
    const { result } = renderHook(() => useRaidsFilters())
    expect(result.current[0]).toEqual({
      ...emptyRaidsFilters,
      slots: [5],
      enemiesTypes: ["Grot"],
      enemiesMin: 4,
    })
  })

  it("round-trips enemy traits", () => {
    const first = renderHook(() => useRaidsFilters())
    act(() =>
      first.result.current[1]({
        ...emptyRaidsFilters,
        enemiesTraits: ["Mechanical"],
      })
    )
    first.unmount()
    expect(
      renderHook(() => useRaidsFilters()).result.current[0].enemiesTraits
    ).toEqual(["Mechanical"])
  })

  it("tolerates unknown ids", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ enemiesFactions: ["NoLongerAFaction"] })
    )
    const { result } = renderHook(() => useRaidsFilters())
    expect(result.current[0].enemiesFactions).toEqual(["NoLongerAFaction"])
  })

  it("keeps working in memory when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const { result } = renderHook(() => useRaidsFilters())
    expect(result.current[0]).toEqual(emptyRaidsFilters)

    act(() => result.current[1]({ ...emptyRaidsFilters, slots: [5] }))
    expect(result.current[0].slots).toEqual([5])
    act(() => result.current[1](emptyRaidsFilters))
  })

  it("keeps two consumers in sync", () => {
    const a = renderHook(() => useRaidsFilters())
    const b = renderHook(() => useRaidsFilters())

    act(() => a.result.current[1]({ ...emptyRaidsFilters, slots: [3] }))
    expect(b.result.current[0].slots).toEqual([3])

    act(() => b.result.current[1](emptyRaidsFilters))
    expect(a.result.current[0]).toEqual(emptyRaidsFilters)
  })

  it("picks up a change made by another tab", () => {
    const { result } = renderHook(() => useRaidsFilters())
    act(() => {
      window.localStorage.setItem(KEY, JSON.stringify({ slots: [4] }))
      window.dispatchEvent(new StorageEvent("storage", { key: KEY }))
    })
    expect(result.current[0].slots).toEqual([4])
  })
})
