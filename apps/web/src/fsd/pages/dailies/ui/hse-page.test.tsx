import { MemoryRouter, Outlet, Route, Routes } from "react-router"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { act, render, screen, within } from "@/test/render"
import { battle, offPlanBattle, ready } from "@/test/fixtures/daily-raids"
import { emptyRaidsFilters } from "@/features/daily-raids"

import type { DailiesOutletContext } from "./dailies-layout"
import { HsePage } from "./hse-page"

const { mocks } = vi.hoisted(() => ({
  mocks: {
    isMobile: false,
    event: undefined as unknown,
    raids: undefined as unknown,
    locations: undefined as unknown,
    raidsArgs: [] as unknown[][],
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
vi.mock("@/entities/planning-setting", () => ({
  PlanningSettingsTrigger: ({
    onClick,
    testId,
  }: {
    onClick: () => void
    testId: string
  }) => <button data-testid={testId} onClick={onClick} type="button" />,
  PlanningSettingsDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="planning-settings-dialog" /> : null,
}))

const HOUR = 3_600_000
const entryOf = (definitionId: string, startMs: number, endMs: number) => ({
  definitionId,
  startUtc: new Date(startMs).toISOString(),
  endUtc: new Date(endMs).toISOString(),
})
const activeEvent = (definitionId = "hse-machine-hunt") => ({
  status: "ready",
  active: entryOf(definitionId, Date.now() - HOUR, Date.now() + 50 * HOUR),
  next: null,
  nowMs: Date.now(),
})

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

function renderHse(projectId?: string) {
  const context: DailiesOutletContext = {
    projects: [],
    projectId,
    setProjectId: vi.fn(),
    projectsUnavailable: false,
    projectsError: false,
    retryProjects: vi.fn(),
  }
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Outlet context={context} />}>
          <Route index element={<HsePage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  window.localStorage.clear()
  mocks.isMobile = false
  mocks.event = activeEvent()
  mocks.raids = withFarm(farmRows())
  mocks.locations = readyLocations()
  mocks.raidsArgs.length = 0
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
    expect(screen.getByTestId("raids-filters")).toBeInTheDocument()
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

  it("previews the next event: countdown status, a not-live banner, the lists and every control", () => {
    mocks.event = {
      status: "ready",
      active: null,
      next: entryOf(
        "hse-warp-surge",
        Date.now() + 30 * HOUR,
        Date.now() + 80 * HOUR
      ),
      nowMs: Date.now(),
    }
    renderHse()

    const next = screen.getByTestId("hse-status-next")
    expect(next).toHaveTextContent("events:definitions.hse-warp-surge")
    expect(next).toHaveTextContent("dailies:hse.status.startsIn")
    expect(next).toHaveTextContent("tomorrow")
    const banner = screen.getByTestId("hse-preview-banner")
    expect(banner).toHaveTextContent("dailies:hse.preview.title")
    expect(banner).toHaveTextContent("events:definitions.hse-warp-surge")
    expect(banner).toHaveTextContent("dailies:hse.preview.body")
    expect(screen.getByTestId("hse-raids")).toBeInTheDocument()
    expect(screen.getByTestId("hse-top-overall")).toBeInTheDocument()
    expect(screen.getByTestId("raids-filters")).toBeInTheDocument()
    expect(screen.getByTestId("hse-planning-settings")).toBeInTheDocument()
    expect(screen.getByTestId("hse-project-select")).toBeInTheDocument()
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
    mocks.event = {
      status: "ready",
      active: null,
      next: entryOf(
        "hse-faction-boost",
        Date.now() + 30 * HOUR,
        Date.now() + 80 * HOUR
      ),
      nowMs: Date.now(),
    }
    renderHse()

    expect(screen.getByTestId("hse-status-next")).toBeInTheDocument()
    expect(screen.queryByTestId("hse-preview-banner")).toBeNull()
    expect(screen.queryByTestId("hse-raids")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-top-overall")).not.toBeInTheDocument()
    expect(screen.queryByTestId("raids-filters")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-planning-settings")).toBeNull()
  })

  it("says nothing is scheduled when no event is active or upcoming", () => {
    mocks.event = { status: "ready", active: null, next: null, nowMs: 0 }
    renderHse()

    expect(screen.getByTestId("hse-status-none")).toHaveTextContent(
      "dailies:hse.status.noneScheduled"
    )
    expect(screen.queryByTestId("hse-sections")).not.toBeInTheDocument()
  })

  it("explains an active event without raid points and shows no lists or controls", () => {
    mocks.event = activeEvent("hse-faction-boost")
    renderHse()

    expect(screen.getByTestId("hse-status-active")).toHaveTextContent(
      "dailies:hse.status.noRaidPoints"
    )
    expect(screen.queryByTestId("hse-raids")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-top-overall")).not.toBeInTheDocument()
    expect(screen.queryByTestId("raids-filters")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hse-planning-settings")).toBeNull()
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
  it("passes the Dailies project selection to the farm list and the event id", () => {
    renderHse("project-1")

    expect(screen.getByTestId("hse-project-select")).toBeInTheDocument()
    expect(mocks.raidsArgs.at(-1)).toEqual([
      "project-1",
      { homeScreenEventId: "hse-machine-hunt" },
    ])
  })

  it("passes no project when none is selected (every active goal)", () => {
    renderHse()

    expect(mocks.raidsArgs.at(-1)?.[0]).toBeUndefined()
  })

  it("opens the planning settings dialog from the header trigger", async () => {
    const user = userEvent.setup()
    renderHse()

    expect(screen.queryByTestId("planning-settings-dialog")).toBeNull()
    await user.click(screen.getByTestId("hse-planning-settings"))

    expect(screen.getByTestId("planning-settings-dialog")).toBeInTheDocument()
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

  it("collapses the filters trigger to an icon on mobile", () => {
    mocks.isMobile = true
    renderHse()

    expect(screen.getByTestId("raids-filters")).not.toHaveTextContent(
      "raidsFilters.trigger"
    )
    expect(screen.getByTestId("raids-filters")).toHaveAttribute(
      "aria-label",
      "raidsFilters.trigger"
    )
  })
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
  it("shows no filtered-out notice (the list is filter-then-pick) and the shared badge", () => {
    renderHse()
    applyFilter()

    expect(
      screen.queryByTestId("raids-filters-filtered-out")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("raids-filters-badge")).toHaveTextContent("1")
  })

  it("offers Reset in the filtered-empty farm list and clears the filter", async () => {
    const user = userEvent.setup()
    mocks.raids = withFarm([], "filtered")
    renderHse()
    applyFilter()

    expect(screen.getByTestId("hse-raids-empty-filtered")).toBeInTheDocument()
    await user.click(screen.getByTestId("hse-raids-reset"))

    expect(screen.queryByTestId("raids-filters-badge")).not.toBeInTheDocument()
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

    expect(screen.queryByTestId("raids-filters-badge")).not.toBeInTheDocument()
    expect(screen.getByTestId("hse-top-overall-empty")).toHaveTextContent(
      "hse.top.empty"
    )
  })
})
