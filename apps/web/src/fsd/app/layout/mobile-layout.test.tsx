import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === "progress.tabs.campaign-events" ? "Campaign Events" : key,
  }),
}))

const loginRedirect = vi.fn().mockResolvedValue(undefined)

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    instance: { loginRedirect: (...args: unknown[]) => loginRedirect(...args) },
  }),
}))

const silentSignInStatus = vi.fn(() => "idle")

vi.mock("@/shared/auth", () => ({
  loginRequest: { scopes: ["api"] },
  useSilentSignInStatus: () => silentSignInStatus(),
}))

// Mirrors desktop-layout.test.tsx's reasoning: nav-items.ts reads `isUiKitEnabled` from the real
// `@/shared/config` module, which also calls `initReactI18next` at import time.
vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

vi.mock("../providers/auth-control", () => ({ AuthControl: () => null }))
vi.mock("../providers/theme-switcher", () => ({ ThemeSwitcher: () => null }))
const { startTour } = vi.hoisted(() => ({ startTour: vi.fn() }))
vi.mock("@/shared/tour", () => ({
  TourButton: () => null,
  PageTourButton: () => null,
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
import type { QuickAction, QuickActionsController } from "./quick-actions"

const noQuickActions = { actions: [], select: () => false, flush: () => {} }

function renderShell(
  onCreateGoal = vi.fn(),
  isAuthenticated = false,
  initialEntry = "/",
  activeSection: NavItem | undefined = undefined,
  quickActions: QuickActionsController = noQuickActions
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
        quickActions={quickActions}
      />
    </MemoryRouter>
  )
}

describe("MobileHeader", () => {
  beforeEach(() => {
    silentSignInStatus.mockReturnValue("idle")
    loginRedirect.mockClear().mockResolvedValue(undefined)
  })

  it("shows a 'checking' label on the sign-in button while a silent restore is in progress, and still signs in manually on click", async () => {
    silentSignInStatus.mockReturnValue("checking")
    renderShell()

    const signIn = screen.getByRole("button", { name: "auth.checkingSignIn" })

    fireEvent.click(signIn)

    await vi.waitFor(() => {
      expect(loginRedirect).toHaveBeenCalledTimes(1)
    })
  })

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
    const lookup = navItems.find((item) => item.path === "/library")!
    renderShell(vi.fn(), true, "/library/machines-of-war", lookup)

    expect(screen.getByTestId("section-tabs")).toBeInTheDocument()
    expect(
      screen.getByTestId("section-tab-library-machines-of-war")
    ).toHaveAttribute("data-state", "active")
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

    expect(
      drawer.getByText("library:collections.characters.label")
    ).toBeVisible()
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
    expect(drawer.queryByText("library:section.label")).not.toBeInTheDocument()
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

    expect(drawer.getByText("library:section.description")).toBeVisible()
    expect(
      drawer.getByText("library:collections.characters.description")
    ).toBeVisible()
  })

  it("finds an item by a query that only matches its description", () => {
    renderShell()

    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    const drawer = within(screen.getByTestId("mobile-menu"))

    fireEvent.change(screen.getByLabelText("nav.search"), {
      target: { value: "library:collections.npcs.description" },
    })

    expect(drawer.getByText("library:section.label")).toBeVisible()
    expect(drawer.getByText("library:collections.npcs.label")).toBeVisible()
    expect(
      drawer.queryByText("library:collections.characters.label")
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
      statusText: "SyncingР Р†Р вЂљР’В¦",
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

describe("MobileBottomNav quick actions in Menu search", () => {
  const createGoalAction: QuickAction = {
    id: "createGoal",
    icon: (() => null) as unknown as QuickAction["icon"],
    label: "Create Goal",
    description: "Open the new goal form",
    keywords: [],
  }
  const syncAction: QuickAction = {
    ...createGoalAction,
    id: "sync",
    label: "Sync with Tacticus",
    keywords: ["api"],
    disabledReason: "Syncing 1/2",
  }
  const controller = (actions: QuickAction[]) => ({
    actions,
    select: vi.fn((id: QuickAction["id"]) => {
      const found = actions.find((action) => action.id === id)
      return !!found && !found.disabledReason
    }),
    flush: vi.fn(),
  })

  it("shows the Quick actions group before Pages, with action buttons and page links", () => {
    renderShell(vi.fn(), true, "/", undefined, controller([createGoalAction]))
    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    const drawer = within(screen.getByTestId("mobile-menu"))

    expect(
      drawer
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual(["nav.quickActions.heading", "nav.quickActions.pagesHeading"])
    expect(drawer.getByRole("button", { name: /Create Goal/ })).toBeVisible()
    expect(drawer.getAllByRole("link").length).toBeGreaterThan(0)
  })

  it("selects an action, closes the drawer, and resets the query", () => {
    const quickActions = controller([createGoalAction])
    renderShell(vi.fn(), true, "/", undefined, quickActions)
    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    fireEvent.change(screen.getByLabelText("nav.search"), {
      target: { value: "goal" },
    })

    fireEvent.click(screen.getByRole("button", { name: /Create Goal/ }))

    expect(quickActions.select).toHaveBeenCalledWith("createGoal")
    expect(screen.getByTestId("mobile-menu-trigger")).toHaveAttribute(
      "data-state",
      "closed"
    )
    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    expect(screen.getByLabelText("nav.search")).toHaveValue("")
  })

  it("dispatches the selected action once after the drawer closes and never on a later close", () => {
    vi.useFakeTimers()
    try {
      const quickActions = controller([createGoalAction])
      renderShell(vi.fn(), true, "/", undefined, quickActions)
      fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
      fireEvent.click(screen.getByRole("button", { name: /Create Goal/ }))
      expect(quickActions.flush).not.toHaveBeenCalled()

      act(() => void vi.advanceTimersByTime(600))
      expect(quickActions.flush).toHaveBeenCalledTimes(1)

      fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
      fireEvent.keyDown(screen.getByTestId("mobile-menu"), { key: "Escape" })
      act(() => void vi.advanceTimersByTime(1000))
      expect(quickActions.flush).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it("keeps a disabled action visible with its reason and does not close the drawer", () => {
    const quickActions = controller([syncAction])
    renderShell(vi.fn(), true, "/", undefined, quickActions)
    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))

    const row = screen.getByRole("button", { name: /Sync with Tacticus/ })
    expect(row).toBeDisabled()
    expect(row).toHaveTextContent("Syncing 1/2")
    fireEvent.click(row)
    expect(quickActions.select).not.toHaveBeenCalled()
    expect(screen.getByTestId("mobile-menu")).toBeVisible()
  })

  it("shows no-results only when neither group matches", () => {
    renderShell(vi.fn(), true, "/", undefined, controller([createGoalAction]))
    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    const drawer = within(screen.getByTestId("mobile-menu"))

    fireEvent.change(screen.getByLabelText("nav.search"), {
      target: { value: "new goal form" },
    })
    expect(drawer.getByRole("button", { name: /Create Goal/ })).toBeVisible()
    expect(drawer.queryByText("nav.noResults")).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("nav.search"), {
      target: { value: "zzzz-nothing" },
    })
    expect(drawer.getByText("nav.noResults")).toBeVisible()
  })
})
