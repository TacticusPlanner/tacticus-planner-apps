import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { hseState, hreLive, questLive, signalReads } = vi.hoisted(() => ({
  hseState: { current: { status: "loading" } },
  hreLive: { current: false },
  questLive: { current: false },
  signalReads: { count: 0 },
}))
// Pass-through that counts the renders of every live-signal reader (NavLiveDot).
vi.mock("./hse-live-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./hse-live-context")>()
  return {
    ...actual,
    useEventLiveSignals: () => {
      signalReads.count++
      return actual.useEventLiveSignals()
    },
  }
})
vi.mock("@/features/daily-raids", () => ({
  useIsHomeScreenEventLive: () => {
    const state = hseState.current as { status: string; active?: unknown }
    return state.status === "ready" && !!state.active
  },
}))
vi.mock("@/features/hre-missions", () => ({
  useIsHreLive: () => hreLive.current,
}))
vi.mock("@/features/quest-event", () => ({
  useIsQuestLive: () => questLive.current,
}))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { section?: string }) =>
      options?.section ? `${key} ${options.section}` : key,
  }),
}))
vi.mock("@/shared/config", () => ({
  BUY_ME_A_COFFEE_URL: "https://coffee.example",
  DISCORD_INVITE_URL: "https://discord.example",
  isUiKitEnabled: true,
}))
vi.mock("@azure/msal-react", () => ({ useMsal: () => ({ instance: {} }) }))
vi.mock("@/shared/auth", () => ({
  loginRequest: { scopes: ["api"] },
  useSilentSignInStatus: () => "idle",
}))
vi.mock("@/widgets/account-menu/ui/player-data-sync-button", () => ({
  PlayerDataSyncButton: () => null,
}))
vi.mock("@/features/player-data-sync", () => ({
  usePlayerDataSyncStatus: () => ({
    status: "idle",
    isSyncing: false,
    statusText: "Up to date",
    syncNow: vi.fn(),
  }),
}))
vi.mock("../providers/auth-control", () => ({ AuthControl: () => null }))
vi.mock("@/widgets/account-menu/ui/theme-switcher", () => ({
  ThemeSwitcher: () => null,
}))
vi.mock("../providers/userjot-feedback-button", () => ({
  UserJotFeedbackButton: () => null,
}))
vi.mock("@/shared/tour", () => ({
  TourButton: () => null,
  PageTourButton: () => null,
  useTour: () => ({ isRunning: false, startTour: vi.fn() }),
  useTourControlledPopoverOpen: () => [false, vi.fn()] as const,
}))

import { DesktopNavigationDialog } from "./desktop-navigation-dialog"
import { DesktopShell } from "./desktop-layout"
import { HseLiveProvider } from "./hse-live-provider"
import { MobileShell } from "./mobile-layout"
import { NavLiveDot } from "./nav-live-dot"
import { navItems } from "./nav-items"
import { SectionTabs } from "./section-tabs"

const items = navItems
const dailies = items.find((item) => item.path === "/dailies")!
const noQuickActions = { actions: [], select: () => false, flush: () => {} }
const hunt = {
  definitionId: "hse-machine-hunt",
  startUtc: "2026-10-02T08:00:00Z",
  endUtc: "2026-10-06T08:00:00Z",
}
const ready = (active: typeof hunt | null) => ({
  status: "ready",
  active,
  next: null,
  upcoming: [],
  nowMs: 0,
})
const TEXT = "nav.eventLive"
const dots = (root: HTMLElement) =>
  within(root).queryAllByTestId("nav-live-dot")

function shell(ui: React.ReactNode, path = "/dailies/raids") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TooltipProvider>
        <HseLiveProvider>{ui}</HseLiveProvider>
      </TooltipProvider>
    </MemoryRouter>
  )
}
const desktop = (primaryExpanded: boolean) => (
  <DesktopShell
    activeSection={dailies}
    getEntryPath={(item) => item.path}
    onCreateGoal={vi.fn()}
    onPrimaryExpandedChange={vi.fn()}
    onSectionExpandedChange={vi.fn()}
    pageDescription="d"
    primaryExpanded={primaryExpanded}
    quickActions={noQuickActions}
    sectionExpanded
    sectionTitle="Dailies"
    visibleItems={items}
  />
)

