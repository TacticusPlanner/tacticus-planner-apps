import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { GameCatalogEventShop } from "@workspace/game-catalog"

import type { EventShopPlan } from "@/entities/event-shop"
import type {
  EventShopCoverageState,
  RosterShopContext,
} from "@/features/shops/event-planner"
import { act, render, screen, waitFor, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

import type { DailiesOutletContext } from "../dailies-layout"
import {
  cartEntry,
  endedEvent,
  NOW,
  plan,
  runningEvent,
  upcomingEvent,
} from "./event-shop.test-fixture"
import { EventShopPage } from "./event-shop-page"
import { localResetTime } from "./event-shop-name"

const MISSION_TEXT: Record<string, string> = {
  "tasks.TraverseHexes":
    "Traverse {[TARGET_AMOUNT]} hexes with your characters",
  "chains.October2026FreeMissionChain":
    "TRENCH FIGHTERS – {[CHAIN_POSITION]}/{[CHAIN_LENGTH]}",
}

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values && Object.keys(values).some((name) => name !== "defaultValue")
        ? `${key}:${JSON.stringify(values)}`
        : key,
    i18n: {
      language: "en",
      getResource: (_lng: string, _ns: string, key: string) =>
        MISSION_TEXT[key],
    },
  }),
}))

const registeredTour = vi.fn()
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => registeredTour(steps),
}))

let events: GameCatalogEventShop[] | "loading" | "error" = []
const retryCatalog = vi.fn()
vi.mock("@/shared/local-data", () => ({
  toById: <T extends { id: string }>(records: T[]) =>
    new Map(records.map((record) => [record.id, record])),
  useCatalogDataset: (
    key: string,
    select?: (records: unknown[]) => unknown
  ) => {
    if (key !== "event-shops") {
      return { status: "ready", data: select ? select([]) : [], retry: vi.fn() }
    }
    if (events === "loading") return { status: "loading", retry: vi.fn() }
    if (events === "error") return { status: "error", retry: retryCatalog }
    return {
      status: "ready",
      data: select ? select(events) : events,
      retry: vi.fn(),
    }
  },
  usePlayerChunk: () => ({ status: "ready", data: null, retry: vi.fn() }),
}))

const synced: RosterShopContext = {
  lockContext: { tier: "high", starsByUnitId: { astraYarrick: 3 } },
  powerLevel: 50,
  lastSyncedAt: "2026-10-29T10:00:00Z",
}
let roster: RosterShopContext = synced
vi.mock("@/features/shops/event-planner/model/use-roster-shop-context", () => ({
  useRosterShopContext: () => roster,
}))
let coverage: EventShopCoverageState = { status: "noGoals" }
vi.mock("@/features/shops/event-planner/model/use-event-shop-coverage", () => ({
  useEventShopCoverage: () => coverage,
}))

let storedPlan: EventShopPlan = plan([])
let planState: "ready" | "error" = "ready"
const mutateAsync = vi.fn((request: { entries: EventShopPlan["entries"] }) =>
  Promise.resolve(plan(request.entries, 2))
)
const refetchPlan = vi.fn()
vi.mock("@/entities/event-shop", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/event-shop")>()),
  useEventShopPlan: () =>
    planState === "error"
      ? { data: undefined, isError: true, refetch: refetchPlan }
      : { data: storedPlan, isError: false, refetch: refetchPlan },
  useSaveEventShopPlan: () => ({ mutateAsync }),
}))

function LocationProbe() {
  const location = useLocation()
  return (
    <span data-testid="location">
      {location.pathname}
      {location.search}
    </span>
  )
}

