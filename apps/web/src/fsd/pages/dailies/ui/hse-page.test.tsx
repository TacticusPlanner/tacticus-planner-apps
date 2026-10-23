import {
  Link,
  MemoryRouter,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { act, render, screen, within } from "@/test/render"
import { battle, offPlanBattle, ready } from "@/test/fixtures/daily-raids"
import { emptyRaidsFilters } from "@/features/daily-raids"
import type { HseTeamsRead } from "@/features/team-recommendations"
import { homeScreenEventReadyAt } from "@/test/fixtures/home-screen-event"
import { hseTeamsFixtureRead } from "@/test/fixtures/hse-teams"

import type { DailiesOutletContext } from "./dailies-layout"
import { HsePage } from "./hse-page"

const { mocks } = vi.hoisted(() => ({
  mocks: {
    isMobile: false,
    event: undefined as unknown,
    raids: undefined as unknown,
    locations: undefined as unknown,
    raidsArgs: [] as unknown[][],
    hseReads: {} as import("@/test/fixtures/hse-event-points").HseFixtureReads,
    teamsRead: undefined as HseTeamsRead | undefined,
  },
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, unknown>) =>
      values
        ? `${key}|${Object.entries(values)
            .map(([name, value]) => `${name}=${String(value)}`)
            .join(",")}`
        : key,
  }),
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mocks.isMobile,
}))
vi.mock("@/features/daily-raids/model/use-active-home-screen-event", () => ({
  useActiveHomeScreenEvent: () => mocks.event,
}))
vi.mock("@/features/daily-raids/model/use-daily-raids", () => ({
  useDailyRaids: (...args: unknown[]) => {
    mocks.raidsArgs.push(args)
    return mocks.raids
  },
}))
vi.mock("@/features/daily-raids/model/use-home-screen-event-locations", () => ({
  useHomeScreenEventLocations: () => mocks.locations,
}))
vi.mock(
  "@/features/home-screen-event-points/model/use-hse-projection",
  async () => {
    const { useFixtureHseProjection } =
      await import("@/test/fixtures/hse-event-points")
    return {
      useHseProjection: (
        instance: Parameters<typeof useFixtureHseProjection>[0]
      ) => useFixtureHseProjection(instance, mocks.hseReads),
    }
  }
)
vi.mock(
  "@/features/team-recommendations/model/use-hse-team-recommendations",
  async () => {
    const { fixtureHseTeams } = await import("@/test/fixtures/hse-teams")
    return {
      useHseTeamRecommendations: (
        ...[instance, points]: Parameters<typeof fixtureHseTeams>
      ) => fixtureHseTeams(instance, points, mocks.teamsRead),
    }
  }
)

const HOUR = 3_600_000
const DAY = 24 * HOUR
const entryOf = (
  definitionId: string,
  startMs: number,
  endMs: number,
  occurrenceId: string | null = null
) => ({
  occurrenceId,
  definitionId,
  startUtc: new Date(startMs).toISOString(),
  endUtc: new Date(endMs).toISOString(),
  parameters: null,
})
const readyAt = homeScreenEventReadyAt
const activeEvent = (definitionId = "hse-machine-hunt") =>
  readyAt([entryOf(definitionId, Date.now() - HOUR, Date.now() + 50 * HOUR)])

const location = (battleId: typeof battle, name: string) => ({
  id: battleId,
  campaignName: name,
  nodeLabel: "Elite 1",
  shortLabel: name,
  challenge: false,
})
const locationsByBattleId = new Map([
  [battle, location(battle, "Indomitus")],
  [offPlanBattle, location(offPlanBattle, "Death Guard")],
])
const top = (battleId: typeof battle, perRaid: number, cost: number) => ({
  battleId,
  pointsPerRaid: perRaid,
  pointsPerEnergy: perRaid / cost,
  energyCost: cost,
})
const readyLocations = (
  overrides: Partial<{
    overall: unknown[]
    eventCampaign: unknown[] | null
  }> = {}
) => ({
  status: "ready",
  overall: [top(battle, 12, 6), top(offPlanBattle, 6, 6)],
  eventCampaign: null,
  locationsByBattleId,
  resourceByBattleId: new Map([
    [
      battle,
      {
        label: "Adamantium",
        visual: {
          kind: "upgrade",
          id: "adamantium",
          rarity: "Epic",
          crafted: false,
        },
      },
    ],
    [
      offPlanBattle,
      {
        label: "Bellator shards",
        visual: { kind: "shard", unitId: "bellator" },
      },
    ],
  ]),
  ...overrides,
})

type Row = {
  battleId: typeof battle
  raids: number
  pointsPerRaid: number
  energyCost: number
  goalIds: string[]
}
const row = (
  battleId: typeof battle,
  raids: number,
  pointsPerRaid: number,
  energyCost: number,
  goalIds = ["g1"]
) => ({
  battleId,
  energyCost,
  pointsPerRaid,
  ratio: pointsPerRaid / energyCost,
  raids,
  points: raids * pointsPerRaid,
  energy: raids * energyCost,
  goalIds,
  resourceId: "U1" as never,
})
// B1 x3 raids at 12 points (18 energy), B2 x2 raids at 6 points (12 energy): 48 points, 30 energy.
const farmRows = (): ReturnType<typeof row>[] => [
  row(battle, 3, 12, 6),
  row(offPlanBattle, 2, 6, 6),
]
const withFarm = (
  rows: Row[] | ReturnType<typeof row>[],
  empty: string | null = null,
  overrides = {}
) => {
  const list = rows as ReturnType<typeof row>[]
  return ready({
    eventFarm: {
      rows: list,
      totalPoints: list.reduce((total, r) => total + r.points, 0),
      totalEnergy: list.reduce((total, r) => total + r.energy, 0),
      energyBudget: 100,
      empty: list.length > 0 ? null : empty,
    } as never,
    ...overrides,
  })
}

