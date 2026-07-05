import { afterEach, describe, expect, it, vi } from "vitest"

describe("navItems", () => {
  afterEach(() => {
    vi.doUnmock("@/shared/config")
    vi.resetModules()
  })

  it("includes UI Kit navigation outside production", async () => {
    vi.doMock("@/shared/config", () => ({ isUiKitEnabled: true }))

    const { navItems } = await import("./nav-items")

    expect(navItems.map((item) => item.labelKey)).toContain("nav.uiKit")
    expect(
      navItems.find((item) => item.labelKey === "nav.uiKit")
    ).toMatchObject({
      mobilePlacement: "menu",
      path: "/ui-kit",
    })
  })

  it("hides UI Kit navigation in production", async () => {
    vi.doMock("@/shared/config", () => ({ isUiKitEnabled: false }))

    const { navItems } = await import("./nav-items")

    expect(navItems.map((item) => item.labelKey)).not.toContain("nav.uiKit")
  })
})
