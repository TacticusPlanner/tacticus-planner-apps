import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { act, render, screen, within } from "@/test/render"
import { homeScreenEventRaidRuleOf } from "@/test/fixtures/home-screen-event"
import { hreRules } from "@/test/fixtures/hre-rules"

import type { DailiesOutletContext } from "./dailies-layout"
import { HrePage } from "./hre-page"

const { mocks } = vi.hoisted(() => ({
  mocks: {
    isMobile: false,
    instance: undefined as unknown,
    instanceKeys: [] as (string | null)[],
    raids: undefined as unknown,
    raidsArgs: [] as unknown[][],
    tokens: null as unknown,
    team: { status: "hidden" } as unknown,
    tourSteps: undefined as unknown,
    homeScreenEvent: { status: "loading" } as unknown,
    hses: [] as unknown[],
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
    i18n: {
      language: "en",
      languages: ["en"],
      getResource: () => undefined,
    },
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
  useHreInstance: (key: string | null) => {
    mocks.instanceKeys.push(key)
    return typeof mocks.instance === "function"
      ? (mocks.instance as (key: string | null) => unknown)(key)
      : mocks.instance
  },
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
  useRunningHses: () => mocks.hses,
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
const heroes = new Map([[hero.id, hero]])
const running = () => ({
  status: "ready",
  instance: { ...zapspitta, status: "running" },
  instances: [{ ...zapspitta, status: "running" }],
  defaultKey: zapspitta.key,
  stale: false,
  heroes,
  hero,
  rules: hreRules,
  nowMs: START + 20 * 3_600_000,
})
const preview = () => ({
  status: "ready",
  instance: { ...zapspitta, status: "upcoming" },
  instances: [{ ...zapspitta, status: "upcoming" }],
  defaultKey: zapspitta.key,
  stale: false,
  heroes,
  hero,
  rules: hreRules,
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

function LocationProbe() {
  const location = useLocation()
  return (
    <output data-testid="location">{`${location.pathname}${location.search}`}</output>
  )
}

function renderHre(
  projectId?: string,
  initialEntry = "/dailies/hre",
  setProjectId = vi.fn()
) {
  const context: DailiesOutletContext = {
    projects: [],
    projectId,
    setProjectId,
    projectsUnavailable: false,
    projectsError: false,
    retryProjects: vi.fn(),
  }
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/dailies" element={<Outlet context={context} />}>
          <Route path="hre" element={<HrePage />} />
        </Route>
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  )
}

const seed = (progress: Record<string, unknown>) =>
  window.localStorage.setItem(
    "tp.user.dailies.hre.progress",
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
  mocks.instanceKeys.length = 0
  mocks.tokens = null
  mocks.team = { status: "hidden" }
  mocks.homeScreenEvent = { status: "loading" }
  mocks.hses = []
  mocks.teamArgs = []
  mocks.toasts = []
  act(() => {})
})

/** Taps an objective's suggestion row by its id (raids, battles or a mode), jumping to its details. */
async function openFold(id: string) {
  await userEvent.click(
    screen.getByTestId(new RegExp(`-suggestion-${id}-trigger$`))
  )
}

describe("HRE tab", () => {
  it("does not repeat the page title, which the shell header owns", () => {
    renderHre()
    expect(screen.queryAllByRole("heading", { level: 1 })).toHaveLength(0)
    expect(
      screen.queryByRole("heading", { level: 2, name: "hre:title" })
    ).toBeNull()
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

  it("ranks the raids by a running HSE's points too, and says so", async () => {
    mocks.homeScreenEvent = {
      status: "ready",
      active: { definitionId: "hse-machine-hunt" },
      activeRaidRule: homeScreenEventRaidRuleOf("hse-machine-hunt"),
    }
    mocks.raids = {
      status: "no-goals",
      missionRaids: plan({ rows: [row("I22", 5, 1, 15)] }),
      locationsByBattleId: new Map(),
    }
    renderHre()
    await openFold("raids")
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      homeScreenEventRule: homeScreenEventRaidRuleOf("hse-machine-hunt"),
      eventFarm: false,
    })
    expect(screen.getByTestId("hre-raids-note")).toHaveTextContent(
      "raids.noteHomeScreenEvent|event=events:definitions.hse-machine-hunt"
    )
    expect(screen.getByTestId("hre-raid-I22-event-points")).toHaveTextContent(
      "raids.eventPoints|points=15"
    )
  })

  it("leaves the HSE out of the note when no suggested row earns its points", async () => {
    mocks.homeScreenEvent = {
      status: "ready",
      active: { definitionId: "hse-machine-hunt" },
      activeRaidRule: homeScreenEventRaidRuleOf("hse-machine-hunt"),
    }
    renderHre()
    await openFold("raids")
    expect(screen.getByTestId("hre-raids-note")).not.toHaveTextContent(
      "raids.noteHomeScreenEvent"
    )
  })

  it("plans for the selected Dailies project", () => {
    renderHre("project-1")
    expect(mocks.raidsArgs.at(-1)?.[0]).toBe("project-1")
  })

  it("plans for every active goal without a project", () => {
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[0]).toBeUndefined()
  })

  it("puts the event picker, project selector and Filters in the page toolbar, quick filters below", () => {
    renderHre()
    const toolbar = screen.getByTestId("hre-toolbar")
    const find = toolbar.querySelector(
      '[data-slot="page-toolbar-find"]'
    ) as HTMLElement
    expect(within(find).getByTestId("hre-event-switcher")).toBeInTheDocument()
    expect(within(find).getByTestId("hre-project-select")).toBeInTheDocument()
    expect(within(find).getByTestId("hre-raids-filters")).toBeInTheDocument()
    const chips = toolbar.querySelector(
      '[data-slot="page-toolbar-chips"]'
    ) as HTMLElement
    expect(
      within(chips).getByTestId("today-quick-filter-combineGoals")
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId("hre-raids")).queryByTestId(
        "hre-project-select"
      )
    ).toBeNull()
    expect(screen.queryByTestId("hre-planning-settings")).toBeNull()
  })

  it("offers CE nodes first while a campaign event runs, and passes it to the raids", async () => {
    const { unmount } = renderHre()
    expect(screen.queryByTestId("today-quick-filter-preferEvent")).toBeNull()
    expect(screen.queryByTestId("today-quick-filter-fewerRaids")).toBeNull()
    unmount()
    mocks.raids = {
      ...(mocks.raids as Record<string, unknown>),
      hasActiveEventBattles: true,
    }
    renderHre()
    await userEvent.click(screen.getByTestId("today-quick-filter-preferEvent"))
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      quickFilters: { preferEvent: true },
    })
  })

  it("ignores a running HSE that earns no raid points", async () => {
    mocks.homeScreenEvent = {
      status: "ready",
      active: { definitionId: "hse-faction-boost" },
      activeRaidRule: null,
    }
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toHaveProperty(
      "homeScreenEventRule",
      undefined
    )
    await openFold("raids")
    expect(screen.getByTestId("hre-raids-note")).not.toHaveTextContent(
      "raids.noteHomeScreenEvent"
    )
  })

  it("shows the empty state with no HRE running or scheduled", () => {
    mocks.instance = {
      status: "ready",
      instance: null,
      instances: [],
      defaultKey: null,
      stale: false,
      heroes: new Map(),
      hero: null,
      rules: hreRules,
      nowMs: START,
    }
    renderHre()
    expect(screen.getByTestId("hre-header-none")).toBeInTheDocument()
    expect(screen.queryByTestId("hre-sections")).toBeNull()
  })

  it("shows only the header and a notice when the served rules are missing", () => {
    mocks.instance = { ...running(), rules: null }
    renderHre()
    expect(screen.getByTestId("hre-rules-missing")).toBeInTheDocument()
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
    const summary = screen.getByTestId("hre-campaign-summary")
    expect(summary).toHaveTextContent("raids.summary.chipBattles|battles=725")
    expect(summary).toHaveTextContent(
      "raids.summary.chipPerDay|count=14,perDay=52"
    )
    expect(summary).toHaveTextContent("raids.summary.chipEnergy|energy=206")
    expect(screen.queryByTestId("hre-pace")).toBeNull()
  })

  it("tracks mission 5 at 37 / 100 and suggests its raids and open-ended ability-damage battles", async () => {
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
    expect(
      screen.getByRole("button", { name: "tracker.complete" })
    ).toBeEnabled()

    expect(mocks.raidsArgs.at(-1)?.[1]).toEqual({
      quickFilters: {
        fewerRaids: false,
        combineGoals: false,
        raidableOnly: false,
        preferEvent: false,
      },
      eventFarm: false,
      missionRaids: {
        battlesToGo: 63,
        eventOnly: false,
        manual: {
          needs: [
            {
              objective: {
                kind: "abilityDamage",
                target: 10_000,
                hintKeys: ["DealAbilityDamage_description"],
              },
              toGo: 4000,
              per: "enemyHealth",
            },
          ],
          preferLightning: false,
          countsAsRaids: true,
        },
      },
    })
    // A row each: the raids under the campaign objective, the battles under the damage one; their
    // details below the pace, each with the id its row scrolls to.
    expect(
      screen.getByTestId("hre-objective-1-suggestion-raids")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("hre-objective-0-suggestion-battles")
    ).toBeInTheDocument()
    // The rows are a labelled list inside the objective, so they don't read as another objective.
    for (const index of [0, 1]) {
      expect(
        within(
          screen.getByTestId(`hre-objective-${index}-suggestions`)
        ).getByRole("list", { name: "tracker.detailsTitle" })
      ).toBeInTheDocument()
    }
    expect(screen.getByTestId("hre-raids-summary")).toHaveTextContent(
      "raids.raidCount|count=37"
    )
    const details = screen.getByTestId("hre-details")
    expect(
      within(details).getByTestId("hre-objective-1-detail-raids")
    ).toHaveAttribute("id", "hre-objective-1-detail-raids")
    expect(
      within(details).getByTestId("hre-objective-0-detail-battles")
    ).toBeInTheDocument()
    const scrolled = vi.spyOn(HTMLElement.prototype, "scrollIntoView")
    await openFold("raids")
    expect(scrolled).toHaveBeenCalledTimes(1)
    expect(scrolled.mock.instances[0]).toBe(
      screen.getByTestId("hre-objective-1-detail-raids")
    )
    scrolled.mockRestore()
    expect(screen.getByTestId("hre-raids-note")).toHaveTextContent(
      "raids.unlimitedEnergy"
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
    const summary = screen.getByTestId("hre-campaign-summary")
    expect(summary).toHaveTextContent("raids.summary.chipBattles|battles=663")
    expect(summary).toHaveTextContent(
      "raids.summary.chipPerDay|count=14,perDay=48"
    )
    expect(summary).toHaveTextContent("raids.summary.chipEnergy|energy=186")
  })

  it("suggests alliance ability uses as 5-slot battles by hand, from progress saved in the old order", async () => {
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
      quickFilters: {
        fewerRaids: false,
        combineGoals: false,
        raidableOnly: false,
        preferEvent: false,
      },
      eventFarm: false,
      missionRaids: {
        battlesToGo: 0,
        eventOnly: false,
        manual: {
          needs: [
            {
              objective: {
                kind: "useAbilitiesAlliance",
                target: 20,
                hintKeys: expect.any(Array),
              },
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
    expect(screen.getByTestId("hre-battles-summary")).toHaveTextContent(
      "raids.battleCount|count=4"
    )
    await openFold("battles")
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

  it("suggests 5-slot battles, an Arena team and, on spare Onslaught tokens, the whole alliance for mission 15", async () => {
    mocks.team = { status: "loading" }
    mocks.tokens = { arena: 0, guildRaid: 0, onslaught: 3, salvageRun: 0 }
    seed({ mission: 15, progress: [0, 0], order: 2 })
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      missionRaids: {
        battlesToGo: 0,
        manual: { needs: [{ toGo: 150, per: "abilityUses" }], slots: 5 },
      },
    })
    expect(mocks.teamArgs.at(-1)).toMatchObject({
      plans: [
        { mode: "arena", spare: null },
        { mode: "onslaught", spare: { held: 3 }, wholeTrack: true },
      ],
    })
    expect(screen.getByTestId("hre-team-onslaught-summary")).toHaveTextContent(
      "teams.upTo|count=3"
    )
    await openFold("arena")
    await openFold("onslaught")
    expect(screen.getByTestId("hre-team-arena")).toHaveTextContent(
      "hre:teams.titleMode|mode=hre:tokens.modes.arena"
    )
    const onslaught = screen.getByTestId("hre-team-onslaught")
    expect(onslaught).toHaveTextContent(
      "hre:teams.titleMode|mode=hre:tokens.modes.onslaught"
    )
    expect(
      within(onslaught).getByTestId("hre-team-hint-spare")
    ).toHaveTextContent("hre:teams.hints.spare|count=3,held=3,need=0")
    expect(
      within(onslaught).getByTestId("hre-team-hint-noEventPoints")
    ).toBeInTheDocument()
  })

  it("plays mission 6's summon-free wins in Arena with tokens above the event's remaining need", async () => {
    mocks.team = { status: "loading" }
    // The missions from 6 on need 8 Arena battles: 11 held leave 3 spare.
    mocks.tokens = { arena: 11, guildRaid: 2, onslaught: 0, salvageRun: 0 }
    seed({ mission: 6, progress: [2500, 0] })
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      missionRaids: { manual: { needs: [{ toGo: 7, per: "battle" }] } },
    })
    await openFold("arena")
    expect(
      within(screen.getByTestId("hre-team-arena")).getByTestId(
        "hre-team-hint-spare"
      )
    ).toHaveTextContent("hre:teams.hints.spare|count=3,held=11,need=8")
    expect(screen.queryByTestId("hre-team-reserve")).toBeNull()
  })

  it("keeps mission 6's Onslaught tokens for mission 7, where a run pays off", () => {
    mocks.team = { status: "loading" }
    mocks.tokens = { arena: 0, guildRaid: 0, onslaught: 3, salvageRun: 0 }
    seed({ mission: 6, progress: [0, 0] })
    renderHre()
    // No spare Onslaught team: nothing else on mission 6 plays a token mode.
    expect(mocks.teamArgs.at(-1)).toMatchObject({ plans: [] })
    expect(screen.queryByTestId("hre-team-onslaught-summary")).toBeNull()
    expect(
      screen.getByTestId("hre-current-reserve-onslaught")
    ).toHaveTextContent(
      "tips.saveOnslaught|mode=tokens.modes.onslaught,mission=missions.number|number=7"
    )
  })

  it("keeps mission 6's Arena tokens for later missions when none are spare", () => {
    mocks.team = { status: "loading" }
    // 7 held against the 8 Arena battles the missions from 6 on need: nothing spare, so all 10
    // summon-free wins stay campaign battles.
    mocks.tokens = { arena: 7, guildRaid: 2, onslaught: 0, salvageRun: 0 }
    seed({ mission: 6, progress: [2500, 0] })
    renderHre()
    expect(mocks.raidsArgs.at(-1)?.[1]).toMatchObject({
      missionRaids: { manual: { needs: [{ toGo: 10, per: "battle" }] } },
    })
    expect(screen.queryByTestId(/-suggestion-arena-trigger$/)).toBeNull()
    expect(screen.queryByTestId("hre-team-arena")).toBeNull()
  })

  it("builds one campaign team per group of by-hand nodes, from only the factions they allow", async () => {
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
        ["I30", { campaignName: "Indomitus", nodeLabel: "30" }],
        ["O10", { campaignName: "Octarius", nodeLabel: "10" }],
      ]),
    }
    seed({ mission: 17, progress: [0, 0] })
    renderHre()
    await openFold("battles")
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

  it("hands the running personal HSE that scores in a team's mode to it and names it", async () => {
    const trackers = [
      {
        kind: "KillUnits",
        points: 1,
        pointsByRarity: null,
        gameModes: { allowed: ["Arena"], disallowed: null },
        enemy: null,
        player: null,
      },
    ]
    mocks.hses = [{ name: "Psyker Boost", trackers, statBoosts: [] }]
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
    const input = mocks.teamArgs.at(-1) as {
      hseTrackersFor: (mode: string) => unknown
    }
    expect(input.hseTrackersFor("arena")).toBe(trackers)
    expect(input.hseTrackersFor("battle")).toBeNull()
    await openFold("arena")
    expect(screen.getByTestId("hre-team-arena")).toHaveTextContent(
      "hre:teams.hse|count=5,event=Psyker Boost"
    )
  })

  it("fights mission 11's Necrons by hand, lightning nodes first, beside its lightning raids", async () => {
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
    await openFold("battles")
    await openFold("raids")
    const note = screen.getByTestId("hre-battles-rules")
    expect(note).toHaveTextContent(
      "raids.battles.faction|faction=factions:Necrons"
    )
    expect(note).toHaveTextContent("raids.battles.lightning")
    expect(
      within(screen.getByTestId("hre-battles-list")).getAllByRole("listitem")
    ).toHaveLength(1)
    expect(screen.getByTestId("hre-raids-note")).toHaveTextContent(
      "raids.noteLightning"
    )
  })

  it("keeps the featured hero's battles to nodes where the hero's faction deploys", async () => {
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
    await openFold("battles")
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

  it("lists open-ended battles with their energy per battle", async () => {
    mocks.raids = {
      status: "no-goals",
      missionRaids: plan({
        battles: battles({ openEnded: true, rows: [row("X30", 6, 0)] }),
      }),
      locationsByBattleId: new Map(),
    }
    seed({ mission: 8, progress: [2, 0] })
    renderHre()
    await openFold("battles")
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
    expect(screen.queryByTestId(/-suggestion-battles$/)).toBeNull()
    expect(
      screen.getByTestId("hre-objective-0-suggestions-note")
    ).toHaveTextContent("hre:raids.notice.noHero")
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

  it("asks to win lightning victories manually without a campaign event", async () => {
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
    await openFold("raids")
    expect(screen.getByTestId("hre-raids-empty-no-event")).toHaveTextContent(
      "count=2"
    )
  })

  it("offers to reset the Raids Filters when they hide every node", async () => {
    seed({ mission: 5, progress: [0, 37] })
    mocks.raids = {
      status: "no-goals",
      missionRaids: plan({ rows: [], empty: "filtered" }),
      locationsByBattleId: new Map(),
    }
    renderHre()
    await openFold("raids")
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

  it("asks for points when a target is picked before any are entered", async () => {
    seed({ mission: 1, progress: [0, 0], target: "epic-red-1" })
    renderHre()
    expect(screen.getByText("pace.targetNeedsPoints")).toBeInTheDocument()
    await userEvent.type(screen.getByTestId("hre-pace-points"), "30000")
    expect(screen.queryByText("pace.targetNeedsPoints")).toBeNull()
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

  it("points the mobile tour's pace step at the card under the tracker, and renders every mobile target", () => {
    mocks.isMobile = true
    renderHre()
    const steps = mocks.tourSteps as { mobile: { target: string }[] }
    for (const step of steps.mobile) {
      expect(document.querySelector(step.target), step.target).not.toBeNull()
    }
    const targets = steps.mobile.map((step) => step.target)
    expect(targets).toContain('[data-testid="hre-pace"]')
    expect(targets.indexOf('[data-testid="hre-pace"]')).toBeLessThan(
      targets.indexOf('[data-testid="hre-raids"]')
    )
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
        window.localStorage.getItem("tp.user.dailies.hre.progress") ?? "{}"
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

  describe("side column", () => {
    it("puts the pace first, then the suggestions, tokens and the campaign outlook, on both layouts", () => {
      seed({ mission: 5, progress: [0, 37] })
      mocks.tokens = { arena: 8, guildRaid: 2, onslaught: 3, salvageRun: 1 }
      const { unmount } = renderHre()
      const side = (root: Element) =>
        [...root.children].map((child) => child.getAttribute("data-testid"))
      const desktop = screen.getByTestId("hre-sections").children[1]
      expect(desktop && side(desktop)).toEqual([
        "hre-pace-section",
        "hre-details",
        "hre-tokens",
        "hre-raids",
      ])
      unmount()
      mocks.isMobile = true
      renderHre()
      expect(side(screen.getByTestId("hre-sections"))).toEqual([
        "hre-tracker",
        "hre-pace-section",
        "hre-details",
        "hre-tokens",
        "hre-raids",
        "hre-all-missions",
      ])
    })

    it("previews the whole event's tokens and campaign outlook", () => {
      mocks.instance = preview()
      renderHre()
      expect(screen.getByTestId("hre-tokens")).toBeInTheDocument()
      expect(screen.getByTestId("hre-campaign-summary")).toBeInTheDocument()
      expect(screen.queryByTestId("hre-pace")).toBeNull()
    })
  })
})

describe("HRE event switcher", () => {
  const past = {
    key: "occ-past",
    entry: {
      occurrenceId: "occ-past",
      definitionId: "new-character-event",
      startUtc: "2026-09-20T00:00:00Z",
      endUtc: "2026-10-04T00:00:00Z",
      parameters: { featuredCharacterId: "orksWeirdboy" },
    },
    featuredCharacterId: "orksWeirdboy",
    status: "past",
  }
  const withPast = (key: string | null) => {
    const base = running()
    const instances = [past, ...base.instances]
    if (key === past.key) return { ...base, instances, instance: past }
    return { ...base, instances, stale: key !== null && key !== zapspitta.key }
  }

  beforeEach(() => {
    mocks.instance = withPast
  })

  it("passes the URL selection to the instance read", () => {
    renderHre(undefined, "/dailies/hre?event=occ-past")
    expect(mocks.instanceKeys.at(-1)).toBe("occ-past")
  })

  it("steps to the previous event, then back to the default, clearing the URL", async () => {
    renderHre()
    expect(screen.getByTestId("hre-event-switcher")).toBeInTheDocument()
    expect(screen.getByTestId("hre-event-next")).toBeDisabled()
    await userEvent.click(screen.getByTestId("hre-event-previous"))
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/dailies/hre?event=occ-past"
    )
    await userEvent.click(screen.getByTestId("hre-event-next"))
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/dailies\/hre$/)
  })

  it("shows a past event's header and missions without raids, tracker or pace", () => {
    renderHre(undefined, "/dailies/hre?event=occ-past")
    expect(screen.getByTestId("hre-header-past")).toBeInTheDocument()
    expect(screen.queryByTestId("hre-header-countdown")).toBeNull()
    expect(screen.getByTestId("hre-past-note")).toBeInTheDocument()
    expect(screen.queryByTestId("hre-raids")).toBeNull()
    expect(screen.queryByTestId("hre-tracker")).toBeNull()
    expect(screen.queryByTestId("hre-pace-section")).toBeNull()
    expect(screen.getByTestId("hre-mission-1")).toBeInTheDocument()
  })

  it("drops a key that no longer resolves from the URL", () => {
    renderHre(undefined, "/dailies/hre?event=gone")
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/dailies\/hre$/)
    expect(screen.getByTestId("hre-header")).toBeInTheDocument()
  })
})