function renderPage(path: string) {
  const context: DailiesOutletContext = {
    projects: [],
    projectId: undefined,
    setProjectId: vi.fn(),
    projectsUnavailable: true,
    projectsError: false,
    retryProjects: vi.fn(),
  }
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          element={
            <>
              <Outlet context={context} />
              <LocationProbe />
            </>
          }
          path="/dailies"
        >
          <Route element={<EventShopPage />} path="event-shop" />
          <Route element={<EventShopPage />} path="event-shop/:eventId" />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

const location = () => screen.getByTestId("location").textContent

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW })
  setViewportWidth(1280)
  events = [endedEvent, runningEvent, upcomingEvent]
  roster = synced
  coverage = { status: "noGoals" }
  storedPlan = plan([])
  planState = "ready"
  mutateAsync.mockClear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("routes and page states", () => {
  it("opens the running event by default", async () => {
    renderPage("/dailies/event-shop")
    await waitFor(() =>
      expect(location()).toBe("/dailies/event-shop/october-2026")
    )
    expect(screen.queryByTestId("event-shop-not-found")).toBeNull()
  })

  it("redirects an unknown event to the default one with a notice", async () => {
    renderPage("/dailies/event-shop/may-2025")
    await waitFor(() =>
      expect(location()).toBe("/dailies/event-shop/october-2026")
    )
    expect(screen.getByTestId("event-shop-not-found")).toHaveTextContent(
      "states.notFound"
    )
  })

  it("shows the empty state without events and no picker", () => {
    events = []
    renderPage("/dailies/event-shop")
    expect(screen.getByTestId("event-shop-empty")).toHaveTextContent(
      "states.empty"
    )
    expect(screen.queryByTestId("event-shop-picker")).toBeNull()
  })

  it("shows a skeleton while the catalog loads and a retry when it fails", async () => {
    events = "loading"
    const { unmount } = renderPage("/dailies/event-shop")
    expect(screen.getByTestId("event-shop-loading")).toBeInTheDocument()
    unmount()
    events = "error"
    renderPage("/dailies/event-shop")
    await userEvent.click(screen.getByRole("button", { name: "states.retry" }))
    expect(retryCatalog).toHaveBeenCalled()
  })

  it("keeps the slots but disables the cart when the plan fails to load", async () => {
    planState = "error"
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-plan-error")).toBeInTheDocument()
    expect(screen.getByTestId("event-shop-add-2")).toBeDisabled()
    await userEvent.click(
      within(screen.getByTestId("event-shop-plan-error")).getByRole("button")
    )
    expect(refetchPlan).toHaveBeenCalled()
  })

  it("opens an ended event on its last day with working controls", () => {
    vi.setSystemTime(Date.parse("2026-11-09T12:00:00Z"))
    events = [runningEvent]
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-status")).toHaveTextContent(
      "header.status.ended"
    )
    expect(screen.getByTestId("event-shop-day-13")).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByTestId("event-shop-add-2")).toBeEnabled()
  })
})

describe("header", () => {
  it("names the event, its status, sync time and the week's income", () => {
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-status")).toHaveTextContent(
      "header.status.running"
    )
    expect(screen.getByTestId("event-shop-income")).toHaveTextContent(
      '"free":"750","bonus":"1,000"'
    )
    expect(screen.getByTestId("event-shop-synced")).toHaveTextContent(
      "header.synced"
    )
  })

  it("says Not synced without player data", () => {
    roster = { lockContext: null, powerLevel: undefined, lastSyncedAt: null }
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-synced")).toHaveTextContent(
      "header.notSynced"
    )
  })

  it("formats the 00:00 UTC reset in the user's time zone", () => {
    expect(localResetTime(NOW, "en", "Europe/Prague")).toBe("01:00")
  })
})

