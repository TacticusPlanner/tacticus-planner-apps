import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useDelayedFlag } from "./use-delayed-flag"

describe("useDelayedFlag", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("turns true only after the delay while active", () => {
    const { result } = renderHook(() => useDelayedFlag(true, 1000))

    expect(result.current).toBe(false)
    act(() => {
      vi.advanceTimersByTime(999)
    })
    expect(result.current).toBe(false)
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(true)
  })

  it("resets as soon as it is no longer active and restarts the delay", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useDelayedFlag(active, 1000),
      { initialProps: { active: true } }
    )
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBe(true)

    rerender({ active: false })
    expect(result.current).toBe(false)

    rerender({ active: true })
    expect(result.current).toBe(false)
  })
})
