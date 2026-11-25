// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  PRIMARY_MENU_STORAGE_KEY,
  SECTION_MENU_STORAGE_KEY,
  useDesktopMenuState,
} from "./use-desktop-menu-state"

describe("useDesktopMenuState", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.cookie = "sidebar_state=; path=/; max-age=0"
    window.localStorage.clear()
  })

  it("starts with a compact main rail and an expanded section menu on a new device", () => {
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

  it("remembers both choices on the device, so a reload restores them", () => {
    const first = renderHook(() => useDesktopMenuState())
    act(() => first.result.current.setPrimaryExpanded(true))
    act(() => first.result.current.setSectionExpanded(false))
    first.unmount()

    const { result } = renderHook(() => useDesktopMenuState())

    expect(window.localStorage.getItem(PRIMARY_MENU_STORAGE_KEY)).toBe(
      "expanded"
    )
    expect(window.localStorage.getItem(SECTION_MENU_STORAGE_KEY)).toBe(
      "collapsed"
    )
    expect(result.current.primaryExpanded).toBe(true)
    expect(result.current.sectionExpanded).toBe(false)
  })

  it("never restores from the sidebar's own cookie or an unknown stored value", () => {
    document.cookie = "sidebar_state=true; path=/"
    window.localStorage.setItem(PRIMARY_MENU_STORAGE_KEY, "true")
    window.localStorage.setItem(SECTION_MENU_STORAGE_KEY, "wide")

    const { result } = renderHook(() => useDesktopMenuState())

    expect(result.current.primaryExpanded).toBe(false)
    expect(result.current.sectionExpanded).toBe(true)
  })

  it("falls back to the defaults and still toggles when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })

    const { result } = renderHook(() => useDesktopMenuState())
    expect(result.current.primaryExpanded).toBe(false)
    expect(result.current.sectionExpanded).toBe(true)

    act(() => result.current.setPrimaryExpanded(true))
    expect(result.current.primaryExpanded).toBe(true)
  })
})
