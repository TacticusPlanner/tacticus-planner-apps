import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes, Route, useLocation } from "react-router"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Mirrors desktop-layout.test.tsx's reasoning: nav-items.ts reads `isUiKitEnabled` from the real
// `@/shared/config` module, which also calls `initReactI18next` at import time.
vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

import { navItems } from "./nav-items"
import { SectionTabs } from "./section-tabs"

function LocationProbe() {
  const { pathname } = useLocation()
  return <span data-testid="current-path">{pathname}</span>
}

function renderTabs(item: (typeof navItems)[number], initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SectionTabs item={item} />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

describe("SectionTabs", () => {
  it("renders nothing for a section with no children", () => {
    const home = navItems.find((item) => item.path === "/home")!
    const { container } = renderTabs(home, "/home")

    expect(container.querySelector('[data-testid="section-tabs"]')).toBeNull()
  })

  it("lists every child page and marks the active one", () => {
    const lookup = navItems.find((item) => item.path === "/library")!
    renderTabs(lookup, "/library/machines-of-war")

    expect(screen.getByTestId("section-tab-library-characters")).toBeVisible()
    expect(
      screen.getByTestId("section-tab-library-machines-of-war")
    ).toHaveAttribute("data-state", "active")
    expect(screen.getByTestId("section-tab-library-npcs")).toHaveAttribute(
      "data-state",
      "inactive"
    )
  })

  it("navigates to a child's route when its tab is clicked", async () => {
    const user = userEvent.setup()
    const lookup = navItems.find((item) => item.path === "/library")!
    renderTabs(lookup, "/library/characters")

    await user.click(screen.getByTestId("section-tab-library-npcs"))

    expect(screen.getByTestId("current-path")).toHaveTextContent(
      "/library/npcs"
    )
  })

  it("still renders a single-tab row for a single-child section", () => {
    const guild = navItems.find((item) => item.path === "/guild")!
    renderTabs(guild, "/guild/members")

    expect(screen.getByTestId("section-tab-guild-members")).toHaveAttribute(
      "data-state",
      "active"
    )
  })

  it("marks a nested route's ancestor tab active, e.g. Dailies > Raids > Today", () => {
    const dailies = navItems.find((item) => item.path === "/dailies")!
    renderTabs(dailies, "/dailies/raids/today")

    expect(screen.getByTestId("section-tab-dailies-raids")).toHaveAttribute(
      "data-state",
      "active"
    )
  })
})
