import { render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import deDailies from "../../../../public/locales/de/dailies.json"
import frDailies from "../../../../public/locales/fr/dailies.json"

// Lets a test render real localized labels; every other key renders as itself.
const { localizedLabels } = vi.hoisted(() => ({
  localizedLabels: new Map<string, string>(),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { section?: string }) =>
      localizedLabels.get(key) ??
      (options?.section ? `${key} ${options.section}` : key),
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

  describe("with localized Dailies labels", () => {
    afterEach(() => localizedLabels.clear())

    it.each([
      ["de", deDailies.tabs],
      ["fr", frDailies.tabs],
    ])(
      "wraps every %s menu label in full instead of truncating it",
      (_locale, tabs) => {
        for (const [key, label] of Object.entries(tabs)) {
          localizedLabels.set(`dailies:tabs.${key}`, label)
        }
        const dailies = navItems.find(
          (item) => item.path === "/dailies"
        ) as NavItem
        render(
          <MemoryRouter initialEntries={["/dailies/raids"]}>
            <DesktopSectionNavigation
              expanded
              item={dailies}
              onExpandedChange={vi.fn()}
            />
          </MemoryRouter>
        )

        const menu = within(screen.getByTestId("desktop-section-navigation"))
        for (const key of ["raids", "hse", "hre", "shops", "guild-raids"]) {
          const label = tabs[key as keyof typeof tabs]
          const link = menu.getByRole("link", { name: label })
          expect(link).toHaveAttribute("title", label)
          const text = within(link).getByText(label)
          expect(text).toHaveClass("break-words")
          expect(text).not.toHaveClass("truncate")
        }
      }
    )
  })
})
