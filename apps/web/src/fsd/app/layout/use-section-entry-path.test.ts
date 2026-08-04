import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mirrors desktop-layout.test.tsx's reasoning: nav-items.ts reads `isUiKitEnabled` from the real
// `@/shared/config` module, which also calls `initReactI18next` at import time.
vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

import { navItems } from "./nav-items"
import { useSectionEntryPath } from "./use-section-entry-path"

const STORAGE_KEY = "nav.lastVisitedChild"

describe("useSectionEntryPath", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("falls back to the section's own path on first visit", () => {
    const { result } = renderHook(() => useSectionEntryPath(navItems, "/home"))

    const lookup = navItems.find((item) => item.path === "/lookup")!
    expect(result.current.getEntryPath(lookup)).toBe("/lookup")
  })

  it("records a child route visited directly, not via the sidebar", () => {
    const { rerender, result } = renderHook(
      ({ pathname }) => useSectionEntryPath(navItems, pathname),
      { initialProps: { pathname: "/lookup/mow" } }
    )
    // Re-render on a different route so the effect from the initial mount has run.
    rerender({ pathname: "/home" })

    const lookup = navItems.find((item) => item.path === "/lookup")!
    expect(result.current.getEntryPath(lookup)).toBe("/lookup/mow")
  })

  it("returns the previously recorded child after visiting a different section", () => {
    const { rerender, result } = renderHook(
      ({ pathname }) => useSectionEntryPath(navItems, pathname),
      { initialProps: { pathname: "/lookup/npc" } }
    )
    rerender({ pathname: "/progress" })
    rerender({ pathname: "/lookup" })

    const lookup = navItems.find((item) => item.path === "/lookup")!
    expect(result.current.getEntryPath(lookup)).toBe("/lookup/npc")
  })

  it("treats Dailies as a multi-child section too, once it has children", () => {
    const { rerender, result } = renderHook(
      ({ pathname }) => useSectionEntryPath(navItems, pathname),
      { initialProps: { pathname: "/dailies/shops" } }
    )
    rerender({ pathname: "/home" })

    const dailies = navItems.find((item) => item.path === "/dailies")!
    expect(result.current.getEntryPath(dailies)).toBe("/dailies/shops")
  })

  it("always returns the item's own path for single-child or no-children items", () => {
    const { rerender, result } = renderHook(
      ({ pathname }) => useSectionEntryPath(navItems, pathname),
      { initialProps: { pathname: "/guild/members" } }
    )
    rerender({ pathname: "/home" })

    const guild = navItems.find((item) => item.path === "/guild")!
    const home = navItems.find((item) => item.path === "/home")!
    expect(result.current.getEntryPath(guild)).toBe("/guild")
    expect(result.current.getEntryPath(home)).toBe("/home")
  })

  it("honors a value persisted to sessionStorage on a fresh mount", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ "/lookup": "/lookup/mow" })
    )

    const { result } = renderHook(() => useSectionEntryPath(navItems, "/home"))

    const lookup = navItems.find((item) => item.path === "/lookup")!
    expect(result.current.getEntryPath(lookup)).toBe("/lookup/mow")
  })

  it("falls back to the default child when the stored path is no longer a current child", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ "/lookup": "/lookup/retired-tab" })
    )

    const { result } = renderHook(() => useSectionEntryPath(navItems, "/home"))

    const lookup = navItems.find((item) => item.path === "/lookup")!
    expect(result.current.getEntryPath(lookup)).toBe("/lookup")
  })

  it("falls back to the in-memory default when sessionStorage read/write throws", () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("storage disabled")
      })
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage disabled")
      })

    const { rerender, result } = renderHook(
      ({ pathname }) => useSectionEntryPath(navItems, pathname),
      { initialProps: { pathname: "/lookup/mow" } }
    )

    expect(() => rerender({ pathname: "/home" })).not.toThrow()
    const lookup = navItems.find((item) => item.path === "/lookup")!
    // The write failed, but the in-memory state from this session still resolves correctly.
    expect(result.current.getEntryPath(lookup)).toBe("/lookup/mow")

    getItemSpy.mockRestore()
    setItemSpy.mockRestore()
  })
})