function LocationProbe() {
  const location = useLocation()
  return (
    <output data-testid="location">{`${location.pathname}${location.search}`}</output>
  )
}

function HsePageHarness({
  projectId,
  initialEntry = "/",
}: {
  projectId?: string
  initialEntry?: string
}) {
  const context: DailiesOutletContext = {
    projects: [],
    projectId,
    setProjectId: vi.fn(),
    projectsUnavailable: false,
    projectsError: false,
    retryProjects: vi.fn(),
  }
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      {/* Stand-in for the Dailies tab bar: plain links, as in section-tabs. */}
      <nav>
        <Link data-testid="hse-tab" to="/">
          HSE
        </Link>
        <Link data-testid="today-tab" to="/today">
          Today
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<Outlet context={context} />}>
          <Route index element={<HsePage />} />
          <Route path="today" element={<p data-testid="today-page" />} />
        </Route>
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  )
}

function renderHse(projectId?: string, initialEntry = "/") {
  return render(
    <HsePageHarness initialEntry={initialEntry} projectId={projectId} />
  )
}

beforeEach(() => {
  window.localStorage.clear()
  mocks.isMobile = false
  mocks.event = activeEvent()
  mocks.raids = withFarm(farmRows())
  mocks.locations = readyLocations()
  mocks.raidsArgs.length = 0
  mocks.hseReads = {}
  mocks.teamsRead = hseTeamsFixtureRead()
  act(() => {})
})