describe("desktop", () => {
  it("shows the week calendar, slot cards and the side column on Shop", () => {
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-desktop")).toBeInTheDocument()
    expect(screen.getByTestId("event-shop-week-calendar")).toBeInTheDocument()
    expect(screen.getByTestId("event-shop-side-column")).toBeInTheDocument()
    expect(screen.getByTestId("event-shop-day-3")).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("resolves locks from the roster: tier and unit progress", () => {
    renderPage("/dailies/event-shop/october-2026")
    const orbs = screen.getByTestId("event-shop-slot-1")
    expect(orbs).toHaveTextContent("slot.tier")
    expect(orbs).toHaveTextContent('"qty":"5"')
    const shards = screen.getByTestId("event-shop-slot-0")
    expect(shards).toHaveTextContent("slot.thenMythic")
  })

  it("lists every option and the sync notice without player data", () => {
    roster = { lockContext: null, powerLevel: undefined, lastSyncedAt: null }
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-unsynced")).toBeInTheDocument()
    const orbs = screen.getByTestId("event-shop-slot-1")
    expect(orbs).toHaveTextContent("slot.dependsOnTier")
    expect(
      within(orbs).getAllByRole("button", { name: "slot.add" })
    ).toHaveLength(3)
  })

  it("adds an offer at the day's max and marks it bought with one tick", async () => {
    renderPage("/dailies/event-shop/october-2026")
    await userEvent.click(screen.getByTestId("event-shop-add-2"))
    const card = screen.getByTestId("event-shop-slot-2")
    expect(card).toHaveAttribute("data-in-cart", "true")
    // Adding plans the cap (2); the price line carries the planned total.
    expect(screen.getByTestId("event-shop-planned-2")).toHaveTextContent("2/2")
    expect(within(card).getByRole("slider")).toHaveAttribute(
      "aria-valuenow",
      "2"
    )
    expect(card).toHaveTextContent('slot.packsTotal:{"count":2}')
    // The packs slider is announced by name.
    expect(
      within(card).getByRole("slider", { name: "slot.quantity" })
    ).toBeInTheDocument()
    expect(
      within(card).queryByRole("button", { name: "slot.increase" })
    ).toBeNull()

    const tick = screen.getByTestId("event-shop-mark-bought-2")
    await userEvent.click(tick)
    expect(tick).toHaveAttribute("aria-pressed", "true")
    expect(card).toHaveAttribute("data-purchase", "bought")
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    expect(mutateAsync).toHaveBeenLastCalledWith({
      expectedRevision: 1,
      entries: [cartEntry("THU", 2, "abilityTokenUncommon_Imperial", 2, 2)],
    })
  })

  it("plans fewer with the card's slider", async () => {
    storedPlan = plan([cartEntry("THU", 0, "shards_astraYarrick", 5)])
    renderPage("/dailies/event-shop/october-2026")
    const card = screen.getByTestId("event-shop-slot-0")
    const slider = within(card).getByRole("slider")
    slider.focus()
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(slider).toHaveAttribute("aria-valuenow", "3")
    expect(screen.getByTestId("event-shop-planned-0")).toHaveTextContent("3/5")
  })

  it("removes a card's plan with its remove button, no menu", async () => {
    storedPlan = plan([cartEntry("THU", 2, "abilityTokenUncommon_Imperial", 2)])
    renderPage("/dailies/event-shop/october-2026")
    const card = screen.getByTestId("event-shop-slot-2")
    expect(within(card).queryByRole("button", { name: "slot.more" })).toBeNull()
    await userEvent.click(screen.getByTestId("event-shop-remove-2"))
    expect(card).toHaveAttribute("data-in-cart", "false")
  })

  it("asks for an alliance before adding a draft reward", async () => {
    renderPage("/dailies/event-shop/october-2026")
    await userEvent.click(screen.getByTestId("event-shop-add-3"))
    await userEvent.click(screen.getByTestId("event-shop-alliance-xenos"))
    expect(screen.getByTestId("event-shop-slot-3")).toHaveTextContent(
      'slot.alliance:{"alliance":"alliances.xenos"}'
    )
  })

  it("replaces a slot's plan with a draft reward only once an alliance is chosen", async () => {
    // Slot 1 also sells a draft reward, so it can replace the planned orb.
    const week = runningEvent.weeks[0]!
    const orbs = week.slots[1]!
    const withDraft: GameCatalogEventShop = {
      ...runningEvent,
      weeks: [
        {
          ...week,
          slots: week.slots.map((slot, index) =>
            index === 1
              ? {
                  variants: [
                    ...orbs.variants,
                    { ...week.slots[3]!.variants[0]!, lockId: undefined },
                  ],
                }
              : slot
          ),
        },
        runningEvent.weeks[1]!,
      ],
    }
    events = [withDraft]
    roster = { lockContext: null, powerLevel: undefined, lastSyncedAt: null }
    const orb = cartEntry("THU", 1, "heroAscensionOrbLegendary_Imperial", 3)
    storedPlan = plan([orb])
    renderPage("/dailies/event-shop/october-2026")
    const draftAdd = () =>
      within(screen.getByTestId("event-shop-slot-1"))
        .getAllByRole("button", { name: "slot.add" })
        .at(-1)!

    await userEvent.click(draftAdd())
    await userEvent.click(screen.getByTestId("confirmation-dialog-confirm"))
    await userEvent.click(
      within(screen.getByTestId("event-shop-alliance-dialog")).getByRole(
        "button",
        { name: "dialogs.cancel" }
      )
    )
    // The orb is still planned (3 of 3) and nothing was saved.
    expect(screen.getByTestId("event-shop-planned-1")).toHaveTextContent("3/3")
    expect(mutateAsync).not.toHaveBeenCalled()

    await userEvent.click(draftAdd())
    await userEvent.click(screen.getByTestId("confirmation-dialog-confirm"))
    await userEvent.click(screen.getByTestId("event-shop-alliance-xenos"))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenLastCalledWith({
        expectedRevision: 1,
        entries: [
          {
            ...cartEntry("THU", 1, "draft_ascensionOrbsEpic", 2),
            draftAlliance: "xenos",
          },
        ],
      })
    )
    expect(mutateAsync).toHaveBeenCalledTimes(1)
  })

  it("keeps the day in the URL and hides the calendar on Milestones", async () => {
    renderPage("/dailies/event-shop/october-2026?day=8")
    expect(screen.getByTestId("event-shop-day-8")).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    await userEvent.click(screen.getByTestId("event-shop-day-9"))
    expect(location()).toContain("day=9")
    await userEvent.click(screen.getByTestId("event-shop-tab-milestones"))
    expect(location()).toContain("tab=milestones")
    expect(screen.queryByTestId("event-shop-week-calendar")).toBeNull()
    expect(screen.getByTestId("event-shop-milestones")).toBeInTheDocument()
  })

  it("shows daily missions in game text and each chain as one card (Mi1)", async () => {
    renderPage("/dailies/event-shop/october-2026?tab=missions")
    const daily = screen.getByTestId("event-shop-daily-missions")
    expect(daily).toHaveTextContent("Traverse 150 hexes with your characters")
    expect(daily).toHaveTextContent('rewards.dailyLabel:{"count":1}')
    expect(daily).toHaveTextContent("rewards.aDay")
    const chain = screen.getByTestId("event-shop-chain-october_2026_free_1")
    expect(chain).toHaveTextContent(
      'rewards.chainLabel:{"kind":"rewards.free","count":1}'
    )
    expect(chain).toHaveTextContent(
      'rewards.step:{"position":1,"target":"7,500"}'
    )
    expect(chain).toHaveTextContent("rewards.each")
  })

  it("switches the week of the rewards tabs with their own week picker", async () => {
    renderPage("/dailies/event-shop/october-2026?tab=missions")
    await userEvent.click(screen.getByTestId("event-shop-rewards-week"))
    await userEvent.click(
      await screen.findByRole("option", { name: 'days.week:{"week":2}' })
    )
    expect(location()).toContain("day=7")
    expect(screen.getByTestId("event-shop-daily-missions")).toHaveTextContent(
      "rewards.none"
    )
  })

  it("shows every milestone as a tile (M2)", () => {
    renderPage("/dailies/event-shop/october-2026?tab=milestones")
    const ladder = screen.getByTestId("event-shop-milestone-ladder")
    expect(within(ladder).getAllByRole("listitem")).toHaveLength(7)
    // Every tier pays gold in a +10% range: noted once, not on each tile.
    expect(ladder).toHaveTextContent(
      'rewards.rollsUp:{"reward":"shops:reward.gold","percent":10}'
    )
  })

  it("maps a phone-only tab to its nearest desktop tab", () => {
    renderPage("/dailies/event-shop/october-2026?tab=rewards")
    expect(screen.getByTestId("event-shop-milestones")).toBeInTheDocument()
  })
})

describe("needs review and the ended event", () => {
  // Six past, unbought entries on slots sold on Mon and Tue.
  const reviewPlan = () =>
    plan(
      (["MON", "TUE"] as const).flatMap((day) => [
        cartEntry(day, 1, "heroAscensionOrbMythic_Imperial", 1),
        cartEntry(day, 2, "abilityTokenUncommon_Imperial", 1),
        cartEntry(day, 3, "draft_ascensionOrbsEpic", 1),
      ])
    )

  it("marks every review entry missed at once and lists five before Show all", async () => {
    storedPlan = reviewPlan()
    renderPage("/dailies/event-shop/october-2026")
    const group = screen.getByTestId("event-shop-needs-review")
    expect(group).toHaveTextContent('list.needsReviewCount:{"count":6}')
    expect(
      within(group).getAllByTestId(/^event-shop-row-\d+-\d+$/)
    ).toHaveLength(5)
    await userEvent.click(screen.getByTestId("event-shop-review-show-all"))
    expect(
      within(group).getAllByTestId(/^event-shop-row-\d+-\d+$/)
    ).toHaveLength(6)

    await userEvent.click(screen.getByTestId("event-shop-miss-all"))
    expect(screen.queryByTestId("event-shop-needs-review")).toBeNull()
  })

  it("replaces Coverage and the phone bar once the event has ended", () => {
    vi.setSystemTime(Date.parse("2026-11-20T12:00:00Z"))
    setViewportWidth(390)
    renderPage("/dailies/event-shop/october-2026?tab=plan")
    expect(screen.getByTestId("event-shop-coverage-ended")).toBeInTheDocument()
  })

  it("hides the phone bar on an ended event with nothing to review", () => {
    vi.setSystemTime(Date.parse("2026-11-20T12:00:00Z"))
    setViewportWidth(390)
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.queryByTestId("event-shop-still-to-buy-bar")).toBeNull()
  })
})

