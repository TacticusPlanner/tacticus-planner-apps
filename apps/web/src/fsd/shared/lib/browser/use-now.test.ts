// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useNow } from "./use-now"

let hidden = false

function setHidden(next: boolean) {
  hidden = next
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"))
  })
}

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

describe("useNow", () => {
  beforeEach(() => {
    hidden = false
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() =>
      hidden ? "hidden" : "visible"
    )
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-02T12:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("publishes the new instant on every tick while the tab is visible", () => {
    const { result } = renderHook(() => useNow(1000))
    const first = result.current

    advance(1000)

    expect(result.current).toBe(first + 1000)
  })

  it("stops while the tab is hidden and catches up as soon as it is shown", () => {
    let renders = 0
    const { result } = renderHook(() => {
      renders += 1
      return useNow(1000)
    })
    setHidden(true)
    const before = renders

    advance(10_000)
    expect(renders).toBe(before)

    setHidden(false)
    expect(result.current).toBe(Date.now())

    advance(1000)
    expect(result.current).toBe(Date.now())
  })

  it("runs one interval per tick length, however many subscribe", () => {
    const setInterval = vi.spyOn(window, "setInterval")
    const a = renderHook(() => useNow(5000))
    const b = renderHook(() => useNow(5000))

    expect(setInterval).toHaveBeenCalledOnce()
    advance(5000)
    expect(a.result.current).toBe(b.result.current)
  })

  it("re-renders a selecting host only when the selection changes", () => {
    let renders = 0
    const { result } = renderHook(() => {
      renders += 1
      return useNow(1000, (nowMs) => Math.floor(nowMs / 10_000))
    })
    const before = renders

    advance(1000)
    expect(renders).toBe(before)

    advance(9000)
    expect(renders).toBeGreaterThan(before)
    expect(result.current).toBe(Math.floor(Date.now() / 10_000))
  })

  it("starts a fresh mount from the current time while its clock is stopped", () => {
    const first = renderHook(() => useNow(2000))
    first.unmount()

    advance(60_000)
    const { result } = renderHook(() => useNow(2000))

    expect(result.current).toBe(Date.now())
  })
})
