import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === "progress.tabs.campaign-events" ? "Campaign Events" : key,
  }),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance: { loginRedirect: () => Promise.resolve() } }),
}))

vi.mock("@/shared/auth", () => ({ loginRequest: { scopes: ["api"] } }))

// Mirrors desktop-layout.test.tsx's reasoning: nav-items.ts reads `isUiKitEnabled` from the real
// `@/shared/config` module, which also calls `initReactI18next` at import time.
vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

vi.mock("../providers/auth-control", () => ({ AuthControl: () => null }))
vi.mock("../providers/language-switcher", () => ({
  LanguageSwitcher: () => null,
}))
vi.mock("../providers/theme-switcher", () => ({ ThemeSwitcher: () => null }))
const { startTour } = vi.hoisted(() => ({ startTour: vi.fn() }))
vi.mock("@/shared/tour", () => ({
  TourButton: () => null,
  useTour: () => ({ isRunning: false, startTour }),
  useTourControlledPopoverOpen: () => [false, vi.fn()] as const,
}))

const { usePlayerDataSyncStatusMock } = vi.hoisted(() => ({
  usePlayerDataSyncStatusMock: vi.fn(() => ({
    status: "idle",
    isSyncing: false,
    statusText: "Up to date",
    syncNow: vi.fn(),
  })),
}))

vi.mock("../providers/player-data-sync-button", () => ({
  usePlayerDataSyncStatus: () => usePlayerDataSyncStatusMock(),
}))

import { MobileShell } from "./mobile-layout"
import type { NavItem } from "./nav-items"
import { navItems } from "./nav-items"

function renderShell(
  onCreateGoal = vi.fn(),
  isAuthenticated = false,
  initialEntry = "/",
  activeSection: NavItem | undefined = undefined
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <MobileShell
        activeSection={activeSection}
        isAuthenticated={isAuthenticated}
        visibleItems={navItems as NavItem[]}
        pageDescription="Home description"
        pageTitle="Home"
        onCreateGoal={onCreateGoal}
      />
    </MemoryRouter>
  )
}

describe("MobileHeader", () => {
  it("renders the page description beneath the page title", () => {
    renderShell()

    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument()
    expect(screen.getByText("Home description")).toBeInTheDocument()
  })

  it("renders no tab row when the active section has no children", () => {
    renderShell()

    expect(screen.queryByTestId("section-tabs")).not.toBeInTheDocument()
  })

  it("renders the active section's child pages as a tab row in the header", () => {
    const lookup = navItems.find((item) => item.path === "/lookup")!
    renderShell(vi.fn(), true, "/lookup/mow", lookup)

    expect(screen.getByTestId("section-tabs")).toBeInTheDocument()
    expect(screen.getByTestId("section-tab-lookup-mow")).toHaveAttribute(
      "data-state",
      "active"
    )
  })
})