describe.each([
  ["live (non-rule events included)", ready(hunt), 1],
  ["no active event", ready(null), 0],
  ["loading", { status: "loading" }, 0],
  ["error", { status: "error" }, 0],
])("nav live indicator: %s", (_name, state, expected) => {
  beforeEach(() => {
    hseState.current = state
    hreLive.current = false
    questLive.current = false
  })

  it("desktop side menu (expanded) marks only Dailies, with text beside the label", () => {
    shell(desktop(true))
    const nav = screen.getByTestId("primary-nav")
    expect(dots(nav)).toHaveLength(expected)
    expect(within(nav).queryAllByText(TEXT)).toHaveLength(expected)
    expect(dots(screen.getByTestId("desktop-nav-dailies")).length).toBe(
      expected
    )
    expect(dots(screen.getByTestId("desktop-nav-plan"))).toHaveLength(0)
  })

  it("desktop collapsed rail keeps a corner dot on the Dailies icon", () => {
    shell(desktop(false))
    const link = screen.getByTestId("desktop-nav-dailies")
    expect(dots(link)).toHaveLength(expected)
    if (expected) expect(dots(link)[0]).toHaveClass("absolute")
  })

  it("desktop section menu marks the HSE child only", () => {
    shell(desktop(true))
    const menu = screen.getByTestId("desktop-section-navigation")
    expect(dots(menu)).toHaveLength(expected)
    if (expected) {
      expect(
        within(
          screen.getByRole("link", { name: /dailies:tabs.hse/ })
        ).getByText(TEXT)
      ).toBeInTheDocument()
    }
  })

  it("section tabs mark the HSE tab only", () => {
    shell(<SectionTabs item={dailies} />)
    const tab = screen.getByTestId("section-tab-dailies-hse")
    expect(dots(tab)).toHaveLength(expected)
    expect(dots(screen.getByTestId("section-tab-dailies-raids"))).toHaveLength(
      0
    )
  })

  it("mobile bottom bar marks the Dailies icon, the drawer marks Dailies and HSE", () => {
    shell(
      <MobileShell
        activeSection={dailies}
        isAuthenticated
        onCreateGoal={vi.fn()}
        pageDescription="d"
        pageTitle="Dailies"
        quickActions={noQuickActions}
        visibleItems={items}
      />
    )
    const link = screen.getByTestId("mobile-nav-dailies")
    expect(dots(link)).toHaveLength(expected)
    if (expected) expect(within(link).getByText(TEXT)).toBeInTheDocument()
    expect(dots(screen.getByTestId("mobile-nav-plan"))).toHaveLength(0)

    fireEvent.click(screen.getByTestId("mobile-menu-trigger"))
    expect(dots(screen.getByTestId("mobile-menu"))).toHaveLength(expected * 2)
    fireEvent.change(screen.getByPlaceholderText("nav.search"), {
      target: { value: "hse" },
    })
    expect(dots(screen.getByTestId("mobile-menu"))).toHaveLength(0)
  })

  it("navigation dialog marks Dailies and HSE, but not search results", () => {
    shell(
      <DesktopNavigationDialog
        getEntryPath={(item) => item.path}
        items={items}
        onOpenChange={vi.fn()}
        open
        quickActions={noQuickActions}
      />
    )
    const dialog = screen.getByTestId("desktop-navigation-dialog")
    expect(dots(dialog)).toHaveLength(expected * 2)
    fireEvent.change(screen.getByLabelText("nav.search"), {
      target: { value: "hse" },
    })
    expect(dots(dialog)).toHaveLength(0)
  })
})

describe.each([
  [
    "only an HRE running",
    false,
    true,
    false,
    { hse: 0, hre: 1, quest: 0, dailies: 1 },
  ],
  [
    "an HSE and an HRE running",
    true,
    true,
    false,
    { hse: 1, hre: 1, quest: 0, dailies: 1 },
  ],
  [
    "only a quest running",
    false,
    false,
    true,
    { hse: 0, hre: 0, quest: 1, dailies: 1 },
  ],
  [
    "neither running",
    false,
    false,
    false,
    { hse: 0, hre: 0, quest: 0, dailies: 0 },
  ],
])("nav live indicator with %s", (_name, hse, hre, quest, expected) => {
  beforeEach(() => {
    hseState.current = ready(hse ? hunt : null)
    hreLive.current = hre
    questLive.current = quest
  })

  it("marks the HRE, HSE and Quest tabs by their own event", () => {
    shell(<SectionTabs item={dailies} />)
    expect(dots(screen.getByTestId("section-tab-dailies-hse"))).toHaveLength(
      expected.hse
    )
    expect(dots(screen.getByTestId("section-tab-dailies-hre"))).toHaveLength(
      expected.hre
    )
    expect(dots(screen.getByTestId("section-tab-dailies-quest"))).toHaveLength(
      expected.quest
    )
  })

  it("marks Dailies when either event runs", () => {
    shell(desktop(true))
    expect(dots(screen.getByTestId("desktop-nav-dailies"))).toHaveLength(
      expected.dailies
    )
  })
})

describe("nav live indicator accessibility", () => {
  it("hides the dot from assistive tech, keeps the text, and pulses only when motion is safe", () => {
    hseState.current = ready(hunt)
    shell(<SectionTabs item={dailies} />)
    const tab = screen.getByTestId("section-tab-dailies-hse")
    const dot = within(tab).getByTestId("nav-live-dot")

    expect(dot).toHaveAttribute("aria-hidden", "true")
    expect(within(tab).getByText(TEXT)).toHaveClass("sr-only")
    expect(dot.className).toContain("motion-safe:animate-pulse")
    expect(dot.className).not.toMatch(/(^|\s)animate-pulse/)
  })

  it("shows no indicator without a provider (signed out)", () => {
    render(
      <MemoryRouter initialEntries={["/dailies/raids"]}>
        <SectionTabs item={dailies} />
      </MemoryRouter>
    )
    expect(screen.queryByTestId("nav-live-dot")).toBeNull()
  })
})

describe("HseLiveProvider value", () => {
  it("keeps NavLiveDot from re-rendering while the signals are unchanged", () => {
    hseState.current = ready(hunt)
    hreLive.current = false
    questLive.current = false
    // One element reused across renders, so only a context change can re-render the dot.
    const dot = <NavLiveDot item={dailies} />
    const { rerender } = render(<HseLiveProvider>{dot}</HseLiveProvider>)
    const mounted = signalReads.count

    // A fresh query state that still means "HSE live" re-renders the provider only.
    hseState.current = ready({ ...hunt })
    rerender(<HseLiveProvider>{dot}</HseLiveProvider>)
    expect(signalReads.count).toBe(mounted)

    hreLive.current = true
    rerender(<HseLiveProvider>{dot}</HseLiveProvider>)
    expect(signalReads.count).toBeGreaterThan(mounted)
  })
})