describe("daily freebie", () => {
  it("shows the freebie as free event currency ×5, without letting it into the cart", () => {
    renderPage("/dailies/event-shop/october-2026")
    const card = screen.getByTestId("event-shop-slot-4")
    expect(card).toHaveTextContent('slot.pack:{"qty":"5"}')
    expect(card).not.toHaveTextContent('slot.pack:{"qty":"1"}')
    expect(screen.getByTestId("event-shop-freebie-4")).toHaveTextContent(
      "slot.freebieShort"
    )
    expect(screen.queryByTestId("event-shop-add-4")).toBeNull()
    expect(screen.getByTestId("event-shop-slot-4")).toHaveTextContent(
      "slot.claimInGame"
    )
  })

  it("opens the freebie's sheet on phone without an Add button", async () => {
    setViewportWidth(390)
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-tile-4")).toHaveTextContent(
      "slot.freebieShort"
    )
    await userEvent.click(
      within(screen.getByTestId("event-shop-tile-4")).getAllByRole("button")[0]!
    )
    const sheet = await screen.findByTestId("event-shop-slot-sheet")
    expect(
      within(sheet).getByTestId("event-shop-sheet-freebie")
    ).toBeInTheDocument()
    expect(within(sheet).queryByTestId("event-shop-sheet-add-4")).toBeNull()
    // Sold every day, so no "Also …" line; and its gold never counts as a gold offer elsewhere.
    expect(within(sheet).queryByTestId("event-shop-sheet-also")).toBeNull()
  })
})

