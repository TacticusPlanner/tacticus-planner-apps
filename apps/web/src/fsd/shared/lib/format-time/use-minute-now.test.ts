import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useMinuteNow } from "./use-minute-now"

describe("useMinuteNow", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] })
    vi.setSystemTime(new Date("2026-10-15T08:00:00Z"))
  })
  afterEach(() => vi.useRealTimers())

  it("returns the current instant and refreshes it once a minute", () => {
    const { result } = renderHook(() => useMinuteNow())
    expect(result.current).toBe(Date.parse("2026-10-15T08:00:00Z"))

    act(() => vi.advanceTimersByTime(59_999))
    expect(result.current).toBe(Date.parse("2026-10-15T08:00:00Z"))

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe(Date.parse("2026-10-15T08:01:00Z"))
  })

  it("stops ticking once unmounted", () => {
    const { unmount } = renderHook(() => useMinuteNow())
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
