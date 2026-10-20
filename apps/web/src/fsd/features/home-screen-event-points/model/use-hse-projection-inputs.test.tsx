import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  HSE_AVERAGES_STORAGE_KEY,
  HSE_PROGRESS_STORAGE_KEY,
  useHseProjectionInputs,
} from "./use-hse-projection-inputs"

beforeEach(() => window.localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe("useHseProjectionInputs", () => {
  it("starts with no edited averages and no milestone progress", () => {
    const { result } = renderHook(() =>
      useHseProjectionInputs("hse-trait-boost-psyker", "occ-1")
    )
    expect(result.current.averages).toEqual({})
    expect(result.current.progress).toEqual({
      milestonesDone: 0,
      pointsInMilestone: 0,
    })
  })

  it("persists averages per definition and mode, and milestone progress per instance, across a reload", () => {
    const first = renderHook(() =>
      useHseProjectionInputs("hse-trait-boost-psyker", "occ-1")
    )
    act(() => first.result.current.setAverage("Onslaught", 25))
    act(() => first.result.current.setAverage("Arena", null))
    act(() => first.result.current.setProgress({ milestonesDone: 10 }))
    act(() => first.result.current.setProgress({ pointsInMilestone: 30 }))
    first.unmount()

    const reload = renderHook(() =>
      useHseProjectionInputs("hse-trait-boost-psyker", "occ-1")
    )
    expect(reload.result.current.averages).toEqual({
      Onslaught: 25,
      Arena: null,
    })
    expect(reload.result.current.progress).toEqual({
      milestonesDone: 10,
      pointsInMilestone: 30,
    })
    expect(
      JSON.parse(window.localStorage.getItem(HSE_AVERAGES_STORAGE_KEY)!)
    ).toEqual({ "hse-trait-boost-psyker": { Onslaught: 25, Arena: null } })
  })

  it("keeps definitions and instances apart", () => {
    const { result, rerender } = renderHook(
      ({ definitionId, instanceKey }) =>
        useHseProjectionInputs(definitionId, instanceKey),
      {
        initialProps: {
          definitionId: "hse-trait-boost-psyker",
          instanceKey: "occ-1",
        },
      }
    )
    act(() => result.current.setAverage("Onslaught", 25))
    act(() => result.current.setProgress({ milestonesDone: 10 }))

    rerender({ definitionId: "hse-trait-boost-flying", instanceKey: "occ-2" })
    expect(result.current.averages).toEqual({})
    expect(result.current.progress).toEqual({
      milestonesDone: 0,
      pointsInMilestone: 0,
    })

    rerender({ definitionId: "hse-trait-boost-psyker", instanceKey: "occ-1" })
    expect(result.current.averages).toEqual({ Onslaught: 25 })
    expect(result.current.progress.milestonesDone).toBe(10)
  })

  it("ignores malformed stored values", () => {
    window.localStorage.setItem(
      HSE_AVERAGES_STORAGE_KEY,
      JSON.stringify({ a: { Arena: "x", Onslaught: -1, SalvageRun: 7 }, b: 3 })
    )
    window.localStorage.setItem(
      HSE_PROGRESS_STORAGE_KEY,
      JSON.stringify({ occ: { milestonesDone: -1, pointsInMilestone: 3 } })
    )
    const { result } = renderHook(() => useHseProjectionInputs("a", "occ"))
    expect(result.current.averages).toEqual({ SalvageRun: 7 })
    expect(result.current.progress).toEqual({
      milestonesDone: 0,
      pointsInMilestone: 0,
    })
  })

  it("works in memory when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const { result } = renderHook(() => useHseProjectionInputs("a", "occ"))
    act(() => result.current.setAverage("Arena", 8))
    act(() => result.current.setProgress({ pointsInMilestone: 12 }))
    expect(result.current.averages).toEqual({ Arena: 8 })
    expect(result.current.progress.pointsInMilestone).toBe(12)
  })
})
