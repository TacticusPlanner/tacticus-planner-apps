import { describe, expect, it, vi } from "vitest"

// Mirrors desktop-layout.test.tsx's reasoning: nav-items.ts reads `isUiKitEnabled` from the real
// `@/shared/config` module, which also calls `initReactI18next` at import time.
vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

import { navItems } from "./nav-items"
import { resolveActiveNavigation } from "./resolve-active-navigation"

describe("resolveActiveNavigation", () => {
  it("resolves a top-level section with no matching child, e.g. Home", () => {
    const { activeChild, activeItem } = resolveActiveNavigation(
      navItems,
      "/home"
    )

    expect(activeItem?.path).toBe("/home")
    expect(activeChild).toBeUndefined()
  })

  it("resolves a top-level section with no NavSubItems, e.g. Dailies", () => {
    const { activeChild, activeItem } = resolveActiveNavigation(
      navItems,
      "/dailies"
    )

    expect(activeItem?.path).toBe("/dailies")
    expect(activeChild).toBeUndefined()
  })

  it("resolves the active child when the route matches a child page", () => {
    const { activeChild, activeItem } = resolveActiveNavigation(
      navItems,
      "/library/machines-of-war"
    )

    expect(activeItem?.path).toBe("/library")
    expect(activeChild?.path).toBe("/library/machines-of-war")
  })

  it("swaps the active child when the route moves to a sibling child page", () => {
    const first = resolveActiveNavigation(navItems, "/library/characters")
    const second = resolveActiveNavigation(navItems, "/library/machines-of-war")

    expect(first.activeChild?.path).toBe("/library/characters")
    expect(second.activeChild?.path).toBe("/library/machines-of-war")
  })

  it("resolves nothing for an unmatched route", () => {
    const { activeChild, activeItem } = resolveActiveNavigation(
      navItems,
      "/not-a-route"
    )

    expect(activeItem).toBeUndefined()
    expect(activeChild).toBeUndefined()
  })
})
