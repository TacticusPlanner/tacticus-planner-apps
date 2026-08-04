import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
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

function LocationProbe() {
  const { pathname } = useLocation()
  return <span data-testid="current-path">{pathname}</span>
}

function renderHeader(
  item: NavItem | undefined,
  title: string | undefined,
  initialEntry: string
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <DesktopSectionHeader item={item} title={title} />
      <Routes>
        <Route element={<LocationProbe />} path="*" />
      </Routes>
    </MemoryRouter>
  )
}

const homeItem = navItems.find((item) => item.path === "/home")!
const lookupItem = navItems.find((item) => item.path === "/lookup")!

// No current section has more than 6 children (Dailies, the largest, sits at the inline
// threshold), so the breadcrumb-dropdown branch needs its own manufactured fixture to exercise it
// - see desktop-section-header.tsx's MAX_INLINE_TABS.
const overflowItem: NavItem = {
  ...lookupItem,
  path: "/overflow-test",
  children: Array.from({ length: 7 }, (_, index) => ({
    path: `/overflow-test/child-${index}`,
    labelKey: lookupItem.labelKey,
    descriptionKey: lookupItem.descriptionKey,
  })),
}

describe("DesktopSectionHeader", () => {
  it("renders a plain title, with no picker, for a section with no children", () => {
    renderHeader(homeItem, "Home", "/home")

    expect(screen.getByTestId("section-header-title")).toHaveTextContent("Home")
    expect(screen.queryByTestId("section-tabs")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("section-header-dropdown")
    ).not.toBeInTheDocument()
  })

  it("renders nothing when there is no title", () => {
    const { container } = renderHeader(lookupItem, undefined, "/lookup")

    expect(container.querySelector("h1")).toBeNull()
    expect(screen.queryByTestId("section-tabs")).not.toBeInTheDocument()
  })

  it("renders every child inline as a plain nav link (not a Tabs component), and navigates on click", async () => {
    const user = userEvent.setup()
    renderHeader(lookupItem, "Lookup", "/lookup/mow")

    const nav = screen.getByTestId("section-tabs")
    expect(nav.tagName).toBe("NAV")
    expect(screen.getByTestId("section-tab-lookup-mow")).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(
      screen.getByTestId("section-tab-lookup-character")
    ).not.toHaveAttribute("aria-current")

    await user.click(screen.getByTestId("section-tab-lookup-npc"))

    expect(screen.getByTestId("current-path")).toHaveTextContent("/lookup/npc")
  })

  it("falls back to a breadcrumb dropdown once a section has more children than the inline threshold", async () => {
    const user = userEvent.setup()
    renderHeader(overflowItem, "Overflow", "/overflow-test/child-2")

    expect(screen.queryByTestId("section-tabs")).not.toBeInTheDocument()
    const trigger = screen.getByTestId("section-header-dropdown")
    expect(trigger).toHaveTextContent("Overflow")

    await user.click(trigger)
    await user.click(
      screen.getByTestId("section-header-dropdown-item-overflow-test-child-5")
    )

    expect(screen.getByTestId("current-path")).toHaveTextContent(
      "/overflow-test/child-5"
    )
  })
})
