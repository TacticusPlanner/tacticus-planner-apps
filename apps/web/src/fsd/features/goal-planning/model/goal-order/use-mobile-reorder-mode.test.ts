import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useMobileReorderMode } from "./use-mobile-reorder-mode"

function attachList(
  result: { current: ReturnType<typeof useMobileReorderMode> },
  list: HTMLDivElement
) {
  ;(result.current.listRef as { current: HTMLDivElement | null }).current = list
}

describe("useMobileReorderMode", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("brings the list into view and focuses it when the mode is turned on", () => {
    const list = document.createElement("div")
    list.tabIndex = -1
    list.scrollIntoView = vi.fn()
    const focus = vi.spyOn(list, "focus")
    const { result } = renderHook(() => useMobileReorderMode())
    attachList(result, list)

    act(() => result.current.toggle())

    expect(result.current.active).toBe(true)
    expect(list.scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "smooth",
    })
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it("does not animate the scroll when the user prefers reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }))
    const list = document.createElement("div")
    list.scrollIntoView = vi.fn()
    const { result } = renderHook(() => useMobileReorderMode())
    attachList(result, list)

    act(() => result.current.toggle())

    expect(list.scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "auto",
    })
  })

  it("leaves the list alone when the mode is turned off", () => {
    const list = document.createElement("div")
    list.scrollIntoView = vi.fn()
    const { result } = renderHook(() => useMobileReorderMode())
    attachList(result, list)

    act(() => result.current.toggle())
    act(() => result.current.exit())

    expect(result.current.active).toBe(false)
    expect(list.scrollIntoView).toHaveBeenCalledTimes(1)
  })
})
