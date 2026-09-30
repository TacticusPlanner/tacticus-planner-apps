import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { useDesktopMenuState } from "./use-desktop-menu-state"

describe("useDesktopMenuState", () => {
  afterEach(() => {
    document.cookie = "sidebar_state=; path=/; max-age=0"
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it("starts with a compact main rail and an expanded section menu", () => {
    const { result } = renderHook(() => useDesktopMenuState())

    expect(result.current.primaryExpanded).toBe(false)
    expect(result.current.sectionExpanded).toBe(true)
  })

  it("keeps each menu choice independent and across re-renders", () => {
    const { result, rerender } = renderHook(() => useDesktopMenuState())

    act(() => result.current.setPrimaryExpanded(true))
    expect(result.current.primaryExpanded).toBe(true)
    expect(result.current.sectionExpanded).toBe(true)

    act(() => result.current.setSectionExpanded(false))
    rerender()
    expect(result.current.primaryExpanded).toBe(true)
    expect(result.current.sectionExpanded).toBe(false)
  })

  it("resets on a fresh document even with an old sidebar cookie and stored values", () => {
    document.cookie = "sidebar_state=true; path=/"
    window.localStorage.setItem("sidebar_state", "true")
    window.sessionStorage.setItem("sidebar_state", "true")

    const { result } = renderHook(() => useDesktopMenuState())

    expect(result.current.primaryExpanded).toBe(false)
    expect(result.current.sectionExpanded).toBe(true)
  })
})