describe("HSE tab states", () => {
  it("shows the live event, its farm list with points and energy per location and the day totals", () => {
    renderHse()

    expect(screen.getByTestId("hse-status-active")).toHaveTextContent(
      "events:definitions.hse-machine-hunt"
    )
    expect(screen.getByTestId("hse-status-active")).toHaveTextContent(
      "dailies:hse.status.earnsPoints"
    )
    expect(screen.getByTestId(`hse-raid-${battle}`)).toHaveTextContent(
      "points=36"
    )
    expect(screen.getByTestId(`hse-raid-${battle}`)).toHaveTextContent(
      "energy=18"
    )
    expect(screen.getByTestId(`hse-raid-${offPlanBattle}`)).toHaveTextContent(
      "points=12"
    )
    expect(screen.getByTestId("hse-raids-total")).toHaveTextContent("points=48")
    expect(screen.getByTestId("hse-raids-energy")).toHaveTextContent(
      "energy=30"
    )
    expect(screen.getByTestId("hse-raids-note")).toHaveTextContent(
      "hse.raids.note"
    )
    expect(screen.getByTestId("hse-raids-note")).toHaveTextContent(
      "hse.raids.budget|energy=100"
    )
  })

  it("lists the farm rows in the order the plan gives them, with the drop icon", () => {
    renderHse()

    const rows = within(screen.getByTestId("hse-raids-list")).getAllByRole(
      "listitem"
    )
    expect(rows.map((item) => item.getAttribute("data-testid"))).toEqual([
      `hse-raid-${battle}`,
      `hse-raid-${offPlanBattle}`,
    ])
    expect(
      within(screen.getByTestId(`hse-raid-${battle}`)).getByRole("button", {
        name: "Ceramite",
      })
    ).toBeInTheDocument()
  })

  it("lists the overall top 10 and omits the event-campaign list without a campaign event", () => {
    renderHse()

    expect(screen.getByTestId("hse-top-overall-list").children).toHaveLength(2)
    expect(screen.queryByTestId("hse-top-event")).not.toBeInTheDocument()
  })

  it("shows the event-campaign list while a campaign event is active", () => {
    mocks.locations = readyLocations({
      eventCampaign: [top(offPlanBattle, 6, 6)],
    })
    renderHse()

    const eventList = screen.getByTestId("hse-top-event-list")
    expect(eventList.children).toHaveLength(1)
    expect(
      within(eventList).getByTestId(`hse-top-event-${offPlanBattle}`)
    ).toBeInTheDocument()
  })

  it("previews the next event: countdown status, a not-live banner and the lists", () => {
    mocks.event = readyAt([
      entryOf("hse-warp-surge", Date.now() + 30 * HOUR, Date.now() + 80 * HOUR),
    ])
    renderHse()

    const next = screen.getByTestId("hse-status-upcoming")
    expect(next).toHaveTextContent("events:definitions.hse-warp-surge")
    expect(next).toHaveTextContent("dailies:hse.status.startsIn")
    expect(next).toHaveTextContent("tomorrow")
    const banner = screen.getByTestId("hse-preview-banner")
    expect(banner).toHaveTextContent("dailies:hse.preview.title")
    expect(banner).toHaveTextContent("events:definitions.hse-warp-surge")
    expect(banner).toHaveTextContent("dailies:hse.preview.body")
    expect(screen.getByTestId("hse-raids")).toBeInTheDocument()
    expect(screen.getByTestId("hse-top-overall")).toBeInTheDocument()
    // The lists are computed for the upcoming event's rule.
    expect(mocks.raidsArgs.at(-1)).toEqual([
      undefined,
      { homeScreenEventId: "hse-warp-surge" },
    ])
  })

  it("shows no preview banner while the event is live", () => {
    renderHse()

    expect(screen.queryByTestId("hse-preview-banner")).not.toBeInTheDocument()
  })

  it("keeps the countdown only when the upcoming event has no raid-point rule", () => {
    mocks.event = readyAt([
      entryOf(
        "hse-faction-boost",
        Date.now() + 30 * HOUR,
        Date.now() + 80 * HOUR
      ),
    ])
    renderHse()

    expect(screen.getByTestId("hse-status-upcoming")).toBeInTheDocument()
    expect(screen.queryByTestId("hse-preview-banner")).toBeNull()
    expect(screen.queryByTestId("hse-raids")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-top-overall")).not.toBeInTheDocument()
  })

  it("says nothing is scheduled when no event is active or upcoming", () => {
    mocks.event = readyAt([])
    renderHse()

    expect(screen.getByTestId("hse-status-none")).toHaveTextContent(
      "dailies:hse.status.noneScheduled"
    )
    expect(screen.queryByTestId("hse-sections")).not.toBeInTheDocument()
    // The switcher stays, with no options.
    expect(screen.getByTestId("hse-event-select")).toBeDisabled()
    expect(screen.getByTestId("hse-event-previous")).toBeDisabled()
    expect(screen.getByTestId("hse-event-next")).toBeDisabled()
  })

  it("explains an active event without raid points and shows no lists", () => {
    mocks.event = activeEvent("hse-faction-boost")
    renderHse()

    expect(screen.getByTestId("hse-status-active")).toHaveTextContent(
      "dailies:hse.status.noRaidPoints"
    )
    expect(screen.queryByTestId("hse-raids")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-top-overall")).not.toBeInTheDocument()
  })

  it("shows an inline error when the calendar cannot be read", () => {
    mocks.event = { status: "error" }
    renderHse()

    expect(screen.getByTestId("hse-status-error")).toBeInTheDocument()
    expect(screen.getByTestId("hse-page")).toBeInTheDocument()
  })

  it("shows a loading state while the calendar loads", () => {
    mocks.event = { status: "loading" }
    renderHse()

    expect(screen.getByTestId("hse-status-loading")).toBeInTheDocument()
  })
})

describe("HSE tab header", () => {
  it("shows no project, Raids Filters or Planning Settings controls", () => {
    renderHse()

    expect(screen.queryByTestId("hse-project-select")).toBeNull()
    expect(screen.queryByTestId("raids-filters")).toBeNull()
    expect(screen.queryByTestId("hse-planning-settings")).toBeNull()
  })

  it("lists for every active goal, whatever project Today has selected", () => {
    renderHse("project-1")

    expect(mocks.raidsArgs.at(-1)).toEqual([
      undefined,
      { homeScreenEventId: "hse-machine-hunt" },
    ])
  })

  it("passes no project when none is selected (every active goal)", () => {
    renderHse()

    expect(mocks.raidsArgs.at(-1)?.[0]).toBeUndefined()
  })
})

describe("HSE farm list", () => {
  const goal = (id: string, priority: number) => ({
    goalId: id,
    priority,
    unitId: `unit-${id}` as never,
    unitType: "Character" as const,
    unitLabel: `Unit ${id}`,
    targetLabel: "Rank",
    goalKind: "Rank" as const,
  })

  it.each([
    ["no-goals", "hse.raids.empty.noGoals"],
    ["no-energy", "hse.raids.empty.noEnergy"],
    ["nothing-contributes", "hse.raids.empty.nothingContributes"],
    ["filtered", "hse.raids.empty.filtered"],
  ])(
    "explains an empty list (%s) and keeps the status line and top lists",
    (reason, text) => {
      mocks.raids = withFarm([], reason)
      renderHse()

      expect(screen.getByTestId(`hse-raids-empty-${reason}`)).toHaveTextContent(
        text
      )
      expect(screen.queryByTestId("hse-raids-list")).not.toBeInTheDocument()
      expect(screen.queryByTestId("hse-raids-total")).not.toBeInTheDocument()
      expect(screen.getByTestId("hse-status-active")).toBeInTheDocument()
      expect(screen.getByTestId("hse-top-overall-list")).toBeInTheDocument()
    }
  )

  it("shows the no-goals state when the project has no active goals, without hiding the top lists", () => {
    mocks.raids = { status: "no-goals" }
    renderHse()

    expect(screen.getByTestId("hse-raids-empty-no-goals")).toBeInTheDocument()
    expect(screen.getByTestId("hse-top-overall")).toBeInTheDocument()
  })

  it("shows the nothing-contributes state when there is nothing farmable", () => {
    mocks.raids = { status: "no-farmable" }
    renderHse()

    expect(
      screen.getByTestId("hse-raids-empty-nothing-contributes")
    ).toBeInTheDocument()
  })

  it("shows a row's goal icons, capped at four with a +N chip and a full accessible name", () => {
    const ids = ["g1", "g2", "g3", "g4", "g5", "g6"]
    mocks.raids = withFarm([row(battle, 1, 12, 6, ids)], null, {
      goalsById: new Map(ids.map((id, i) => [id, goal(id, i + 1)])),
    })
    renderHse()

    const group = screen.getByTestId(`hse-raid-${battle}-goals`)
    expect(within(group).getAllByRole("img")).toHaveLength(4)
    expect(
      screen.getByTestId(`hse-raid-${battle}-goals-more`)
    ).toHaveTextContent("count=2")
    const label = group.getAttribute("aria-label")!
    for (const id of ids) expect(label).toContain(`Unit ${id}`)
  })

  it("shows the drop's X/Y stock chip with an accessible label, and nothing without a goal target", () => {
    mocks.raids = withFarm(farmRows(), null, {
      resourceTotals: new Map([["U1", { owned: 265, target: 500 }]]),
    })
    renderHse()

    const stock = screen.getByTestId(`hse-raid-${battle}-stock`)
    expect(stock).toHaveTextContent("265/500")
    expect(stock).toHaveAccessibleName("schedule.progress|owned=265,target=500")
  })

  it("leaves the stock chip off a row whose drop has no goal target", () => {
    mocks.raids = withFarm(farmRows(), null, { resourceTotals: new Map() })
    renderHse()

    expect(screen.queryByTestId(`hse-raid-${battle}-stock`)).toBeNull()
  })

  it("shows both goals of a two-goal row without an overflow chip", () => {
    mocks.raids = withFarm([row(battle, 1, 12, 6, ["g1", "g2"])])
    renderHse()

    const group = screen.getByTestId(`hse-raid-${battle}-goals`)
    expect(within(group).getAllByRole("img")).toHaveLength(2)
    expect(
      screen.queryByTestId(`hse-raid-${battle}-goals-more`)
    ).not.toBeInTheDocument()
  })

  it("shows the node's reward icon on top-10 rows of both lists and nothing for gold-only nodes", () => {
    mocks.locations = readyLocations({
      overall: [top(battle, 12, 6), top("B3" as typeof battle, 6, 6)],
      eventCampaign: [top(offPlanBattle, 6, 6)],
    })
    renderHse()

    const overall = screen.getByTestId(`hse-top-overall-${battle}`)
    expect(
      within(overall).getByRole("button", { name: "Adamantium" })
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId(`hse-top-event-${offPlanBattle}`)).getByRole(
        "button",
        { name: "Bellator shards" }
      )
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId("hse-top-overall-B3")).queryByRole("button")
    ).not.toBeInTheDocument()
    // Top-10 rows carry no goal icons.
    expect(screen.queryByTestId(`hse-top-overall-${battle}-goals`)).toBeNull()
  })
})

