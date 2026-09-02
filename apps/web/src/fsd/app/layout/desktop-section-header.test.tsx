import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Mirrors desktop-layout.test.tsx's reasoning: nav-items.ts reads `isUiKitEnabled` from the real
// `@/shared/config` module, which also calls `initReactI18next` at import time.
vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

import { DesktopSectionHeader } from "./desktop-section-header"
import type { NavItem } from "./nav-items"
import { navItems } from "./nav-items"

function renderHeader(
  item: NavItem | undefined,
  title: string | undefined,
  initialEntry: string
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <DesktopSectionHeader item={item} title={title} />
    </MemoryRouter>
  )
}

const homeItem = navItems.find((item) => item.path === "/home")!
const lookupItem = navItems.find((item) => item.path === "/library")!

describe("DesktopSectionHeader", () => {
  it("renders a plain title, with no breadcrumb, for a section with no children", () => {
    renderHeader(homeItem, "Home", "/home")

    const title = screen.getByTestId("section-header-title")
    expect(title).toHaveTextContent("Home")
    expect(title).not.toHaveTextContent("›")
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renders nothing when there is no title", () => {
    const { container } = renderHeader(lookupItem, undefined, "/library")

    expect(container.querySelector("h1")).toBeNull()
  })

  it("renders a plain, non-interactive '{Section} › {Active child}' breadcrumb for a section with children", () => {
    renderHeader(lookupItem, "Library", "/library/machines-of-war")

    const title = screen.getByTestId("section-header-title")
    expect(title).toHaveTextContent("Library")
    expect(title).toHaveTextContent("›")
    expect(title).toHaveTextContent("library:collections.machinesOfWar.label")
    // Neither segment is a link or a button - switching children happens only via the sidebar
    // flyout, search, or a direct link now.
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("falls back to the section's default child when the route matches no specific child", () => {
    renderHeader(lookupItem, "Library", "/library")

    expect(screen.getByTestId("section-header-title")).toHaveTextContent(
      "library:collections.characters.label"
    )
  })
})