describe("shop search", () => {
  it("finds a unit's shards as you type and opens a day", async () => {
    renderPage("/dailies/event-shop/october-2026")
    await userEvent.type(screen.getByTestId("event-shop-search-input"), "yarr")
    const results = await screen.findByTestId("event-shop-search-results")
    const days = within(results).getAllByRole("button")
    expect(days.length).toBeGreaterThanOrEqual(3)
    await userEvent.click(
      within(results).getByTestId("event-shop-search-day-shards_astraYarrick-0")
    )
    expect(location()).toContain("day=0")
    expect(location()).toContain("tab=shop")
  })

  it("searches every reward, not only units", async () => {
    renderPage("/dailies/event-shop/october-2026")
    await userEvent.type(screen.getByTestId("event-shop-search-input"), "orb")
    const results = await screen.findByTestId("event-shop-search-results")
    expect(
      within(results).getByTestId(
        "event-shop-search-day-heroAscensionOrbMythic_Imperial-3"
      )
    ).toBeInTheDocument()
  })

  it("says when nothing matches", async () => {
    renderPage("/dailies/event-shop/october-2026")
    await userEvent.type(screen.getByTestId("event-shop-search-input"), "zzzz")
    expect(
      await screen.findByTestId("event-shop-search-empty")
    ).toBeInTheDocument()
  })
})