describe("HSE tab layout", () => {
  const order = () =>
    ["hse-raids", "hse-top-overall", "hse-top-event"].map((testId) =>
      screen.getByTestId(testId)
    )

  it.each([false, true])(
    "keeps the farm list, overall top 10 and event-campaign top 10 in reading order (mobile: %s)",
    (isMobile) => {
      mocks.isMobile = isMobile
      mocks.locations = readyLocations({
        eventCampaign: [top(offPlanBattle, 6, 6)],
      })
      renderHse()

      const [raids, overall, event] = order()
      expect(
        raids!.compareDocumentPosition(overall!) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy()
      expect(
        overall!.compareDocumentPosition(event!) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy()
      // Desktop: the farm list sits beside a column holding both top-10 lists.
      expect(screen.getByTestId("hse-sections").className).toContain(
        "md:grid-cols-2"
      )
    }
  )
})

describe("HSE tab Raids Filters", () => {
  const applyFilter = () =>
    act(() => {
      window.localStorage.setItem(
        "raids-filters.v1",
        JSON.stringify({ ...emptyRaidsFilters, slots: [3] })
      )
      window.dispatchEvent(new StorageEvent("storage"))
    })
  it("shows no filtered-out notice (the list is filter-then-pick)", () => {
    renderHse()
    applyFilter()

    expect(
      screen.queryByTestId("raids-filters-filtered-out")
    ).not.toBeInTheDocument()
  })

  it("offers Reset in the filtered-empty farm list and clears the filter", async () => {
    const user = userEvent.setup()
    mocks.raids = withFarm([], "filtered")
    renderHse()
    applyFilter()

    expect(screen.getByTestId("hse-raids-empty-filtered")).toBeInTheDocument()
    await user.click(screen.getByTestId("hse-raids-reset"))

    expect(
      JSON.parse(window.localStorage.getItem("raids-filters.v1") ?? "{}")
    ).not.toMatchObject({ slots: [3] })
  })

  it("shows the filtered-empty message with Reset in each empty top-10 list", async () => {
    const user = userEvent.setup()
    mocks.locations = readyLocations({ overall: [], eventCampaign: [] })
    renderHse()
    applyFilter()

    for (const list of ["hse-top-overall", "hse-top-event"]) {
      expect(screen.getByTestId(`${list}-empty`)).toHaveTextContent(
        "hse.top.filteredEmpty"
      )
    }
    await user.click(screen.getAllByTestId("hse-top-overall-reset")[0]!)

    expect(screen.getByTestId("hse-top-overall-empty")).toHaveTextContent(
      "hse.top.empty"
    )
  })
})

describe("HSE instance switcher", () => {
  // Shaped like the calendar around 2026-10-17T12:48Z: Against the Tide just ended, Psyker Boost
  // starts in two days, Faction Focus and Operation Imperator start together a week later.
  const now = Date.now()
  const tide = entryOf(
    "hse-against-the-tide",
    now - 7 * DAY,
    now - 5 * HOUR,
    "occ-tide"
  )
  const hunt = entryOf(
    "hse-machine-hunt",
    now - 15 * DAY,
    now - 11 * DAY,
    "occ-hunt"
  )
  const psyker = entryOf(
    "hse-trait-boost-psyker",
    now + 2 * DAY,
    now + 6 * DAY,
    "occ-psyker"
  )
  const focus = entryOf(
    "hse-faction-focus",
    now + 9 * DAY,
    now + 15 * DAY,
    "occ-focus"
  )
  const imperator = entryOf(
    "hse-global-operation-imperator",
    now + 9 * DAY,
    now + 15 * DAY,
    "occ-imperator"
  )
  const warpPlaceholder = entryOf(
    "hse-warp-surge",
    now + 19 * DAY,
    now + 22 * DAY
  )
  const warpKey = `hse-warp-surge@${warpPlaceholder.startUtc}`
  const calendar = [hunt, tide, psyker, focus, imperator, warpPlaceholder]
  const location = () => screen.getByTestId("location").textContent

  const pick = async (
    user: ReturnType<typeof userEvent.setup>,
    key: string
  ) => {
    await user.click(screen.getByTestId("hse-event-select"))
    await user.click(screen.getByTestId(`hse-event-option-${key}`))
  }

  beforeEach(() => {
    mocks.event = readyAt(calendar, now)
  })

  it("defaults to the running event", () => {
    const running = entryOf(
      "hse-trait-boost-psyker",
      now - DAY,
      now + 2 * DAY,
      "occ-psyker"
    )
    mocks.event = readyAt([tide, running, focus], now)
    renderHse()

    expect(screen.getByTestId("hse-event-select")).toHaveTextContent(
      "events:definitions.hse-trait-boost-psyker"
    )
    expect(screen.getByTestId("hse-status-active")).toBeInTheDocument()
    expect(location()).toBe("/")
  })

  it("defaults to the next event with its countdown when none runs", () => {
    renderHse()

    expect(screen.getByTestId("hse-event-select")).toHaveTextContent(
      "events:definitions.hse-trait-boost-psyker"
    )
    expect(screen.getByTestId("hse-status-upcoming")).toHaveTextContent(
      "dailies:hse.status.startsIn"
    )
  })

  it("steps to the event after next with Next, a same start ordered by definition id", async () => {
    const user = userEvent.setup()
    renderHse()

    await user.click(screen.getByTestId("hse-event-next"))
    expect(location()).toBe("/?event=occ-focus")
    expect(screen.getByTestId("hse-status-upcoming")).toHaveTextContent(
      "events:definitions.hse-faction-focus"
    )

    await user.click(screen.getByTestId("hse-event-next"))
    expect(location()).toBe("/?event=occ-imperator")
    expect(screen.getByTestId("hse-status-upcoming")).toHaveTextContent(
      "events:definitions.hse-global-operation-imperator"
    )
  })

  it("lists overlapping running events under Running and opens either", async () => {
    const user = userEvent.setup()
    mocks.event = readyAt(calendar, now + 10 * DAY)
    renderHse()

    await user.click(screen.getByTestId("hse-event-select"))
    const running = screen.getByTestId("hse-event-group-running")
    expect(
      within(running)
        .getAllByRole("option")
        .map((option) => option.getAttribute("data-testid"))
    ).toEqual(["hse-event-option-occ-focus", "hse-event-option-occ-imperator"])
    await user.click(screen.getByTestId("hse-event-option-occ-imperator"))

    expect(location()).toBe("/?event=occ-imperator")
    expect(screen.getByTestId("hse-status-active")).toHaveTextContent(
      "events:definitions.hse-global-operation-imperator"
    )
  })

  it("opens a past event from the URL and keeps it across a reload", async () => {
    const user = userEvent.setup()
    const { unmount } = renderHse()

    await pick(user, "occ-tide")
    expect(location()).toBe("/?event=occ-tide")
    expect(screen.getByTestId("hse-status-past")).toHaveTextContent(
      "events:definitions.hse-against-the-tide"
    )

    unmount()
    renderHse(undefined, "/?event=occ-tide")
    expect(screen.getByTestId("hse-status-past")).toHaveTextContent(
      "events:definitions.hse-against-the-tide"
    )
    expect(screen.getByTestId("hse-event-select")).toHaveTextContent(
      "events:definitions.hse-against-the-tide"
    )
  })

  it("keys a projected placeholder by definition and start", async () => {
    const user = userEvent.setup()
    renderHse()

    await pick(user, warpKey)
    expect(location()).toBe(`/?event=${encodeURIComponent(warpKey)}`)
    expect(screen.getByTestId("hse-preview-banner")).toBeInTheDocument()
  })

  it("falls back to the default and drops a stale key from the URL", () => {
    renderHse(undefined, "/?event=occ-gone&keep=1")

    expect(screen.getByTestId("hse-event-select")).toHaveTextContent(
      "events:definitions.hse-trait-boost-psyker"
    )
    expect(location()).toBe("/?keep=1")
  })

  it("keeps the key while the calendar loads", () => {
    mocks.event = { status: "loading" }
    renderHse(undefined, "/?event=occ-tide")

    expect(location()).toBe("/?event=occ-tide")
  })

  it("clears the parameter when the default instance is picked", async () => {
    const user = userEvent.setup()
    renderHse(undefined, "/?event=occ-tide")

    await pick(user, "occ-psyker")
    expect(location()).toBe("/")
  })

  it("does not carry the selection to other tabs", async () => {
    const user = userEvent.setup()
    renderHse(undefined, "/?event=occ-tide")
    expect(screen.getByTestId("hse-status-past")).toBeInTheDocument()

    // Leave for another Dailies tab, then come back from the tab bar.
    await user.click(screen.getByTestId("today-tab"))
    expect(location()).toBe("/today")
    await user.click(screen.getByTestId("hse-tab"))
    expect(location()).toBe("/")
    expect(screen.getByTestId("hse-status-upcoming")).toHaveTextContent(
      "events:definitions.hse-trait-boost-psyker"
    )
  })

  it("keeps a pinned instance when it ends; only its status changes", () => {
    const running = entryOf(
      "hse-machine-hunt",
      now - DAY,
      now + HOUR,
      "occ-running-hunt"
    )
    mocks.event = readyAt([running, psyker], now)
    const { rerender } = renderHse(undefined, "/?event=occ-running-hunt")
    expect(screen.getByTestId("hse-status-active")).toBeInTheDocument()

    mocks.event = readyAt([running, psyker], now + 2 * HOUR)
    rerender(<HsePageHarness initialEntry="/?event=occ-running-hunt" />)

    expect(location()).toBe("/?event=occ-running-hunt")
    expect(screen.getByTestId("hse-status-past")).toHaveTextContent(
      "events:definitions.hse-machine-hunt"
    )
  })

  it("sits on the title row at desktop width and on its own full-width row on mobile", () => {
    renderHse()

    const row = screen.getByTestId("hse-title-row")
    const switcher = screen.getByTestId("hse-event-switcher")
    expect(row).toContainElement(switcher)
    expect(row).toContainElement(screen.getByRole("heading", { level: 1 }))
    // Mobile: full width, so it wraps below the title; desktop: inline, pushed right.
    expect(switcher.className).toContain("w-full")
    expect(switcher.className).toContain("md:w-auto")
    expect(row.className).toContain("flex-wrap")
  })
})

describe("HSE selected instance states", () => {
  const now = Date.now()
  const runningHunt = entryOf(
    "hse-machine-hunt",
    now - DAY,
    now + 2 * DAY,
    "occ-running-hunt"
  )
  const pastHunt = entryOf(
    "hse-machine-hunt",
    now - 15 * DAY,
    now - 11 * DAY,
    "occ-past-hunt"
  )
  const warp = entryOf(
    "hse-warp-surge",
    now + 19 * DAY,
    now + 22 * DAY,
    "occ-warp"
  )
  const boost = entryOf(
    "hse-faction-boost",
    now + 30 * HOUR,
    now + 3 * DAY,
    "occ-boost"
  )

  it("shows a past rule-bearing event without lists or banner", () => {
    mocks.event = readyAt([pastHunt, runningHunt], now)
    renderHse(undefined, "/?event=occ-past-hunt")

    const status = screen.getByTestId("hse-status-past")
    expect(status).toHaveTextContent("events:definitions.hse-machine-hunt")
    expect(status).toHaveTextContent("dailies:hse.status.endedOn")
    expect(screen.queryByTestId("hse-raids")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-top-overall")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-preview-banner")).not.toBeInTheDocument()
  })

  it("says nothing is scheduled with only past instances, keeping the switcher", async () => {
    const user = userEvent.setup()
    mocks.event = readyAt([pastHunt], now)
    renderHse()

    expect(screen.getByTestId("hse-status-none")).toHaveTextContent(
      "dailies:hse.status.noneScheduled"
    )
    await user.click(screen.getByTestId("hse-event-select"))
    expect(
      within(screen.getByTestId("hse-event-group-past")).getAllByRole("option")
    ).toHaveLength(1)
  })

  it("previews a later event the player selects while one runs, and returns to the live lists", async () => {
    const user = userEvent.setup()
    mocks.event = readyAt([runningHunt, warp], now)
    renderHse()

    await user.click(screen.getByTestId("hse-event-next"))
    expect(screen.getByTestId("hse-preview-banner")).toHaveTextContent(
      "events:definitions.hse-warp-surge"
    )
    expect(mocks.raidsArgs.at(-1)).toEqual([
      undefined,
      { homeScreenEventId: "hse-warp-surge" },
    ])

    await user.click(screen.getByTestId("hse-event-previous"))
    expect(location()).toBe("/")
    expect(screen.queryByTestId("hse-preview-banner")).not.toBeInTheDocument()
    expect(mocks.raidsArgs.at(-1)).toEqual([
      undefined,
      { homeScreenEventId: "hse-machine-hunt" },
    ])
  })

  it("keeps the default rule-less next event to its countdown, and previews a later rule-bearing one when selected", async () => {
    const user = userEvent.setup()
    mocks.event = readyAt([boost, warp], now)
    renderHse()

    expect(screen.getByTestId("hse-status-upcoming")).toHaveTextContent(
      "events:definitions.hse-faction-boost"
    )
    expect(screen.queryByTestId("hse-raids")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-preview-banner")).not.toBeInTheDocument()

    await user.click(screen.getByTestId("hse-event-next"))
    expect(screen.getByTestId("hse-preview-banner")).toBeInTheDocument()
    expect(screen.getByTestId("hse-raids")).toBeInTheDocument()
  })

  function location() {
    return screen.getByTestId("location").textContent
  }
})

describe("HSE event details and projection", () => {
  const now = Date.now()
  const below = (first: HTMLElement, second: HTMLElement) =>
    Boolean(
      first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
    )

  it("previews the next event without a rule: name, start, countdown, details and projection, no lists or controls", () => {
    mocks.event = readyAt(
      [entryOf("hse-trait-boost-psyker", now + 43 * HOUR, now + 139 * HOUR)],
      now
    )
    renderHse()

    const status = screen.getByTestId("hse-status-upcoming")
    expect(status).toHaveTextContent("hse-trait-boost-psyker")
    expect(status).toHaveTextContent("hse.status.startsIn")
    expect(screen.getByTestId("hse-event-details")).toBeInTheDocument()
    expect(screen.getByTestId("hse-milestones")).toBeInTheDocument()
    expect(screen.getByTestId("hse-projection")).toBeInTheDocument()
    // Upcoming: no progress inputs, tokens assume full buckets.
    expect(
      screen.queryByTestId("hse-projection-milestones-done-input")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("hse-projection-note-sync")).toHaveTextContent(
      "hse.projection.notes.upcoming"
    )
    expect(screen.queryByTestId("hse-raids")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-top-overall")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-preview-banner")).not.toBeInTheDocument()
  })

  it("shows an active event without raid points with its details and projection, and no raid lists", () => {
    mocks.event = readyAt(
      [entryOf("hse-trait-boost-psyker", now - 2 * DAY, now + 2 * DAY)],
      now
    )
    renderHse()

    expect(screen.getByTestId("hse-status-active")).toHaveTextContent(
      "hse.status.noRaidPoints"
    )
    expect(screen.getByTestId("hse-event-details")).toBeInTheDocument()
    expect(screen.getByTestId("hse-projection")).toBeInTheDocument()
    expect(
      screen.getByTestId("hse-projection-milestones-done-input")
    ).toBeInTheDocument()
    expect(screen.queryByTestId("hse-raids")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-top-lists")).not.toBeInTheDocument()
  })

  it("keeps a past event's details, without the projection or lists", () => {
    mocks.event = readyAt(
      [
        entryOf("hse-machine-hunt", now - 15 * DAY, now - 11 * DAY, "occ-past"),
        entryOf("hse-machine-hunt", now - DAY, now + DAY, "occ-now"),
      ],
      now
    )
    renderHse(undefined, "/?event=occ-past")

    expect(screen.getByTestId("hse-status-past")).toBeInTheDocument()
    expect(
      screen.getByTestId("hse-event-details-description")
    ).toBeInTheDocument()
    expect(screen.getByTestId("hse-milestones")).toBeInTheDocument()
    expect(screen.queryByTestId("hse-projection")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-raids")).not.toBeInTheDocument()
  })

  it("shows no details when nothing is scheduled or the calendar fails", () => {
    mocks.event = readyAt([], now)
    const { unmount } = renderHse()
    expect(screen.getByTestId("hse-status-none")).toBeInTheDocument()
    expect(screen.queryByTestId("hse-event-details")).not.toBeInTheDocument()
    unmount()

    mocks.event = { status: "error" }
    renderHse()
    expect(screen.getByTestId("hse-status-error")).toBeInTheDocument()
    expect(screen.queryByTestId("hse-event-details")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-projection")).not.toBeInTheDocument()
  })

  it("says milestone data is not available for Against the Tide", () => {
    mocks.event = readyAt(
      [entryOf("hse-against-the-tide", now - DAY, now + DAY)],
      now
    )
    renderHse()

    expect(screen.getByTestId("hse-event-details-no-data")).toHaveTextContent(
      "hse.details.noData"
    )
    expect(screen.queryByTestId("hse-projection")).not.toBeInTheDocument()
  })

  it("labels a Global event as a community event, without a projection", () => {
    mocks.event = readyAt(
      [entryOf("hse-global-operation-imperator", now - DAY, now + DAY)],
      now
    )
    renderHse()

    expect(screen.getByTestId("hse-event-details-global")).toBeInTheDocument()
    expect(screen.getAllByTestId("hse-milestone")).toHaveLength(5)
    expect(
      screen.queryByTestId("hse-event-details-tier")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-projection")).not.toBeInTheDocument()
  })

  it("shows a guild event's details and no projection (Arsenal of War)", () => {
    mocks.event = readyAt(
      [entryOf("hse-arsenal-of-war", now - DAY, now + DAY)],
      now
    )
    renderHse()

    expect(
      screen.getByTestId("hse-event-details-description")
    ).toBeInTheDocument()
    expect(screen.queryByTestId("hse-projection")).not.toBeInTheDocument()
  })

  it("keeps the details and the raid lists when the player data cannot be read", () => {
    mocks.event = activeEvent("hse-warp-surge")
    mocks.hseReads = { player: () => ({ status: "error" }) }
    renderHse()

    expect(screen.getByTestId("hse-event-details")).toBeInTheDocument()
    expect(screen.getByTestId("hse-projection-error")).toBeInTheDocument()
    expect(screen.getByTestId("hse-raids")).toBeInTheDocument()
  })

  it("shows a loading state while the event data loads", () => {
    mocks.event = activeEvent("hse-warp-surge")
    mocks.hseReads = { player: () => undefined }
    renderHse()

    expect(screen.getByTestId("hse-event-details")).toBeInTheDocument()
    expect(screen.getByTestId("hse-projection-loading")).toBeInTheDocument()
  })

  it.each([false, true])(
    "orders Warp Surge's status, details, projection, farm list and top 10 (mobile: %s)",
    (isMobile) => {
      mocks.isMobile = isMobile
      mocks.event = activeEvent("hse-warp-surge")
      renderHse()

      const sections = [
        "hse-status",
        "hse-event-details",
        "hse-projection",
        "hse-raids",
        "hse-top-overall",
      ].map((testId) => screen.getByTestId(testId))
      for (let index = 1; index < sections.length; index++)
        expect(below(sections[index - 1]!, sections[index]!)).toBe(true)
      // Desktop: details and projection share a row above the raid lists.
      expect(screen.getByTestId("hse-event-row").className).toContain(
        "md:grid-cols-2"
      )
      // Arena only, with the campaign hint pointing at the farm list below.
      expect(
        screen.getByTestId("hse-projection-mode-Arena")
      ).toBeInTheDocument()
      expect(
        screen.queryByTestId("hse-projection-mode-Onslaught")
      ).not.toBeInTheDocument()
      expect(
        screen.getByTestId("hse-projection-note-campaign")
      ).toBeInTheDocument()
      expect(
        screen.queryByTestId(
          isMobile ? "hse-projection-table" : "hse-projection-rows"
        )
      ).not.toBeInTheDocument()
    }
  )

  it("does not re-render the farm list when a projection input changes", async () => {
    mocks.event = activeEvent("hse-warp-surge")
    renderHse()
    const input = screen.getByTestId("hse-projection-milestones-done-input")
    const farmRenders = mocks.raidsArgs.length
    await userEvent.type(input, "1")
    expect(input).toHaveValue(1)
    expect(mocks.raidsArgs).toHaveLength(farmRenders)
  })

  it("lets the details span the row when there is no projection", () => {
    mocks.event = readyAt(
      [entryOf("hse-global-operation-imperator", now - DAY, now + DAY)],
      now
    )
    renderHse()

    expect(screen.getByTestId("hse-event-row").className).not.toContain(
      "md:grid-cols-2"
    )
  })
})

describe("HSE event teams", () => {
  const now = Date.now()
  const below = (first: HTMLElement, second: HTMLElement) =>
    Boolean(
      first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
    )

  it("shows Psyker Boost's seven teams below the projection", () => {
    mocks.event = readyAt(
      [entryOf("hse-trait-boost-psyker", now + 43 * HOUR, now + 139 * HOUR)],
      now
    )
    renderHse()

    const teams = screen.getByTestId("hse-teams")
    expect(teams).toHaveTextContent("hse.teams.title")
    expect(below(screen.getByTestId("hse-projection"), teams)).toBe(true)
    expect(within(teams).getByTestId("hse-team-arena")).toBeInTheDocument()
    for (const mode of ["onslaught", "salvagerun"]) {
      for (const alliance of ["imperial", "chaos"])
        expect(
          within(teams).getByTestId(`hse-team-${mode}-${alliance}`)
        ).toBeInTheDocument()
      expect(
        within(teams).getByTestId(`hse-team-${mode}-xenos-insufficient-track`)
      ).toBeInTheDocument()
    }
  })

  it("sits above the raid lists of a rule-bearing event", () => {
    mocks.event = readyAt(
      [entryOf("hse-machine-hunt", now - DAY, now + DAY)],
      now
    )
    renderHse()

    expect(
      below(screen.getByTestId("hse-teams"), screen.getByTestId("hse-sections"))
    ).toBe(true)
  })

  it("hides the section for a past event", () => {
    mocks.event = readyAt(
      [
        entryOf(
          "hse-trait-boost-flying",
          now - 15 * DAY,
          now - 11 * DAY,
          "occ-past"
        ),
        entryOf("hse-machine-hunt", now - DAY, now + DAY, "occ-now"),
      ],
      now
    )
    renderHse(undefined, "/?event=occ-past")

    expect(screen.getByTestId("hse-status-past")).toBeInTheDocument()
    expect(screen.queryByTestId("hse-teams")).not.toBeInTheDocument()
  })

  it("hides the section for a Global event", () => {
    mocks.event = readyAt(
      [entryOf("hse-global-operation-imperator", now - DAY, now + DAY)],
      now
    )
    renderHse()

    expect(screen.queryByTestId("hse-teams")).not.toBeInTheDocument()
  })

  it("shows the shared loading state while the roster loads, keeping the rest of the page", () => {
    mocks.teamsRead = undefined
    mocks.event = readyAt(
      [entryOf("hse-trait-boost-psyker", now - DAY, now + DAY)],
      now
    )
    renderHse()

    expect(screen.getByTestId("hse-teams-loading")).toBeInTheDocument()
    expect(screen.getByTestId("hse-projection")).toBeInTheDocument()
  })

  it("shows the shared error state when the roster cannot be read", () => {
    mocks.teamsRead = { status: "error" }
    mocks.event = readyAt(
      [entryOf("hse-trait-boost-psyker", now - DAY, now + DAY)],
      now
    )
    renderHse()

    expect(screen.getByTestId("hse-teams-error")).toBeInTheDocument()
    expect(screen.getByTestId("hse-event-details")).toBeInTheDocument()
  })

  it("switches modes with the segmented control on mobile", async () => {
    const user = userEvent.setup()
    mocks.isMobile = true
    mocks.event = readyAt(
      [entryOf("hse-trait-boost-psyker", now - DAY, now + DAY)],
      now
    )
    renderHse()

    expect(screen.getByTestId("hse-team-arena")).toBeInTheDocument()
    await user.click(screen.getByTestId("hse-teams-mode-option-salvagerun"))
    expect(screen.getByTestId("hse-team-salvagerun-imperial")).toBeVisible()
    expect(screen.queryByTestId("hse-team-arena")).not.toBeInTheDocument()
  })
})
