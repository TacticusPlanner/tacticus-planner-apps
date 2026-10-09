import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useDebouncedCommit } from "./use-debounced-commit"

describe("useDebouncedCommit", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const setup = (value: number | null) => {
    const commit = vi.fn()
    const hook = renderHook(
      ({ current }) => useDebouncedCommit(current, commit, 400),
      { initialProps: { current: value } }
    )
    return { ...hook, commit }
  }

  it("shows each edit at once and commits only the last one after the delay", () => {
    const { result, commit } = setup(3)
    act(() => result.current[1](4))
    act(() => vi.advanceTimersByTime(200))
    act(() => result.current[1](5))
    expect(result.current[0]).toBe(5)
    act(() => vi.advanceTimersByTime(399))
    expect(commit).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith(5)
  })

  it("commits nothing when the edits end on the starting value", () => {
    const { result, commit } = setup(3)
    act(() => result.current[1](4))
    act(() => result.current[1](3))
    act(() => vi.advanceTimersByTime(400))
    expect(commit).not.toHaveBeenCalled()
  })

  it("follows the value once nothing is pending", () => {
    const { result, rerender } = setup(3)
    rerender({ current: 8 })
    expect(result.current[0]).toBe(8)
  })

  it("commits a pending edit on unmount instead of dropping it", () => {
    const { result, commit, unmount } = setup(null)
    act(() => result.current[1](2))
    unmount()
    expect(commit).toHaveBeenCalledWith(2)
  })
})
