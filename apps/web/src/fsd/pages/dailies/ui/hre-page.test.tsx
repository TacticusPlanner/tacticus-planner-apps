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
    hse: null as unknown,
    teamArgs: [] as unknown[],
    toasts: [] as [string, { action: { onClick: () => void } }][],
  },
}))

vi.mock("sonner", () => ({
  toast: Object.assign(
    (message: string, options: { action: { onClick: () => void } }) => {
      mocks.toasts.push([message, options])
    },
    { error: vi.fn(), success: vi.fn() }
  ),
}))

vi.mock("react-i18next", () => {
  // One `t` for every render, as react-i18next keeps it between language changes.
  const translation = {
    i18n: { language: "en", getResource: () => undefined },
    t: (key: string, values?: Record<string, unknown>) =>
      values
        ? `${key}|${Object.entries(values)
            .filter(([name]) => name !== "defaultValue")
            .map(([name, value]) => `${name}=${String(value)}`)
            .join(",")}`
        : key,
  }
  return {
    initReactI18next: { type: "3rdParty", init: vi.fn() },
    useTranslation: () => translation,
  }
})
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
vi.mock(
  "@/features/team-recommendations/model/use-hre-team-recommendations",
  () => ({
    useHreTeamRecommendations: (input: { plans: readonly unknown[] }) => {
      mocks.teamArgs.push(input)
      return input.plans.length > 0
        ? input.plans.map(() => mocks.team)
        : [mocks.team]
    },
  })
)
vi.mock("../model/use-running-hse", () => ({
  useRunningHse: () => mocks.hse,
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
  faction: "Orks",
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
const row = (
  battleId: string,
  energyCost: number,
  raids: number,
  eventPoints = 0
) => ({
  battleId,
  energyCost,
  raids,
  energy: raids * energyCost,
  goal: null,
  eventPoints,
})
const battles = (overrides = {}) => ({
  rows: [row("X30", 6, 4)],
  totalBattles: 4,
  totalEnergy: 24,
  openEnded: false,
  moreNeeded: false,
  empty: null,
  ...overrides,
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
  battles: null,
  ...overrides,
})

function renderHre(projectId?: string) {
  const context: DailiesOutletContext = {
    projects: [],
    projectId,
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
  mocks.hse = null
  mocks.teamArgs = []
  mocks.toasts = []
  act(() => {})
})

describe("HRE tab", () => {
  it("renders its title as an h2 under the shell h1", () => {
    renderHre()
    // The shell header owns the page h1; the tab starts its hierarchy at h2.
    expect(screen.queryAllByRole("heading", { level: 1 })).toHaveLength(0)
    expect(
      screen.getByRole("heading", { level: 2, name: "hre:title" })
    ).toBeInTheDocument()
  })

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
    mocks.raids = {
      status: "no-goals",
      missionRaids: plan({ rows: [row("I22", 5, 1, 15)] }),
      locationsByBattleId: new Map(),
    }
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      homeScreenEventId: "hse-machine-hunt",
      eventFarm: false,
    })
    expect(screen.getByTestId("hre-raids-budget")).toHaveTextContent(
      "raids.noteHomeScreenEvent|event=events:definitions.hse-machine-hunt"
    )
    expect(screen.getByTestId("hre-raid-I22-event-points")).toHaveTextContent(
      "raids.eventPoints|points=15"
    )
  })

  it("leaves the HSE out of the note when no suggested row earns its points", () => {
    mocks.homeScreenEvent = {
      status: "ready",
      active: { definitionId: "hse-machine-hunt" },
    }
    renderHre()
    expect(screen.getByTestId("hre-raids-budget")).not.toHaveTextContent(
      "raids.noteHomeScreenEvent"
    )
  })

  it("plans for every active goal, whatever project Today has selected", () => {
    renderHre("project-1")
    expect(mocks.raidsArgs.at(-1)?.[0]).toBeUndefined()
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
    expect(screen.getByTestId("hre-raids-budget")).not.toHaveTextContent(
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

  it("tracks mission 5 at 37 / 100 and suggests its raids and open-ended ability-damage battles", () => {
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
      eventFarm: false,
      missionRaids: {
        battlesToGo: 63,
        eventOnly: false,
        manual: {
          needs: [
            {
              objective: { kind: "abilityDamage", target: 10_000 },
              toGo: 4000,
              per: null,
            },
          ],
          preferLightning: false,
          countsAsRaids: true,
        },
      },
    })
    const raids = screen.getByTestId("hre-raids")
    expect(within(raids).getByRole("heading", { level: 2 })).toHaveTextContent(
      "raids.title|mission=missions.number|number=5"
    )
    expect(screen.getByTestId("hre-raids-to-go")).toHaveTextContent("count=63")
    expect(screen.getByTestId("hre-raids-note")).not.toHaveTextContent(
      "raids.planned"
    )
    expect(screen.getByTestId("hre-raids-budget")).toHaveTextContent(
      "energy=188"
    )
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

  it("suggests alliance ability uses as 5-slot battles by hand, from progress saved in the old order", () => {
    mocks.raids = {
      status: "no-goals",
      missionRaids: plan({ rows: [], battlesLeft: 0, battles: battles() }),
      locationsByBattleId: new Map(),
    }
    // Saved before mission 7 became ability uses, then Salvage Runs.
    seed({ mission: 7, progress: [2, 12] })
    renderHre()
    expect(screen.getByTestId("hre-objective-0-input")).toHaveValue(12)
    expect(mocks.raidsArgs.at(-1)?.[1]).toEqual({
      eventFarm: false,
      missionRaids: {
        battlesToGo: 0,
        eventOnly: false,
        manual: {
          needs: [
            {
              objective: { kind: "useAbilitiesAlliance", target: 20 },
              toGo: 8,
              per: "abilityUses",
            },
          ],
          slots: 5,
          alliance: "Xenos",
          preferLightning: false,
          countsAsRaids: false,
        },
      },
    })
    const note = screen.getByTestId("hre-battles-rules")
    expect(note).toHaveTextContent("raids.battles.slots|slots=5")
    expect(note).toHaveTextContent(
      "raids.battles.alliance|alliance=common:alliances.Xenos"
    )
    expect(note).toHaveTextContent("raids.battles.estimate")
    expect(note).toHaveTextContent("raids.battles.modes")
    expect(screen.getByTestId("hre-battles-totals")).toHaveTextContent(
      "raids.battleCount|count=4"
    )
    expect(screen.queryByTestId("hre-raids-main")).toBeNull()
  })

  it("keeps mission 16's raids off the alliance filter and fights its alliance kills by hand", () => {
    seed({ mission: 16, progress: [0, 0] })
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      missionRaids: {
        battlesToGo: 25,
        manual: {
          needs: [{ toGo: 100, per: "enemies" }],
          alliance: "Xenos",
          countsAsRaids: false,
        },
      },
    })
  })

  it("suggests 5-slot battles, then an Arena team and an Onslaught pool for mission 15", () => {
    mocks.team = { status: "loading" }
    seed({ mission: 15, progress: [0, 0], order: 2 })
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      missionRaids: {
        battlesToGo: 0,
        manual: { needs: [{ toGo: 150, per: "abilityUses" }], slots: 5 },
      },
    })
    expect(screen.getByTestId("hre-team")).toHaveTextContent(
      "hre:teams.titleMode|mode=hre:tokens.modes.arena"
    )
    expect(screen.getByTestId("hre-team-onslaught")).toHaveTextContent(
      "hre:teams.titleMode|mode=hre:tokens.modes.onslaught"
    )
  })

  it("plays mission 6's summon-free wins in Arena only with tokens above mission 10's reserve", () => {
    mocks.team = { status: "loading" }
    mocks.tokens = { arena: 7, guildRaid: 2, onslaught: 3, salvageRun: 1 }
    seed({ mission: 6, progress: [2500, 0] })
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      missionRaids: { manual: { needs: [{ toGo: 7, per: "battle" }] } },
    })
    expect(
      within(screen.getByTestId("hre-team")).getByTestId("hre-team-reserve")
    ).toHaveTextContent("hre:teams.reservePlay|have=7,play=3")
  })

  it("builds one campaign team per group of by-hand nodes, from only the factions they allow", () => {
    mocks.team = { status: "loading" }
    mocks.raids = {
      status: "no-goals",
      missionRaids: plan({
        rows: [],
        battlesLeft: 0,
        battles: battles({
          rows: [
            {
              ...row("I30", 6, 3),
              deploy: { factions: ["Ultramarines"], slots: 5 },
            },
            { ...row("O10", 6, 2), deploy: { factions: ["Orks"], slots: 4 } },
          ],
        }),
      }),
      locationsByBattleId: new Map([
        ["I30", { campaignName: "Indomitus" }],
        ["O10", { campaignName: "Octarius" }],
      ]),
    }
    seed({ mission: 17, progress: [0, 0] })
    renderHre()
    expect(mocks.teamArgs.at(-1)).toMatchObject({
      plans: [
        { mode: "battle", factions: ["Ultramarines"], size: 5 },
        { mode: "battle", factions: ["Orks"], size: 4 },
      ],
    })
    expect(screen.getByTestId("hre-campaign-team-0")).toHaveTextContent(
      "hre:teams.titleCampaigns|campaigns=Indomitus"
    )
    expect(screen.getByTestId("hre-campaign-team-1")).toHaveTextContent(
      "hre:teams.titleCampaigns|campaigns=Octarius"
    )
  })

  it("hands a running HSE's trackers to the mission teams and names it on them", () => {
    const trackers = [{ kind: "KillUnits" }]
    mocks.hse = { name: "Psyker Boost", trackers }
    mocks.team = {
      status: "ready",
      team: {
        status: "ready",
        rule: "abilities",
        eligibleCount: 20,
        alliance: null,
        support: null,
        hseUnits: 5,
        team: { deliveredSize: 5, members: [] },
      },
    }
    seed({ mission: 15, progress: [0, 0] })
    renderHre()
    expect(mocks.teamArgs.at(-1)).toMatchObject({ hseTrackers: trackers })
    expect(screen.getByTestId("hre-team")).toHaveTextContent(
      "hre:teams.hse|count=5,event=Psyker Boost"
    )
  })

  it("fights mission 11's Necrons by hand, lightning nodes first, beside its lightning raids", () => {
    mocks.raids = {
      status: "no-goals",
      missionRaids: plan({ battles: battles({ rows: [row("N05", 6, 4)] }) }),
      locationsByBattleId: new Map(),
    }
    seed({ mission: 11, progress: [0, 40] })
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      missionRaids: {
        battlesToGo: 25,
        eventOnly: true,
        manual: {
          needs: [{ toGo: 60, per: "factionEnemies" }],
          faction: "Necrons",
          preferLightning: true,
        },
      },
    })
    const note = screen.getByTestId("hre-battles-rules")
    expect(note).toHaveTextContent(
      "raids.battles.faction|faction=factions:Necrons"
    )
    expect(note).toHaveTextContent("raids.battles.lightning")
    expect(
      within(screen.getByTestId("hre-battles-list")).getAllByRole("listitem")
    ).toHaveLength(1)
    expect(screen.getByTestId("hre-raids-main")).toHaveTextContent(
      "raids.raidsTitle"
    )
  })

  it("keeps the featured hero's battles to nodes where the hero's faction deploys", () => {
    mocks.raids = {
      status: "no-goals",
      missionRaids: plan({ rows: [], battlesLeft: 0, battles: battles() }),
      locationsByBattleId: new Map(),
    }
    seed({ mission: 20 })
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      missionRaids: { manual: { alliance: "Xenos", heroFaction: "Orks" } },
    })
    expect(screen.getByTestId("hre-battles-note")).toHaveTextContent(
      "raids.battles.note"
    )
    const rules = screen.getByTestId("hre-battles-rules")
    expect(rules).not.toHaveAttribute("open")
    expect(within(rules).getAllByRole("listitem").length).toBeGreaterThan(1)
    expect(rules).toHaveTextContent(
      "raids.battles.heroFaction|faction=factions:Orks"
    )
    expect(rules).not.toHaveTextContent("raids.battles.alliance")
  })

  it("lists open-ended battles with their energy per battle", () => {
    mocks.raids = {
      status: "no-goals",
      missionRaids: plan({
        battles: battles({ openEnded: true, rows: [row("X30", 6, 0)] }),
      }),
      locationsByBattleId: new Map(),
    }
    seed({ mission: 8, progress: [2, 0] })
    renderHre()
    expect(screen.getByTestId("hre-battles-rules")).toHaveTextContent(
      "raids.battles.openEnded"
    )
    expect(screen.getByTestId("hre-raid-X30")).toHaveTextContent(
      "raids.energyPerBattle|energy=6"
    )
    expect(screen.queryByTestId("hre-battles-totals")).toBeNull()
  })

  it("waits for the featured hero before suggesting all-alliance battles", () => {
    mocks.instance = { ...running(), hero: null }
    seed({ mission: 7, progress: [12, 0], order: 2 })
    renderHre()
    expect(screen.queryByTestId("hre-battles")).toBeNull()
    expect(screen.getByTestId("hre-battles-notice")).toHaveTextContent(
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
    seed({ mission: 8, progress: [0, 20_000] })
    renderHre()
    expect(screen.queryByTestId("hre-raids-list")).toBeNull()
    expect(screen.getByTestId("hre-raids-notice")).toHaveTextContent(
      "hre:raids.notice.next|mission=missions.number|number=16"
    )
  })

  it("says the campaign objective is met", () => {
    seed({ mission: 5, progress: [10_000, 100] })
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
      missionRaids: plan({ rows: [], empty: "no-event", battlesLeft: 2 }),
      locationsByBattleId: new Map(),
    }
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      eventFarm: false,
      missionRaids: {
        battlesToGo: 2,
        eventOnly: true,
        manual: { needs: [{ toGo: 5, per: "enemies" }], preferLightning: true },
      },
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

  it("keeps the raids request while only points, rank or target change", async () => {
    seed({ mission: 5, progress: [0, 37] })
    renderHre()
    const lastRequest = () =>
      (mocks.raidsArgs.at(-1)?.[1] as { missionRaids: unknown }).missionRaids
    const first = lastRequest()
    const calls = mocks.raidsArgs.length
    await userEvent.type(screen.getByTestId("hre-pace-points"), "3")
    await userEvent.type(screen.getByTestId("hre-pace-rank"), "4")
    expect(mocks.raidsArgs.length).toBeGreaterThan(calls)
    expect(lastRequest()).toBe(first)
    await userEvent.type(screen.getByTestId("hre-objective-1-input"), "1")
    expect(lastRequest()).not.toBe(first)
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
    expect(steps.desktop.map((step) => step.target)).toContain(
      '[data-testid="hre-pace"]'
    )
  })

  it("points the mobile tour's pace step at the summary, and renders every mobile target", () => {
    mocks.isMobile = true
    renderHre()
    const steps = mocks.tourSteps as { mobile: { target: string }[] }
    for (const step of steps.mobile) {
      expect(document.querySelector(step.target), step.target).not.toBeNull()
    }
    const targets = steps.mobile.map((step) => step.target)
    expect(targets).toContain('[data-testid="hre-pace-summary"]')
    expect(targets).not.toContain('[data-testid="hre-pace"]')
  })

  describe("pace from what the player holds", () => {
    // Day 8 of Zapspitta's event, as the game showed it.
    const day8 = {
      mission: 20,
      progress: [0, 70],
      points: 15_657,
      rank: 26_602,
      owned: { currency: 372, nextTier: 17, step: "rare-4", toNext: 17 },
      order: 2,
    }
    beforeEach(() => {
      mocks.instance = { ...running(), nowMs: START + 7 * DAY }
    })

    it("projects day 8 from the shards held and names the next milestone and chest", () => {
      seed(day8)
      renderHre()
      expect(screen.getByTestId("hre-pace-now")).toHaveTextContent(
        "pace.nowValue|step=pace.steps.rare-4,toNext=17,gap=50,next=pace.steps.rare-5"
      )
      expect(screen.getByTestId("hre-pace-currency")).toHaveTextContent(
        "pace.currencyOwnedValue|owned=372,milestones=1,540,missions=100,daily=308,crates=340,total=2,660"
      )
      expect(screen.getByTestId("hre-pace-chest")).toHaveTextContent(
        "pace.chestRange|from=17,tier=20,spent=2,100,left=560"
      )
      expect(screen.getByTestId("hre-pace-shards")).toHaveTextContent(
        "held=297,chests=123,crates=18,total=438"
      )
      expect(screen.getByTestId("hre-pace-oh-so-close")).toBeInTheDocument()
      expect(screen.getByTestId("hre-pace-next-milestone")).toHaveTextContent(
        "pace.nextMilestone|points=16,000,reward=175"
      )
      expect(screen.getByTestId("hre-pace-next-chest")).toHaveTextContent(
        "pace.nextChest|tier=17,cost=450,missing=78"
      )
      expect(screen.getByTestId("hre-pace-bracket")).toHaveTextContent(
        "from=25,001,to=35,000,daily=44"
      )
      expect(screen.queryByTestId("hre-pace-owned-hint")).toBeNull()
    })

    it("keeps the points-only chain and asks for the rest when partly filled", () => {
      seed({ ...day8, owned: { currency: 372 } })
      renderHre()
      expect(screen.getByTestId("hre-pace-owned-hint")).toHaveTextContent(
        "pace.ownedPartial"
      )
      expect(screen.getByTestId("hre-pace-shards")).toHaveTextContent(
        "pace.shardsValue|"
      )
      expect(screen.queryByTestId("hre-pace-now")).toBeNull()
      expect(screen.queryByTestId("hre-pace-next-chest")).toBeNull()
    })

    it("stores typed owned inputs", async () => {
      seed({ ...day8, owned: undefined })
      renderHre()
      expect(screen.getByTestId("hre-pace-owned-hint")).toHaveTextContent(
        "pace.ownedHint"
      )
      await userEvent.type(screen.getByTestId("hre-pace-owned-currency"), "372")
      await userEvent.type(screen.getByTestId("hre-pace-next-tier"), "17")
      await userEvent.click(screen.getByTestId("hre-pace-step"))
      await userEvent.click(
        screen.getByRole("option", { name: "pace.steps.rare-4" })
      )
      await userEvent.type(screen.getByTestId("hre-pace-to-next"), "17")
      expect(screen.getByTestId("hre-pace-shards")).toHaveTextContent(
        "total=438"
      )
      const stored = JSON.parse(
        window.localStorage.getItem("tp.dailies.hre.progress.v1") ?? "{}"
      ) as Record<string, { owned: unknown }>
      expect(stored["occ-zapspitta"]?.owned).toEqual(day8.owned)
    })

    it("hides the shards toward the next step at Legendary blue star", () => {
      seed({
        ...day8,
        owned: { ...day8.owned, step: "legendary-blue-1", toNext: null },
      })
      renderHre()
      expect(screen.queryByTestId("hre-pace-to-next")).toBeNull()
      expect(screen.getByTestId("hre-pace-now")).toHaveTextContent(
        "pace.steps.legendary-blue-1"
      )
    })

    it("says when the rank was entered", () => {
      seed({ ...day8, rankAt: START + 5 * DAY })
      renderHre()
      expect(screen.getByTestId("hre-pace-bracket")).toHaveTextContent(
        "pace.rankAgeDays|count=2"
      )
    })
  })

  describe("tracker", () => {
    it("restores a mission's progress after picking another one", async () => {
      seed({ mission: 20, progress: [0, 70], order: 2 })
      renderHre()
      await userEvent.click(screen.getByTestId("hre-mission-picker"))
      await userEvent.click(
        screen.getByRole("option", { name: "missions.bonus" })
      )
      expect(screen.getByTestId("hre-objective-1-input")).toHaveValue(null)
      await userEvent.click(screen.getByTestId("hre-mission-picker"))
      await userEvent.click(
        screen.getByRole("option", { name: "missions.number|number=20" })
      )
      expect(screen.getByTestId("hre-objective-1-input")).toHaveValue(70)
    })

    it("steps objectives by 1 and 10, clamped at the target", async () => {
      seed({ mission: 20, progress: [0, 70], order: 2 })
      renderHre()
      await userEvent.click(screen.getByTestId("hre-objective-1-plus-10"))
      await userEvent.click(screen.getByTestId("hre-objective-0-plus-1"))
      expect(screen.getByTestId("hre-objective-1-input")).toHaveValue(80)
      expect(screen.getByTestId("hre-objective-0-input")).toHaveValue(1)
      expect(screen.queryByTestId("hre-objective-0-plus-10")).toBeNull()

      const input = screen.getByTestId("hre-objective-1-input")
      await userEvent.clear(input)
      await userEvent.type(input, "245")
      await userEvent.click(screen.getByTestId("hre-objective-1-plus-10"))
      expect(input).toHaveValue(250)
      expect(screen.queryByTestId("hre-objective-1-plus-1")).toBeNull()
    })

    it("offers Undo after Mission complete", async () => {
      seed({ mission: 5, progress: [10_000, 100] })
      renderHre()
      await userEvent.click(screen.getByTestId("hre-mission-complete"))
      expect(screen.getByTestId("hre-mission-6")).toHaveAttribute(
        "data-status",
        "current"
      )
      const [message, options] = mocks.toasts.at(-1)!
      expect(message).toBe("tracker.completed|mission=missions.number|number=5")
      act(() => options.action.onClick())
      expect(screen.getByTestId("hre-mission-5")).toHaveAttribute(
        "data-status",
        "current"
      )
      expect(screen.getByTestId("hre-objective-1-input")).toHaveValue(100)
    })
  })

  describe("mobile pace summary", () => {
    it("sits under the current mission and asks for points without them", async () => {
      mocks.isMobile = true
      renderHre()
      const order = [...screen.getByTestId("hre-sections").children].map(
        (child) => child.getAttribute("data-testid")
      )
      expect(order.indexOf("hre-pace-summary")).toBe(
        order.indexOf("hre-tracker") + 1
      )
      expect(screen.getByTestId("hre-pace-summary")).toHaveTextContent(
        "pace.summaryEmpty"
      )
      const scroll = vi.spyOn(HTMLElement.prototype, "scrollIntoView")
      await userEvent.click(screen.getByTestId("hre-pace-summary-details"))
      expect(scroll).toHaveBeenCalled()
      expect(scroll.mock.contexts.at(-1)).toBe(
        screen.getByTestId("hre-pace-section")
      )
    })

    it("summarises day 8 in one line", () => {
      mocks.isMobile = true
      mocks.instance = { ...running(), nowMs: START + 7 * DAY }
      seed({
        mission: 20,
        progress: [0, 70],
        points: 15_657,
        rank: 26_602,
        owned: { currency: 372, nextTier: 17, step: "rare-4", toNext: 17 },
        order: 2,
      })
      renderHre()
      expect(screen.getByTestId("hre-pace-summary")).toHaveTextContent(
        "pace.summary|points=15,657,projected=31,314,step=pace.steps.rare-red-1"
      )
    })

    it("is not shown on desktop", () => {
      seed({ points: 15_657 })
      renderHre()
      expect(screen.queryByTestId("hre-pace-summary")).toBeNull()
      expect(screen.getByTestId("hre-pace")).toBeInTheDocument()
    })
  })
})
