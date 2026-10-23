import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { lazy } from "react"
import { Link, MemoryRouter, Route, Routes } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === "myGame.tabs.campaign-events" ? "Campaign Events" : key,
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
vi.mock("@/widgets/account-menu/ui/theme-switcher", () => ({
  ThemeSwitcher: () => null,
}))
const { startTour, tour } = vi.hoisted(() => ({
  startTour: vi.fn(),
  tour: { running: false },
}))
vi.mock("@/shared/tour", () => ({
  TourButton: () => null,
  PageTourButton: () => null,
  useTour: () => ({ isRunning: tour.running, startTour }),
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

vi.mock("@/features/player-data-sync", () => ({
  usePlayerDataSyncStatus: () => usePlayerDataSyncStatusMock(),
}))

import { MobileShell } from "./mobile-layout"
import type { NavItem } from "./nav-items"
import { filterVisibleNavItems, navItems } from "./nav-items"
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
        visibleItems={navItems}
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

    expect(drawer.getByText("nav.myGame")).toBeVisible()
    expect(drawer.getByText("Campaign Events")).toBeVisible()
    expect(drawer.queryByText("myGame.tabs.campaigns")).not.toBeInTheDocument()
    expect(drawer.queryByText("library:section.label")).not.toBeInTheDocument()
    // Clicking the filtered result links directly to that child page's own route.
    expect(drawer.getByText("Campaign Events").closest("a")).toHaveAttribute(
      "href",
      "/my-game/campaign-events"
    )
  })

  it("lists Legendary Events and its All events child, with descriptions, in the drawer only", () => {
    renderShell()

    const bar = screen.getByTestId("primary-nav")
    expect(
      within(bar).queryByText("nav.legendaryEvents")
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    const drawer = within(screen.getByTestId("mobile-menu"))

    expect(drawer.getByText("nav.legendaryEvents")).toBeVisible()
    expect(drawer.getByText("nav.legendaryEventsDescription")).toBeVisible()
    expect(drawer.getByText("legendaryEvents.tabs.allEvents")).toBeVisible()
    expect(
      drawer.getByText("legendaryEvents.tabs.allEventsDescription")
    ).toBeVisible()
    expect(
      drawer.getByText("legendaryEvents.tabs.allEvents").closest("a")
    ).toHaveAttribute("href", "/legendary-events")
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
    renderShell(vi.fn(), true, "/my-game/campaign-events")

    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    const drawer = within(screen.getByTestId("mobile-menu"))

    expect(drawer.getByText("Campaign Events").closest("a")).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(drawer.getByText("nav.myGame").closest("a")).not.toHaveAttribute(
      "aria-current"
    )
  })

  it("lists only Collection under My Game for an anonymous user, in the drawer and tab row", () => {
    const visible = filterVisibleNavItems(navItems, false)
    const myGame = visible.find((item) => item.path === "/my-game")
    render(
      <MemoryRouter initialEntries={["/my-game/collection"]}>
        <MobileShell
          activeSection={myGame}
          isAuthenticated={false}
          visibleItems={visible}
          pageDescription="Collection description"
          pageTitle="Collection"
          onCreateGoal={vi.fn()}
          quickActions={noQuickActions}
        />
      </MemoryRouter>
    )

    const tabs = within(screen.getByTestId("section-tabs"))
    expect(tabs.getByText("myGame.tabs.collection")).toBeVisible()
    expect(tabs.queryByText("myGame.tabs.onslaught")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    const drawer = within(screen.getByTestId("mobile-menu"))
    expect(drawer.getByText("nav.myGame")).toBeVisible()
    expect(
      drawer.getAllByText("myGame.tabs.collection").length
    ).toBeGreaterThan(0)
    expect(drawer.queryByText("myGame.tabs.onslaught")).not.toBeInTheDocument()
    expect(drawer.queryByText("Campaign Events")).not.toBeInTheDocument()
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

function StubPage() {
  return (
    <>
      <p>Page body</p>
      <Link to="?filter=on">Filter</Link>
      <Link to="/next">Next page</Link>
    </>
  )
}

const NeverLoads = lazy(() => new Promise<never>(() => {}))

function renderMobileRoutes(initialEntry = "/home") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          element={
            <MobileShell
              activeSection={undefined}
              isAuthenticated={false}
              visibleItems={navItems}
              pageDescription={undefined}
              pageTitle="Home"
              onCreateGoal={vi.fn()}
              quickActions={noQuickActions}
            />
          }
        >
          <Route element={<NeverLoads />} path="/pending" />
          <Route element={<StubPage />} path="*" />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe("MobileShell landmarks and focus", () => {
  beforeEach(() => {
    tour.running = false
  })

  it("renders the page inside one main landmark with the navigation outside it", () => {
    renderMobileRoutes()

    const main = screen.getByRole("main")
    expect(main).toContainElement(screen.getByText("Page body"))
    expect(main).not.toContainElement(screen.getByTestId("primary-nav"))
    expect(main).not.toContainElement(screen.getByRole("heading", { level: 1 }))
  })

  it("makes the skip link the first tab stop and moves focus into main", async () => {
    const user = userEvent.setup()
    renderMobileRoutes()

    await user.tab()
    expect(
      screen.getByRole("link", { name: "nav.skipToContent" })
    ).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(screen.getByRole("main")).toHaveFocus()
  })

  it("focuses the page h1 after navigation, but not on load or a query-only change", async () => {
    const user = userEvent.setup()
    renderMobileRoutes()
    expect(document.body).toHaveFocus()

    const filter = screen.getByRole("link", { name: "Filter" })
    await user.click(filter)
    expect(filter).toHaveFocus()

    await user.click(screen.getByRole("link", { name: "Next page" }))
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus()
  })

  it("focuses the page h1, not the Menu trigger, after navigating from the drawer", async () => {
    const user = userEvent.setup()
    renderMobileRoutes()

    await user.click(screen.getByTestId("mobile-menu-trigger"))
    const menu = await screen.findByTestId("mobile-menu")
    await user.click(
      within(menu).getAllByRole("link", { name: /nav\.goals/ })[0]!
    )

    await waitFor(() =>
      expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument()
    )
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus()
  })

  it("leaves focus alone while the tour is running", async () => {
    tour.running = true
    const user = userEvent.setup()
    renderMobileRoutes()

    const next = screen.getByRole("link", { name: "Next page" })
    await user.click(next)
    expect(next).toHaveFocus()
  })

  it("announces the lazy page fallback as a localized status", () => {
    renderMobileRoutes("/pending")

    expect(
      screen.getByRole("status", { name: "common.loading" })
    ).toBeInTheDocument()
  })
})
