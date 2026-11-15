import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useIsCoarsePointer } from "./use-coarse-pointer"

function stubPointerQuery(initial: boolean) {
  let matches = initial
  const listeners = new Set<() => void>()
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        get matches() {
          return query === "(pointer: coarse)" && matches
        },
        addEventListener: (_: string, listener: () => void) =>
          listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) =>
          listeners.delete(listener),
      }) as unknown as MediaQueryList
  )
  return (next: boolean) => {
    matches = next
    for (const listener of listeners) listener()
  }
}

describe("useIsCoarsePointer", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("is true when the primary pointer is touch", () => {
    stubPointerQuery(true)
    const { result } = renderHook(() => useIsCoarsePointer())
    expect(result.current).toBe(true)
  })

  it("is false for a mouse and follows changes to the query", () => {
    const setCoarse = stubPointerQuery(false)
    const { result } = renderHook(() => useIsCoarsePointer())
    expect(result.current).toBe(false)

    act(() => setCoarse(true))
    expect(result.current).toBe(true)
  })
})