describe("shopping list", () => {
  it("resolves Needs review in place and clears a week after confirming", async () => {
    storedPlan = plan([
      cartEntry("MON", 2, "abilityTokenUncommon_Imperial", 2, 1),
      cartEntry("TUE", 2, "abilityTokenUncommon_Imperial", 1, 0),
      cartEntry("FRI", 2, "abilityTokenUncommon_Imperial", 2, 0),
    ])
    renderPage("/dailies/event-shop/october-2026")
    const review = screen.getByTestId("event-shop-needs-review")
    expect(within(review).getAllByRole("listitem")).toHaveLength(2)
    await userEvent.click(screen.getByTestId("event-shop-missed-1-2"))
    expect(within(review).getAllByRole("listitem")).toHaveLength(1)

    await userEvent.click(screen.getByTestId("event-shop-clear-week-1"))
    expect(
      screen.getByTestId("event-shop-clear-week-summary")
    ).toHaveTextContent("dialogs.clearWeek.toBuy")
    await userEvent.click(screen.getByTestId("confirmation-dialog-confirm"))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenLastCalledWith({
        expectedRevision: 1,
        entries: [cartEntry("MON", 2, "abilityTokenUncommon_Imperial", 1, 1)],
      })
    )
  })

  it("marks all of today bought", async () => {
    storedPlan = plan([cartEntry("THU", 2, "abilityTokenUncommon_Imperial", 2)])
    renderPage("/dailies/event-shop/october-2026")
    await userEvent.click(screen.getByTestId("event-shop-all-today-bought"))
    expect(screen.queryByTestId("event-shop-today")).toBeNull()
    expect(screen.getByTestId("event-shop-done")).toBeInTheDocument()
  })

  it("says nothing is left after today, shows a review row's missed cost and marks past days in All", async () => {
    storedPlan = plan([
      cartEntry("MON", 2, "abilityTokenUncommon_Imperial", 2),
      cartEntry("THU", 2, "abilityTokenUncommon_Imperial", 2),
    ])
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-nothing-left")).toHaveTextContent(
      "list.nothingLeft"
    )
    expect(screen.getByTestId("event-shop-row-0-2")).toHaveTextContent(
      "list.missedCost"
    )

    await userEvent.click(screen.getByTestId("event-shop-view-all"))
    expect(screen.getByTestId("event-shop-all-day-0")).toHaveAttribute(
      "data-past",
      "true"
    )
    expect(screen.getByTestId("event-shop-all-day-3")).not.toHaveAttribute(
      "data-past"
    )
  })

  it("flags a row bought before its day and undoes it in place", async () => {
    storedPlan = plan([
      cartEntry("FRI", 2, "abilityTokenUncommon_Imperial", 2, 2),
    ])
    renderPage("/dailies/event-shop/october-2026")
    const note = screen.getByTestId("event-shop-bought-ahead-4-2")
    expect(note).toHaveTextContent("list.notOnSale")
    await userEvent.click(within(note).getByRole("button"))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenLastCalledWith({
        expectedRevision: 1,
        entries: [cartEntry("FRI", 2, "abilityTokenUncommon_Imperial", 2, 0)],
      })
    )
  })

  it("links an ended event's recap to All", async () => {
    vi.setSystemTime(Date.parse("2026-11-20T12:00:00Z"))
    storedPlan = plan([cartEntry("MON", 2, "abilityTokenUncommon_Imperial", 1)])
    renderPage("/dailies/event-shop/october-2026")
    await userEvent.click(screen.getByTestId("event-shop-ended-see-all"))
    expect(screen.getByTestId("event-shop-all")).toBeInTheDocument()
  })

  it("moves on to the new day at the 00:00 UTC reset while the page stays open", async () => {
    vi.useFakeTimers({
      toFake: ["Date", "setInterval", "clearInterval"],
      now: Date.parse("2026-10-29T23:59:30Z"),
    })
    storedPlan = plan([cartEntry("THU", 2, "abilityTokenUncommon_Imperial", 2)])
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-today")).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(screen.queryByTestId("event-shop-today")).toBeNull()
    expect(screen.getByTestId("event-shop-needs-review")).toBeInTheDocument()
  })

  it("points at the slots when the cart is empty", () => {
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-list-empty")).toBeInTheDocument()
  })
})

