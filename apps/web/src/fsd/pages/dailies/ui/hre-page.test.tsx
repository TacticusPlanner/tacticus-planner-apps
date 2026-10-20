import { MemoryRouter, Outlet, Route, Routes } from "react-router"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { act, render, screen, within } from "@/test/render"

import type { DailiesOutletContext } from "./dailies-layout"
import { HrePage } from "./hre-page"

const { mocks } = vi.hoisted(() => ({
  mocks: {
    isMobile: false,
    instance: undefined as unknown,
    raids: undefined as unknown,
    raidsArgs: [] as unknown[][],
    tokens: null as unknown,
    team: { status: "hidden" } as unknown,
    tourSteps: undefined as unknown,
    homeScreenEvent: { status: "loading" } as unknown,
  },
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    i18n: { language: "en", getResource: () => undefined },
    t: (key: string, values?: Record<string, unknown>) =>
      values
        ? `${key}|${Object.entries(values)
            .filter(([name]) => name !== "defaultValue")
            .map(([name, value]) => `${name}=${String(value)}`)
            .join(",")}`
        : key,
  }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => {
    mocks.tourSteps = steps
  },
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mocks.isMobile,
}))
vi.mock("@/features/hre-missions/model/use-hre-instance", () => ({
  useHreInstance: () => mocks.instance,
  useIsHreLive: () => false,
}))
vi.mock("@/features/hre-missions/model/use-hre-tokens", () => ({
  useHreTokens: () => mocks.tokens,
}))
vi.mock("@/features/daily-raids/model/use-daily-raids", () => ({
  useDailyRaids: (...args: unknown[]) => {
    mocks.raidsArgs.push(args)
    return mocks.raids
  },
}))
vi.mock("@/features/daily-raids/model/use-active-home-screen-event", () => ({
  useActiveHomeScreenEvent: () => mocks.homeScreenEvent,
}))
vi.mock("../model/use-hre-team-recommendations", () => ({
  useHreTeamRecommendations: () => mocks.team,
}))

const DAY = 86_400_000
const START = Date.parse("2026-10-18T00:00:00Z")
const zapspitta = {
  key: "occ-zapspitta",
  entry: {
    occurrenceId: "occ-zapspitta",
    definitionId: "new-character-event",
    startUtc: "2026-10-18T00:00:00Z",
    endUtc: "2026-11-01T00:00:00Z",
    parameters: { featuredCharacterId: "orksWeirdboy" },
  },
  featuredCharacterId: "orksWeirdboy",
}
const hero = {
  id: "orksWeirdboy",
  name: "Zapspitta",
  alliance: "Xenos",
  initialRarity: "Common",
}
const running = () => ({
  status: "ready",
  instance: { ...zapspitta, status: "running" },
  hero,
  nowMs: START + 20 * 3_600_000,
})
const preview = () => ({
  status: "ready",
  instance: { ...zapspitta, status: "upcoming" },
  hero,
  nowMs: START - DAY,
})

const indomitus = (node: number) => `I${String(node).padStart(2, "0")}`
const row = (battleId: string, energyCost: number, raids: number) => ({
  battleId,
  energyCost,
  raids,
  energy: raids * energyCost,
  goal: null,
})
const plan = (overrides = {}) => ({
  battlesLeft: 38,
  energyBudget: 188,
  rows: [
    row("I15", 5, 10),
    row("I16", 5, 10),
    row("I17", 5, 10),
    row("I18", 5, 7),
  ],
  totalRaids: 37,
  totalEnergy: 185,
  remainingAfter: 1,
  empty: null,
  noDropRows: Array.from({ length: 9 }, (_, index) =>
    row(indomitus(index + 6), 3, 3)
  ),
  outlookNodes: [
    ...Array.from({ length: 9 }, () => ({ energyCost: 3, dailyAttempts: 3 })),
    ...Array.from({ length: 15 }, () => ({ energyCost: 5, dailyAttempts: 10 })),
  ],
  dailyEnergy: 538,
  factionRows: [],
  ...overrides,
})

