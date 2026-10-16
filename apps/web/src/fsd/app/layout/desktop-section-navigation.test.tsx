import { render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { section?: string }) =>
      options?.section ? `${key} ${options.section}` : key,
  }),
}))
// `./nav-items` reads `isUiKitEnabled` from the config barrel, which also runs the i18n setup.
vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

import { DesktopSectionNavigation } from "./desktop-section-navigation"
import { navItems, type NavItem } from "./nav-items"

const legendaryEvents = navItems.find(
  (item) => item.path === "/legendary-events"
) as NavItem

const renderAt = (pathname: string) =>
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <DesktopSectionNavigation
        expanded
        item={legendaryEvents}
        onExpandedChange={vi.fn()}
      />
    </MemoryRouter>
  )

const currentLinks = () =>
  within(screen.getByTestId("desktop-section-navigation"))
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "page")
    .map((link) => link.textContent)

describe("DesktopSectionNavigation", () => {
  it("marks only the most specific child current, not the landing child above it", () => {
    renderAt("/legendary-events/master-table")
    expect(currentLinks()).toEqual(["legendaryEvents.tabs.masterTable"])
  })

  it("marks the landing child current at the section root", () => {
    renderAt("/legendary-events")
    expect(currentLinks()).toEqual(["legendaryEvents.tabs.allEvents"])
  })
})
