import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { HRE_PROGRESS_STORAGE_KEY, useHreProgress } from "./use-hre-progress"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useHreProgress", () => {
  it("keeps mission 5 at 37 wins across a reload", () => {
    const first = renderHook(() => useHreProgress("occ-zapspitta"))
    act(() => first.result.current[1].setMission(5))
    act(() => first.result.current[1].setObjectiveProgress(1, 37))
    first.unmount()

    const reloaded = renderHook(() => useHreProgress("occ-zapspitta"))
    expect(reloaded.result.current[0]).toMatchObject({
      mission: 5,
      progress: [0, 37],
    })
  })

  it("clamps progress to the target and advances on Mission complete", () => {
    const { result } = renderHook(() => useHreProgress("occ-zapspitta"))
    act(() => result.current[1].setMission(5))
    act(() => result.current[1].setObjectiveProgress(1, 140))
    expect(result.current[0].progress).toEqual([0, 100])
    act(() => result.current[1].setObjectiveProgress(0, 10_000))
    act(() => result.current[1].completeMission())
    expect(result.current[0]).toMatchObject({ mission: 6, progress: [0, 0] })
  })

  it("starts a new instance fresh", () => {
    window.localStorage.setItem(
      HRE_PROGRESS_STORAGE_KEY,
      JSON.stringify({ "occ-sekhetar": { mission: 12, progress: [1, 0] } })
    )
    const { result } = renderHook(() => useHreProgress("occ-zapspitta"))
    expect(result.current[0]).toMatchObject({ mission: 1, progress: [0, 0] })
  })

  it("drops invalid stored data", () => {
    window.localStorage.setItem(HRE_PROGRESS_STORAGE_KEY, "{not json")
    const { result } = renderHook(() => useHreProgress("occ-zapspitta"))
    expect(result.current[0].mission).toBe(1)
  })

  it("works in memory when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const { result } = renderHook(() => useHreProgress("occ-zapspitta"))
    act(() => result.current[1].setMission(5))
    expect(result.current[0].mission).toBe(5)
  })

  it("stores points and rank with the mission progress", () => {
    const { result } = renderHook(() => useHreProgress("occ-zapspitta"))
    act(() => result.current[1].setPoints(14_500))
    act(() => result.current[1].setRank(3200))
    const stored = JSON.parse(
      window.localStorage.getItem(HRE_PROGRESS_STORAGE_KEY) ?? "{}"
    ) as Record<string, unknown>
    expect(stored["occ-zapspitta"]).toMatchObject({
      points: 14_500,
      rank: 3200,
    })
  })
})
