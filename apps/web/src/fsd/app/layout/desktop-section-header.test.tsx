import { fireEvent, render, screen } from "@testing-library/react"
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

  it("renders only the active child's title while the section menu is expanded", () => {
    renderHeader(lookupItem, "Library", "/library/machines-of-war")

    const title = screen.getByTestId("section-header-title")
    expect(title).toHaveTextContent("library:collections.machinesOfWar.label")
    expect(title).not.toHaveTextContent("Library")
    expect(screen.queryByTestId("section-header-breadcrumb")).toBeNull()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("adds a reopen button and a 'Section >' breadcrumb while the menu is collapsed", () => {
    const onExpand = vi.fn()
    render(
      <MemoryRouter initialEntries={["/library/machines-of-war"]}>
        <DesktopSectionHeader
          item={lookupItem}
          onSectionExpandedChange={onExpand}
          sectionExpanded={false}
          title="Library"
        />
      </MemoryRouter>
    )

    const breadcrumb = screen.getByTestId("section-header-breadcrumb")
    expect(breadcrumb).toHaveTextContent("Library")
    expect(breadcrumb).toHaveTextContent("\u203a")
    expect(screen.getByTestId("section-header-title")).toHaveTextContent(
      "library:collections.machinesOfWar.label"
    )
    const reopen = screen.getByRole("button")
    expect(reopen).toHaveAttribute("aria-expanded", "false")

    fireEvent.click(reopen)
    expect(onExpand).toHaveBeenCalledWith(true)
  })

  it("falls back to the section's default child when the route matches no specific child", () => {
    renderHeader(lookupItem, "Library", "/library")

    expect(screen.getByTestId("section-header-title")).toHaveTextContent(
      "library:collections.characters.label"
    )
  })
})