describe("MobileBottomNav actions", () => {
  it("renders Create Goal and Sync with Tacticus as distinct action buttons, not nav links", () => {
    renderShell()

    const createGoal = screen.getByTestId("mobile-create-goal-button")
    const sync = screen.getByTestId("mobile-sync-button")

    // Actual <button> elements (not <a>/<Link>s like the regular nav items), with contained,
    // circular visual controls rather than detached floating buttons.
    expect(createGoal.tagName).toBe("BUTTON")
    expect(sync.tagName).toBe("BUTTON")
    expect(createGoal.querySelector(".rounded-full")).toBeInTheDocument()
    expect(sync.querySelector(".rounded-full")).toBeInTheDocument()
    expect(createGoal).toHaveTextContent("nav.addGoal")
    expect(sync).toHaveTextContent("nav.sync")
  })

  it("renders the requested mobile navigation order", () => {
    renderShell()

    const nav = screen.getByTestId("primary-nav")
    expect(
      Array.from(nav.children).map((item) => item.textContent?.trim())
    ).toEqual([
      "nav.home",
      "nav.goals",
      "nav.addGoal",
      "nav.sync",
      "nav.dailies",
      "nav.menu",
    ])
  })

  it("opens a searchable navigation drawer and filters destinations", () => {
    renderShell()

    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    expect(screen.getByTestId("mobile-menu")).toBeVisible()

    fireEvent.change(screen.getByLabelText("nav.search"), {
      target: { value: "uiKit" },
    })

    const drawer = within(screen.getByTestId("mobile-menu"))
    expect(drawer.getByText("nav.uiKit")).toBeVisible()
    expect(drawer.queryByText("nav.home")).not.toBeInTheDocument()
  })

  it("shows nested destinations and finds them by their localized label", () => {
    renderShell()

    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    const drawer = within(screen.getByTestId("mobile-menu"))

    expect(drawer.getByText("unitLookup.tabs.character")).toBeVisible()
    expect(drawer.getByText("goals.tabs.projects")).toBeVisible()
    expect(drawer.getByText("Campaign Events")).toBeVisible()
    expect(drawer.getByText("guild.tabs.members")).toBeVisible()
    // Dailies is `mobilePlacement: "primary"` (also a direct bottom-bar link) but, now that it has
    // children too, still gets the same nested-in-drawer treatment as every other section.
    expect(drawer.getByText("dailies:tabs.raids")).toBeVisible()
    expect(drawer.getByText("dailies:tabs.shops")).toBeVisible()

    fireEvent.change(screen.getByLabelText("nav.search"), {
      target: { value: "events" },
    })

    expect(drawer.getByText("nav.progress")).toBeVisible()
    expect(drawer.getByText("Campaign Events")).toBeVisible()
    expect(
      drawer.queryByText("progress.tabs.campaigns")
    ).not.toBeInTheDocument()
    expect(drawer.queryByText("nav.lookup")).not.toBeInTheDocument()
    // Clicking the filtered result links directly to that child page's own route.
    expect(drawer.getByText("Campaign Events").closest("a")).toHaveAttribute(
      "href",
      "/progress/campaign-events"
    )
  })

  it("shows each item's description beneath its label, for top-level and child items", () => {
    renderShell()

    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    const drawer = within(screen.getByTestId("mobile-menu"))

    expect(drawer.getByText("nav.lookupDescription")).toBeVisible()
    expect(
      drawer.getByText("unitLookup.tabs.characterDescription")
    ).toBeVisible()
  })

  it("finds an item by a query that only matches its description", () => {
    renderShell()

    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    const drawer = within(screen.getByTestId("mobile-menu"))

    fireEvent.change(screen.getByLabelText("nav.search"), {
      target: { value: "unitLookup.tabs.npcDescription" },
    })

    expect(drawer.getByText("nav.lookup")).toBeVisible()
    expect(drawer.getByText("unitLookup.tabs.npc")).toBeVisible()
    expect(
      drawer.queryByText("unitLookup.tabs.character")
    ).not.toBeInTheDocument()
  })

  it("marks only the exact nested destination as the current page", () => {
    renderShell(vi.fn(), true, "/progress/campaign-events")

    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    const drawer = within(screen.getByTestId("mobile-menu"))

    expect(drawer.getByText("Campaign Events").closest("a")).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(drawer.getByText("nav.progress").closest("a")).not.toHaveAttribute(
      "aria-current"
    )
  })

  it("starts the guided tour directly from the authenticated top bar", () => {
    renderShell(vi.fn(), true)

    fireEvent.click(screen.getByTestId("mobile-tour-button"))

    expect(startTour).toHaveBeenCalledTimes(1)
  })

  it("triggers the global Create Goal action", () => {
    const onCreateGoal = vi.fn()
    renderShell(onCreateGoal)

    fireEvent.click(screen.getByTestId("mobile-create-goal-button"))
    expect(onCreateGoal).toHaveBeenCalledTimes(1)
  })

  it("triggers a sync on click when idle, and is not disabled", () => {
    const syncNow = vi.fn()
    usePlayerDataSyncStatusMock.mockReturnValue({
      status: "idle",
      isSyncing: false,
      statusText: "Up to date",
      syncNow,
    })
    renderShell()

    const syncButton = screen.getByTestId("mobile-sync-button")
    expect(syncButton).not.toBeDisabled()

    fireEvent.click(syncButton)

    expect(syncNow).toHaveBeenCalledTimes(1)
  })

  it("spins the icon and disables the sync button while a sync is in progress", () => {
    usePlayerDataSyncStatusMock.mockReturnValue({
      status: "syncing",
      isSyncing: true,
      statusText: "Syncing…",
      syncNow: vi.fn(),
    })
    renderShell()

    const syncButton = screen.getByTestId("mobile-sync-button")
    expect(syncButton).toBeDisabled()
    expect(syncButton.querySelector("svg")).toHaveClass(
      "motion-safe:animate-spin"
    )
  })
})
