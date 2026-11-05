import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { useLaneSelection } from "./use-lane-selection"

describe("useLaneSelection", () => {
  beforeEach(() => localStorage.clear())

  it("shows the first selected lane on mobile until one is picked", () => {
    localStorage.setItem("legendaryEvents.eventBoard.lanes", "beta,gamma")
    const { result } = renderHook(() => useLaneSelection(true))
    expect(result.current.shown).toEqual(["beta"])
  })

  it("keeps the desktop selection when a lane is picked on mobile", () => {
    const mobile = renderHook(() => useLaneSelection(true))
    act(() => mobile.result.current.onPick("gamma"))
    expect(mobile.result.current.shown).toEqual(["gamma"])

    const desktop = renderHook(() => useLaneSelection(false))
    expect(desktop.result.current.shown).toEqual(["alpha", "beta", "gamma"])
  })

  it("reveals a lane on mobile by picking it", () => {
    const { result } = renderHook(() => useLaneSelection(true))
    act(() => result.current.reveal("beta"))
    expect(result.current.shown).toEqual(["beta"])
    expect(localStorage.getItem("legendaryEvents.eventBoard.lanes")).toBeNull()
  })

  it("remembers the picked mobile lane after a remount", () => {
    const first = renderHook(() => useLaneSelection(true))
    act(() => first.result.current.onPick("gamma"))
    first.unmount()
    expect(localStorage.getItem("legendaryEvents.lanes.mobile")).toBe("gamma")

    const second = renderHook(() => useLaneSelection(true))
    expect(second.result.current.shown).toEqual(["gamma"])
  })
})