function renderHre() {
  const context: DailiesOutletContext = {
    projects: [],
    projectId: undefined,
    setProjectId: vi.fn(),
    projectsUnavailable: false,
    projectsError: false,
    retryProjects: vi.fn(),
  }
  return render(
    <MemoryRouter initialEntries={["/dailies/hre"]}>
      <Routes>
        <Route path="/dailies" element={<Outlet context={context} />}>
          <Route path="hre" element={<HrePage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

const seed = (progress: Record<string, unknown>) =>
  window.localStorage.setItem(
    "tp.dailies.hre.progress.v1",
    JSON.stringify({ "occ-zapspitta": progress })
  )

beforeEach(() => {
  mocks.isMobile = false
  mocks.instance = running()
  mocks.raids = {
    status: "no-goals",
    missionRaids: plan(),
    locationsByBattleId: new Map(),
  }
  mocks.raidsArgs.length = 0
  mocks.tokens = null
  mocks.team = { status: "hidden" }
  mocks.homeScreenEvent = { status: "loading" }
  act(() => {})
})

describe("HRE tab", () => {
  it("loads directly at /dailies/hre with the running event's header", () => {
    renderHre()
    expect(screen.getByTestId("hre-header-hero")).toHaveTextContent(
      "characters:orksWeirdboy"
    )
    expect(screen.getByTestId("hre-header-countdown")).toHaveTextContent(
      "hre:status.endsIn"
    )
    expect(screen.queryByTestId("hre-header-preview")).toBeNull()
    expect(screen.queryByTestId("hre-header-controls")).toBeNull()
    expect(screen.queryByTestId("raids-filters")).toBeNull()
  })

  it("ranks the raids by a running HSE's points too, and says so", () => {
    mocks.homeScreenEvent = {
      status: "ready",
      active: { definitionId: "hse-machine-hunt" },
    }
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      homeScreenEventId: "hse-machine-hunt",
    })
    expect(screen.getByTestId("hre-raids-note")).toHaveTextContent(
      "raids.noteHomeScreenEvent|event=events:definitions.hse-machine-hunt"
    )
  })

  it("ignores a running HSE that earns no raid points", () => {
    mocks.homeScreenEvent = {
      status: "ready",
      active: { definitionId: "hse-faction-boost" },
    }
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).not.toHaveProperty(
      "homeScreenEventId",
      "hse-faction-boost"
    )
    expect(screen.getByTestId("hre-raids-note")).not.toHaveTextContent(
      "raids.noteHomeScreenEvent"
    )
  })

  it("shows the empty state with no HRE running or scheduled", () => {
    mocks.instance = {
      status: "ready",
      instance: null,
      hero: null,
      nowMs: START,
    }
    renderHre()
    expect(screen.getByTestId("hre-header-none")).toBeInTheDocument()
    expect(screen.queryByTestId("hre-sections")).toBeNull()
  })

  it("shows the retryable error, not the empty state, when the calendar fails", async () => {
    const retry = vi.fn()
    mocks.instance = { status: "error", retry }
    renderHre()
    expect(screen.queryByTestId("hre-header-none")).toBeNull()
    await userEvent.click(
      within(screen.getByTestId("hre-header-error")).getByRole("button")
    )
    expect(retry).toHaveBeenCalled()
  })

  it("previews an upcoming event read-only", () => {
    mocks.instance = preview()
    renderHre()
    expect(screen.getByTestId("hre-header-preview")).toBeInTheDocument()
    expect(screen.queryByTestId("hre-mission-picker")).toBeNull()
    expect(screen.queryByTestId("hre-objective-0-input")).toBeNull()
    expect(screen.getByTestId("hre-mission-1")).toHaveAttribute(
      "data-status",
      "preview"
    )
    expect(screen.getByTestId("hre-raids-notice")).toHaveTextContent(
      "hre:raids.notice.preview"
    )
    // The whole 14 days of a preview: 725 battles, 52 a day (27 at 3 energy, 25 at 5).
    expect(screen.getByTestId("hre-campaign-summary")).toHaveTextContent(
      "raids.summary.fits|count=14,battles=725,perDay=52,energy=206"
    )
    expect(screen.queryByTestId("hre-pace")).toBeNull()
  })

  it("tracks mission 5 at 37 / 100 and suggests its raids", () => {
    seed({ mission: 5, progress: [6000, 37] })
    renderHre()
    expect(screen.getByTestId("hre-objective-0-input")).toHaveValue(6000)
    expect(screen.getByTestId("hre-objective-1-input")).toHaveValue(37)
    for (const number of [1, 2, 3, 4]) {
      expect(screen.getByTestId(`hre-mission-${number}`)).toHaveAttribute(
        "data-status",
        "done"
      )
    }
    expect(screen.getByTestId("hre-mission-5")).toHaveAttribute(
      "data-status",
      "current"
    )
    expect(screen.getByTestId("hre-mission-21")).toHaveAttribute(
      "data-status",
      "locked"
    )
    expect(screen.getByTestId("hre-mission-complete")).toBeDisabled()

    expect(mocks.raidsArgs.at(-1)?.[1]).toEqual({
      missionRaids: { battlesToGo: 63, eventOnly: false },
    })
    const raids = screen.getByTestId("hre-raids")
    expect(within(raids).getByRole("heading", { level: 2 })).toHaveTextContent(
      "raids.title|mission=missions.number|number=5"
    )
    expect(screen.getByTestId("hre-raids-to-go")).toHaveTextContent("count=63")
    expect(screen.getByTestId("hre-raids-note")).not.toHaveTextContent(
      "raids.planned"
    )
    expect(screen.getByTestId("hre-raids-note")).toHaveTextContent("energy=188")
    expect(
      within(screen.getByTestId("hre-raids-list")).getAllByRole("listitem")
    ).toHaveLength(4)
    expect(screen.getByTestId("hre-raids-totals")).toHaveTextContent("count=37")
    expect(screen.getByTestId("hre-raids-totals")).toHaveTextContent(
      "energy=185"
    )
    expect(
      within(screen.getByTestId("hre-raids-no-drop-list")).getAllByRole(
        "listitem"
      )
    ).toHaveLength(9)
    expect(screen.getByTestId("hre-raids-no-drop-totals")).toHaveTextContent(
      "count=27"
    )
    // 20 hours into the 14 days: 14 days left, 48 a day (27 at 3 energy, 21 at 5).
    expect(screen.getByTestId("hre-campaign-summary")).toHaveTextContent(
      "raids.summary.fits|count=14,battles=663,perDay=48,energy=186"
    )
  })

  it("labels hand-fought alliance battles as battles, on the alliance's nodes", () => {
    seed({ mission: 7, progress: [2, 12] })
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toEqual({
      missionRaids: {
        battlesToGo: 2,
        eventOnly: false,
        slots: 5,
        alliance: "Xenos",
      },
    })
    expect(screen.getByTestId("hre-raids-note")).toHaveTextContent(
      "raids.budgetBattles|energy=188"
    )
    expect(screen.getByTestId("hre-raids-totals")).toHaveTextContent(
      "raids.battleCount|count=37"
    )
    expect(screen.getByTestId("hre-raids-no-drop-totals")).toHaveTextContent(
      "raids.battleCount|count=27"
    )
  })

  it("keeps mission 16's raids to the alliance's nodes while its alliance kills are open", () => {
    seed({ mission: 16, progress: [0, 0] })
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toEqual({
      missionRaids: { battlesToGo: 25, eventOnly: false, alliance: "Xenos" },
    })
    expect(screen.getByTestId("hre-raids-note")).toHaveTextContent(
      "raids.noteAllianceNodes"
    )
  })

  it("lists Necron nodes apart from mission 11's lightning victories", () => {
    mocks.raids = {
      status: "no-goals",
      missionRaids: plan({ factionRows: [row("N05", 6, 4)] }),
      locationsByBattleId: new Map(),
    }
    seed({ mission: 11, progress: [0, 40] })
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toEqual({
      missionRaids: {
        battlesToGo: 25,
        eventOnly: true,
        enemyFaction: { faction: "Necrons", killsToGo: 60 },
      },
    })
    const faction = screen.getByTestId("hre-raids-faction")
    expect(faction).toHaveTextContent(
      "raids.faction.title|faction=factions:Necrons"
    )
    expect(faction).toHaveTextContent(/raids\.faction\.note\|.*count=60/)
    expect(faction).toHaveTextContent("raids.faction.lightning")
    expect(
      within(screen.getByTestId("hre-raids-faction-list")).getAllByRole(
        "listitem"
      )
    ).toHaveLength(1)
    expect(screen.getByTestId("hre-raids-faction-totals")).toHaveTextContent(
      "count=4"
    )
  })

  it("waits for the featured hero before suggesting all-alliance battles", () => {
    mocks.instance = { ...running(), hero: null }
    seed({ mission: 7, progress: [2, 12] })
    renderHre()
    expect(screen.queryByTestId("hre-raids-list")).toBeNull()
    expect(screen.getByTestId("hre-raids-notice")).toHaveTextContent(
      "hre:raids.notice.noHero"
    )
  })

  it("clamps an entry to the target and completes the mission", async () => {
    seed({ mission: 5, progress: [10_000, 37] })
    renderHre()
    const input = screen.getByTestId("hre-objective-1-input")
    await userEvent.clear(input)
    await userEvent.type(input, "140")
    expect(input).toHaveValue(100)
    expect(screen.getByTestId("hre-objective-1-done")).toBeInTheDocument()
    await userEvent.click(screen.getByTestId("hre-mission-complete"))
    expect(screen.getByTestId("hre-mission-6")).toHaveAttribute(
      "data-status",
      "current"
    )
    expect(screen.getByTestId("hre-objective-1-input")).toHaveValue(null)
  })

  it("types into an empty input without a leading zero", async () => {
    seed({ mission: 5, progress: [0, 0] })
    renderHre()
    const input = screen.getByTestId("hre-objective-1-input")
    expect(input).toHaveValue(null)
    await userEvent.type(input, "33")
    expect(input).toHaveValue(33)
    expect(input).toHaveDisplayValue("33")
  })

  it("completes one objective in one click", async () => {
    seed({ mission: 5, progress: [0, 37] })
    renderHre()
    await userEvent.click(screen.getByTestId("hre-objective-1-mark-done"))
    expect(screen.getByTestId("hre-objective-1-input")).toHaveValue(100)
    expect(screen.getByTestId("hre-objective-1-done")).toBeInTheDocument()
    expect(screen.queryByTestId("hre-objective-1-mark-done")).toBeNull()
  })

  it("names the next campaign mission when the current one has none", () => {
    seed({ mission: 6, progress: [0, 0] })
    renderHre()
    expect(screen.queryByTestId("hre-raids-list")).toBeNull()
    expect(screen.getByTestId("hre-raids-notice")).toHaveTextContent(
      "hre:raids.notice.next|mission=missions.number|number=16"
    )
  })

  it("says the campaign objective is met", () => {
    seed({ mission: 5, progress: [0, 100] })
    renderHre()
    expect(screen.getByTestId("hre-raids-notice")).toHaveTextContent(
      "hre:raids.notice.met"
    )
  })

  it("says all missions are complete after the Bonus", () => {
    seed({ mission: 22, progress: [0, 0] })
    renderHre()
    expect(screen.getByTestId("hre-all-done")).toBeInTheDocument()
    expect(screen.getByTestId("hre-mission-21")).toHaveAttribute(
      "data-status",
      "done"
    )
  })

  it("asks to win lightning victories manually without a campaign event", () => {
    mocks.raids = {
      status: "no-goals",
      missionRaids: plan({ rows: [], empty: "no-event" }),
      locationsByBattleId: new Map(),
    }
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toEqual({
      missionRaids: { battlesToGo: 2, eventOnly: true },
    })
    expect(screen.getByTestId("hre-raids-empty-no-event")).toHaveTextContent(
      "count=2"
    )
  })

  it("offers to reset the Raids Filters when they hide every node", () => {
    seed({ mission: 5, progress: [0, 37] })
    mocks.raids = {
      status: "no-goals",
      missionRaids: plan({ rows: [], empty: "filtered" }),
      locationsByBattleId: new Map(),
    }
    renderHre()
    expect(screen.getByTestId("hre-raids-empty-filtered")).toHaveTextContent(
      "hre:raids.empty.noCandidates"
    )
    expect(screen.getByTestId("hre-raids-reset")).toBeInTheDocument()
  })

  it("marks Arena short in the tokens card on day 1", () => {
    mocks.tokens = { arena: 8, guildRaid: 2, onslaught: 3, salvageRun: 1 }
    renderHre()
    expect(screen.getByTestId("hre-tokens-arena-short")).toBeInTheDocument()
    expect(screen.queryByTestId("hre-tokens-guildRaid-short")).toBeNull()
    expect(
      screen.getByTestId("hre-tokens-salvageRun-short")
    ).toBeInTheDocument()
  })

  it("projects the pace from points and rank, and asks for a rank without one", async () => {
    renderHre()
    expect(screen.getByTestId("hre-pace-empty")).toBeInTheDocument()
    await userEvent.type(screen.getByTestId("hre-pace-points"), "30000")
    expect(screen.getByTestId("hre-pace-bracket")).toHaveTextContent(
      "pace.noRank"
    )
    await userEvent.type(screen.getByTestId("hre-pace-rank"), "3200")
    expect(screen.getByTestId("hre-pace-bracket")).toHaveTextContent(
      "from=2,501,to=5,000"
    )
    expect(screen.getByTestId("hre-pace-currency")).toHaveTextContent(
      "daily=826,crates=720"
    )
  })

  it("lays out two columns on desktop and one column with collapsed missions on mobile", () => {
    const { unmount } = renderHre()
    expect(screen.getByTestId("hre-sections")).toHaveClass("grid-cols-2")
    expect(screen.queryByTestId("hre-all-missions-toggle")).toBeNull()
    unmount()

    mocks.isMobile = true
    renderHre()
    expect(screen.getByTestId("hre-sections")).not.toHaveClass("grid-cols-2")
    expect(screen.getByTestId("hre-all-missions-toggle")).toBeInTheDocument()
    const order = [...screen.getByTestId("hre-sections").children].map(
      (child) => child.getAttribute("data-testid")
    )
    expect(order.at(-1)).toBe("hre-all-missions")
  })

  it("registers desktop and mobile tour steps that target rendered elements", () => {
    renderHre()
    const steps = mocks.tourSteps as {
      desktop: { target: string }[]
      mobile: { target: string }[]
    }
    for (const step of steps.desktop) {
      expect(document.querySelector(step.target), step.target).not.toBeNull()
    }
    expect(steps.mobile.at(-1)?.target).toBe(
      '[data-testid="hre-all-missions-toggle"]'
    )
  })
})