describe("coverage", () => {
  it("links to Goals without goals", () => {
    renderPage("/dailies/event-shop/october-2026")
    expect(
      screen.getByTestId("event-shop-coverage-no-goals")
    ).toHaveTextContent("coverage.noGoals")
  })

  it("shows need, planned, still needed, cost and the shortfall", () => {
    coverage = {
      status: "ready",
      xpPerBook: {},
      xpBookRarity: null,
      rows: [
        {
          resource: "badge:Imperial:Uncommon",
          group: "badges",
          rewardType: "abilityTokenUncommon_Imperial",
          need: 300,
          planned: 0,
          stillNeeded: 300,
          maxStillBuyable: 200,
          short: 100,
          estimate: { packs: 30, cost: 450 },
        },
      ],
    }
    renderPage("/dailies/event-shop/october-2026")
    const row = screen.getByTestId(
      "event-shop-coverage-badge:Imperial:Uncommon"
    )
    expect(row).toHaveTextContent('coverage.short:{"amount":"100"}')
    expect(row).toHaveTextContent('coverage.onlyLeft:{"amount":"200"}')
    expect(row).toHaveTextContent('coverage.cost:{"cost":"450"}')
  })
})

describe("tablet", () => {
  it("opens the shopping list in a drawer from the sticky button", async () => {
    setViewportWidth(900)
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-tablet")).toBeInTheDocument()
    expect(screen.queryByTestId("event-shop-side-column")).toBeNull()
    await userEvent.click(screen.getByTestId("event-shop-list-button"))
    expect(
      within(screen.getByTestId("event-shop-drawer")).getByTestId(
        "event-shop-shopping-list"
      )
    ).toBeInTheDocument()
  })
})

describe("phone", () => {
  beforeEach(() => setViewportWidth(390))

  it("shows day chips and tiles, and the tick marks a planned tile bought", async () => {
    storedPlan = plan([cartEntry("THU", 2, "abilityTokenUncommon_Imperial", 2)])
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-day-chips")).toBeInTheDocument()
    expect(screen.getByTestId("event-shop-selected-day")).toHaveTextContent(
      "days.selectedToday"
    )
    const tile = screen.getByTestId("event-shop-tile-2")
    const tick = screen.getByTestId("event-shop-tick-2")
    expect(tick).toHaveAttribute("aria-checked", "false")
    expect(tile).toHaveAttribute("data-purchase", "planned")
    await userEvent.click(tick)
    expect(tick).toHaveAttribute("aria-checked", "true")
    // The whole tile switches to the bought look and says so.
    expect(tile).toHaveAttribute("data-purchase", "bought")
    expect(screen.getByTestId("event-shop-tile-state-2")).toHaveTextContent(
      'slot.boughtState:{"count":2}'
    )
    await userEvent.click(tick)
    expect(tick).toHaveAttribute("aria-checked", "false")
    expect(tile).toHaveAttribute("data-purchase", "planned")
  })

  it("shows a partly bought tile as bought of planned", () => {
    storedPlan = plan([
      cartEntry("THU", 2, "abilityTokenUncommon_Imperial", 2, 1),
    ])
    renderPage("/dailies/event-shop/october-2026")
    expect(screen.getByTestId("event-shop-tile-2")).toHaveAttribute(
      "data-purchase",
      "partial"
    )
    expect(screen.getByTestId("event-shop-tile-state-2")).toHaveTextContent(
      'slot.bought:{"bought":1,"quantity":2}'
    )
  })

  it("adds from the sheet with the slider at the max, then the tile's tick marks it bought", async () => {
    renderPage("/dailies/event-shop/october-2026")
    await userEvent.click(
      within(screen.getByTestId("event-shop-tile-0")).getAllByRole("button")[0]!
    )
    const sheet = await screen.findByTestId("event-shop-slot-sheet")
    const slider = within(sheet).getByRole("slider")
    expect(slider).toHaveAttribute("aria-valuenow", "5")
    slider.focus()
    await userEvent.keyboard("{ArrowLeft}")
    await userEvent.click(within(sheet).getByTestId("event-shop-sheet-add-0"))

    await waitFor(() =>
      expect(screen.queryByTestId("event-shop-slot-sheet")).toBeNull()
    )
    expect(screen.getByTestId("event-shop-tile-0")).toHaveTextContent(
      'slot.planned:{"count":4}'
    )
    const tick = screen.getByTestId("event-shop-tick-0")
    await userEvent.click(tick)
    expect(tick).toHaveAttribute("aria-checked", "true")
  })

  it("opens the slot sheet with the other days it is sold", async () => {
    storedPlan = plan([cartEntry("THU", 0, "shards_astraYarrick", 2)])
    renderPage("/dailies/event-shop/october-2026")
    await userEvent.click(
      within(screen.getByTestId("event-shop-tile-0")).getAllByRole("button")[0]!
    )
    const sheet = await screen.findByTestId("event-shop-slot-sheet")
    expect(
      within(sheet).getByTestId("event-shop-sheet-also")
    ).toHaveTextContent("slot.also")
    expect(
      within(sheet).getByRole("button", { name: "slot.boughtAction" })
    ).toBeInTheDocument()
  })

  it("shows the Plan tab with the review badge and maps desktop tabs to Rewards", async () => {
    storedPlan = plan([cartEntry("MON", 2, "abilityTokenUncommon_Imperial", 1)])
    const { unmount } = renderPage("/dailies/event-shop/october-2026?tab=plan")
    expect(screen.getByTestId("event-shop-review-badge")).toHaveTextContent("1")
    expect(screen.getByTestId("event-shop-shopping-list")).toBeInTheDocument()
    expect(screen.queryByTestId("event-shop-day-chips")).toBeNull()
    unmount()
    renderPage("/dailies/event-shop/october-2026?tab=missions")
    // Rewards opens on Milestones; its switch shows Missions.
    expect(screen.getByTestId("event-shop-milestones")).toBeInTheDocument()
    await userEvent.click(screen.getByTestId("event-shop-rewards-missions"))
    expect(screen.getByTestId("event-shop-missions")).toBeInTheDocument()
  })

  it("opens Plan from the Still to buy bar", async () => {
    storedPlan = plan([cartEntry("FRI", 2, "abilityTokenUncommon_Imperial", 2)])
    renderPage("/dailies/event-shop/october-2026")
    await userEvent.click(screen.getByTestId("event-shop-still-to-buy-bar"))
    expect(location()).toContain("tab=plan")
  })
})

describe("tour", () => {
  it.each([
    [1280, "desktop", "event-shop-side-column"],
    [900, "desktop", "event-shop-list-button"],
    [390, "mobile", "event-shop-tab-plan"],
  ] as const)(
    "at %ipx every %s step targets a rendered control",
    (width, platform, listTarget) => {
      setViewportWidth(width)
      storedPlan = plan([
        cartEntry("THU", 2, "abilityTokenUncommon_Imperial", 2),
      ])
      renderPage("/dailies/event-shop/october-2026")
      const steps = (
        registeredTour.mock.lastCall?.[0] as Record<
          string,
          { target: string }[]
        >
      )[platform]!
      const targets = steps.map((step) => step.target)
      expect(targets).toContain(`[data-testid="${listTarget}"]`)
      for (const target of targets) {
        expect(document.querySelector(target), target).not.toBeNull()
      }
    }
  )

  it("targets the tick and the day chips on phone, not the side column", () => {
    setViewportWidth(390)
    storedPlan = plan([cartEntry("THU", 2, "abilityTokenUncommon_Imperial", 2)])
    renderPage("/dailies/event-shop/october-2026")
    const targets = (
      registeredTour.mock.lastCall?.[0] as { mobile: { target: string }[] }
    ).mobile.map((step) => step.target)
    expect(targets).toContain('[data-testid^="event-shop-tick-"]')
    expect(targets).toContain('[data-testid="event-shop-day-chips"]')
    expect(targets).not.toContain('[data-testid="event-shop-side-column"]')
  })
})
