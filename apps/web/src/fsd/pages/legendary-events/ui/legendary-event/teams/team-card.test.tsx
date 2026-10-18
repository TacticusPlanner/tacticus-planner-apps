import { useEffect, useState } from "react"
import userEvent from "@testing-library/user-event"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import {
  buildLanePointsModel,
  buildSyncedLaneProgress,
  type ClearEstimate,
  type LegendaryEventRosterUnit,
  type LegendaryEventTeam,
} from "@/entities/legendary-event"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import {
  teamLane,
  teamUnitList,
  teamUnits,
} from "@/test/fixtures/legendary-event-teams"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"

import { TeamCard } from "./team-card"
import {
  buildTeamCardViewModel,
  moveTargets,
  type TeamCardViewModel,
} from "./teams.view-model"

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: <T,>(querier: () => Promise<T>) => {
    const [value, setValue] = useState<T>()
    useEffect(() => {
      void querier().then(setValue)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return value
  },
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: async () =>
    new Map(Object.values(teamUnits).map((unit) => [unit.id, unit])),
  getMowsMap: async () => new Map(),
}))

let i18n: I18n

const team = (
  overrides: Partial<LegendaryEventTeam> = {}
): LegendaryEventTeam => ({
  id: "t1",
  laneId: "alpha",
  name: "Melee",
  sortOrder: 0,
  memberUnitIds: [teamUnits.a.id, teamUnits.b.id, teamUnits.c.id],
  reserveUnitId: teamUnits.r.id,
  objectiveIndexes: [0, 1],
  runDepths: [
    {
      run: 1,
      expectedBattleClears: 7,
      expectedBattleClearsSource: "manual",
      recordedAt: "2026-10-01T00:00:00Z",
    },
  ],
  ...overrides,
})

const actions = () => ({
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onDepthChange: vi.fn(),
  onUseEstimate: vi.fn(),
})

const NO_ESTIMATE = { estimate: null, fromEstimate: false }

/** The worked Uthar Alpha team's estimate (spec: 6, 21% above, 32% short). */
const estimateOf = (overrides: Partial<ClearEstimate> = {}): ClearEstimate => ({
  depth: 6,
  battleCount: 18,
  marginAbovePct: 21,
  shortfallToNextPct: 32,
  calibrated: true,
  ...overrides,
})

const ownedRoster = (unitIds: readonly string[]): LegendaryEventRosterUnit[] =>
  unitIds.map((unitId) => ({
    unitId: unitId as LegendaryEventRosterUnit["unitId"],
    rank: "Gold1",
    progressionIndex: "Epic:RedOneStar",
  }))

function renderEstimatedCard(
  value: LegendaryEventTeam,
  estimate: ClearEstimate,
  {
    run = 1 as 1 | 2,
    roster = ownedRoster(value.memberUnitIds),
  }: { run?: 1 | 2; roster?: LegendaryEventRosterUnit[] } = {}
) {
  const cardActions = actions()
  const card = buildTeamCardViewModel(
    value,
    teamLane,
    teamUnitList,
    roster,
    run,
    () => estimate
  )
  const view = render(
    <ul>
      <TeamCard actions={cardActions} card={card} lane={teamLane} />
    </ul>,
    { wrapper: i18nWrapper(i18n) }
  )
  return { cardActions, card, view }
}

const depthField = () => screen.getByTestId("team-card-depth")
const stepperInput = () =>
  within(depthField()).getByTestId("number-stepper-input")

function renderCard(
  value: LegendaryEventTeam,
  run: 1 | 2 = 1,
  cardActions = actions(),
  lastRunClearedBattle?: number
) {
  const card = buildTeamCardViewModel(
    value,
    teamLane,
    teamUnitList,
    undefined,
    run
  )
  render(
    <ul>
      <TeamCard
        actions={cardActions}
        card={card}
        lane={teamLane}
        lastRunClearedBattle={lastRunClearedBattle}
      />
    </ul>,
    { wrapper: i18nWrapper(i18n) }
  )
  return cardActions
}

describe("buildTeamCardViewModel", () => {
  it("counts the points left over its depth without progress: 7 × (100 + 100 + 30 + 20 + 25) = 1,925", () => {
    const card = buildTeamCardViewModel(
      team(),
      teamLane,
      teamUnitList,
      undefined,
      1
    )
    expect(card.pointsLeft).toBe(1925)
    expect(card.memberCount).toBe(3)
    expect(card.expectedBattleClears).toBe(7)
  })

  it("lets the manual depth win over the estimate", () => {
    const card = buildTeamCardViewModel(
      team(),
      teamLane,
      teamUnitList,
      ownedRoster(team().memberUnitIds),
      1,
      () => estimateOf()
    )
    expect(card.estimate?.depth).toBe(6)
    expect(card.displayedDepth).toBe(7)
    expect(card.lockedMemberCount).toBe(0)
  })

  it("shows the estimate when the run has no manual depth", () => {
    const card = buildTeamCardViewModel(
      team(),
      teamLane,
      teamUnitList,
      ownedRoster(team().memberUnitIds),
      2,
      () => estimateOf()
    )
    expect(card.expectedBattleClears).toBeNull()
    expect(card.displayedDepth).toBe(6)
  })

  it("has no estimate when estimates are unavailable (no estimator)", () => {
    const card = buildTeamCardViewModel(
      team(),
      teamLane,
      teamUnitList,
      ownedRoster(team().memberUnitIds),
      2
    )
    expect(card.estimate).toBeNull()
    expect(card.displayedDepth).toBeNull()
  })

  it("counts the members the roster does not hold, not the reserve", () => {
    const value = team()
    const card = buildTeamCardViewModel(
      value,
      teamLane,
      teamUnitList,
      ownedRoster(value.memberUnitIds.slice(2)),
      1,
      () => estimateOf()
    )
    expect(card.lockedMemberCount).toBe(2)
  })

  it("keeps a stored objective the members no longer derive, muted and out of the points", () => {
    // A and B do not both satisfy No Resilient (2).
    const card = buildTeamCardViewModel(
      team({ objectiveIndexes: [0, 2] }),
      teamLane,
      teamUnitList,
      undefined,
      1
    )
    expect(card.coverage).toEqual([
      { index: 0, derived: true, points: 20, clearedThrough: false },
      { index: 2, derived: false, points: 15, clearedThrough: false },
    ])
    // 7 × (100 + 100 + 30 + 20)
    expect(card.pointsLeft).toBe(1750)
  })

  it("marks an objective cleared through the depth and leaves it out of the points left", () => {
    const model = buildLanePointsModel(teamLane)
    // Melee (id 1) and defeat-all (id 0) cleared at full scores in battles 1–7.
    const progress = buildSyncedLaneProgress(model, {
      encounters: Array.from({ length: 7 }, () => ({
        objectivesCleared: [0, 1],
        highScore: 100,
        encounterPoints: 100,
      })),
    })
    const card = buildTeamCardViewModel(
      team(),
      teamLane,
      teamUnitList,
      undefined,
      1,
      undefined,
      null,
      undefined,
      progress,
      model
    )
    expect(card.coverage.map((entry) => entry.clearedThrough)).toEqual([
      true,
      false,
    ])
    // Min 5 Hits alone: 7 × 25
    expect(card.pointsLeft).toBe(175)
  })

  it("has no points left without a displayed depth", () => {
    const card = buildTeamCardViewModel(
      team(),
      teamLane,
      teamUnitList,
      ownedRoster(team().memberUnitIds),
      2
    )
    expect(card.pointsLeft).toBeNull()
  })

  it("shows only the current run's depth", () => {
    const card = buildTeamCardViewModel(
      team(),
      teamLane,
      teamUnitList,
      undefined,
      2
    )
    expect(card.expectedBattleClears).toBeNull()
  })
})

describe("moveTargets", () => {
  it("hides Move up on the first card and Move down on the last", () => {
    expect(moveTargets(["a", "b", "c"], "a")).toEqual({
      up: null,
      down: ["b", "a", "c"],
    })
    expect(moveTargets(["a", "b", "c"], "c")).toEqual({
      up: ["a", "c", "b"],
      down: null,
    })
  })
})

describe("TeamCard", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("shows a partial team's count, portraits in order, the reserve, chips and points", () => {
    renderCard(team())

    expect(screen.getByTestId("team-card-name")).toHaveTextContent("Melee")
    expect(screen.getByTestId("team-card-count")).toHaveTextContent("3/5")
    expect(screen.getByTestId("legendary-event-team-card")).not.toHaveClass(
      "border-destructive"
    )
    const members = screen.getAllByTestId("team-card-member")
    expect(members.map((member) => member.dataset.unit)).toEqual([
      teamUnits.a.id,
      teamUnits.b.id,
      teamUnits.c.id,
      teamUnits.r.id,
    ])
    expect(members[3]).toHaveAttribute("data-reserve", "true")
    expect(screen.getAllByTestId("team-card-objective")).toHaveLength(2)
    expect(screen.getByTestId("team-card-points")).toHaveTextContent(
      "1,925 points left · battles 1–7"
    )
  })

  it("marks a covered objective already cleared through the depth", () => {
    const model = buildLanePointsModel(teamLane)
    const progress = buildSyncedLaneProgress(model, {
      encounters: Array.from({ length: 7 }, () => ({
        objectivesCleared: [0, 1],
        highScore: 100,
        encounterPoints: 100,
      })),
    })
    const card = buildTeamCardViewModel(
      team(),
      teamLane,
      teamUnitList,
      undefined,
      1,
      undefined,
      null,
      undefined,
      progress,
      model
    )
    render(
      <ul>
        <TeamCard actions={actions()} card={card} lane={teamLane} />
      </ul>,
      { wrapper: i18nWrapper(i18n) }
    )
    const [melee, minHits] = screen.getAllByTestId("team-card-objective")
    expect(melee).toHaveAttribute("data-cleared", "true")
    expect(
      within(melee!).getByText("Already cleared through battle 7")
    ).toHaveClass("sr-only")
    expect(minHits).not.toHaveAttribute("data-cleared")
    expect(screen.getByTestId("team-card-points")).toHaveTextContent(
      "175 points left · battles 1–7"
    )
  })

  it("says the team cannot clear battle 1 at depth 0", () => {
    renderEstimatedCard(team(), estimateOf({ depth: 0 }), { run: 2 })
    expect(screen.getByTestId("team-card-points")).toHaveTextContent(
      "Can't clear battle 1 yet"
    )
  })

  it("shows a plain dash for an incomplete team", () => {
    renderCard(team({ memberUnitIds: [teamUnits.a.id, teamUnits.b.id] }))
    const points = screen.getByTestId("team-card-points")
    expect(points).toHaveTextContent("—")
    expect(points).not.toHaveTextContent("Set depth")
  })

  it("shows a dash with the reason when the team has no depth", () => {
    renderCard(team(), 2)
    const points = screen.getByTestId("team-card-points")
    expect(points).toHaveTextContent("—")
    expect(
      within(points).getByText("Set depth to see points left")
    ).toHaveClass("sr-only")
  })

  it("hides the count badge for a full team", () => {
    renderCard(
      team({
        memberUnitIds: ["a", "b", "c", "d", "e"].map(
          (key) => teamUnits[key as "a"].id
        ),
      })
    )
    expect(screen.queryByTestId("team-card-count")).toBeNull()
  })

  it("shows the stored depth of the current run", () => {
    renderCard(team(), 1)
    expect(screen.getByTestId("team-card-depth-label")).toHaveTextContent(
      "Clear depth"
    )
    expect(
      within(screen.getByTestId("team-card-depth")).getByTestId(
        "number-stepper-input"
      )
    ).toHaveValue(7)
  })

  it("prompts Set depth for a run without a depth and steps from 1", () => {
    vi.useFakeTimers()
    try {
      const cardActions = renderCard(team(), 2)
      expect(screen.getByTestId("team-card-depth-label")).toHaveTextContent(
        "Set depth"
      )
      fireEvent.click(
        within(screen.getByTestId("team-card-depth")).getByTestId(
          "number-stepper-increase"
        )
      )
      act(() => vi.advanceTimersByTime(400))
      expect(cardActions.onDepthChange).toHaveBeenCalledWith(1, NO_ESTIMATE)
    } finally {
      vi.useRealTimers()
    }
  })

  it("sends a run of stepper clicks as one depth change with the final value", () => {
    vi.useFakeTimers()
    try {
      const cardActions = renderCard(team(), 1)
      const stepper = screen.getByTestId("team-card-depth")
      const increase = within(stepper).getByTestId("number-stepper-increase")
      fireEvent.click(increase)
      fireEvent.click(increase)
      fireEvent.click(increase)
      expect(within(stepper).getByTestId("number-stepper-input")).toHaveValue(
        10
      )
      act(() => vi.advanceTimersByTime(399))
      expect(cardActions.onDepthChange).not.toHaveBeenCalled()
      act(() => vi.advanceTimersByTime(1))
      expect(cardActions.onDepthChange).toHaveBeenCalledTimes(1)
      expect(cardActions.onDepthChange).toHaveBeenCalledWith(10, NO_ESTIMATE)
    } finally {
      vi.useRealTimers()
    }
  })

  it("shows the estimate marked estimated with its margin when the run has no manual depth", () => {
    const { cardActions } = renderEstimatedCard(team(), estimateOf(), {
      run: 2,
    })
    expect(stepperInput()).toHaveValue(6)
    expect(depthField()).toHaveAttribute("data-estimated", "true")
    expect(screen.getByTestId("team-card-depth-estimated")).toHaveTextContent(
      "estimated"
    )
    expect(screen.getByTestId("team-card-depth-margin")).toHaveTextContent(
      "21% above battle 6 · 32% short of battle 7"
    )
    expect(screen.getByTestId("team-card-depth-label")).toHaveTextContent(
      "Clear depth"
    )
    expect(screen.queryByTestId("team-card-depth-use-estimate")).toBeNull()
    expect(
      within(depthField()).queryByTestId("number-stepper-clear")
    ).toBeNull()
    expect(cardActions.onDepthChange).not.toHaveBeenCalled()
  })

  it("starts + from the estimate and saves a manual depth with the estimate logged", () => {
    vi.useFakeTimers()
    try {
      const { cardActions } = renderEstimatedCard(team(), estimateOf(), {
        run: 2,
      })
      fireEvent.click(
        within(depthField()).getByTestId("number-stepper-increase")
      )
      expect(stepperInput()).toHaveValue(7)
      expect(depthField()).not.toHaveAttribute("data-estimated")
      act(() => vi.advanceTimersByTime(400))
      expect(cardActions.onDepthChange).toHaveBeenCalledWith(7, {
        estimate: 6,
        fromEstimate: true,
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it("shows the hint and Use estimate beside a manual depth, and restores the estimate", () => {
    vi.useFakeTimers()
    try {
      const manualNine = team({
        runDepths: [
          {
            run: 1,
            expectedBattleClears: 9,
            expectedBattleClearsSource: "manual",
            recordedAt: "2026-10-01T00:00:00Z",
          },
        ],
      })
      const { cardActions } = renderEstimatedCard(manualNine, estimateOf())
      expect(stepperInput()).toHaveValue(9)
      expect(screen.getByTestId("team-card-depth-hint")).toHaveTextContent(
        "estimate ~6"
      )
      fireEvent.click(screen.getByTestId("team-card-depth-use-estimate"))
      expect(stepperInput()).toHaveValue(6)
      expect(depthField()).toHaveAttribute("data-estimated", "true")
      act(() => vi.advanceTimersByTime(400))
      expect(cardActions.onUseEstimate).toHaveBeenCalledWith(6)
      expect(cardActions.onDepthChange).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it("keeps the manual depth when a roster change moves the estimate", () => {
    const { cardActions } = renderEstimatedCard(
      team(),
      estimateOf({ depth: 8 })
    )
    expect(stepperInput()).toHaveValue(7)
    expect(screen.getByTestId("team-card-depth-hint")).toHaveTextContent(
      "estimate ~8"
    )
    expect(cardActions.onDepthChange).not.toHaveBeenCalled()
    expect(cardActions.onUseEstimate).not.toHaveBeenCalled()
  })

  it("carries uncalibrated in the estimated tag's tooltip", () => {
    renderEstimatedCard(team(), estimateOf({ calibrated: false }), { run: 2 })
    expect(screen.getByTestId("team-card-depth-estimated")).toHaveAttribute(
      "title",
      expect.stringContaining("Uncalibrated")
    )
  })

  it("reads Not enough for battle 1 yet for an estimate of 0", () => {
    renderEstimatedCard(
      team(),
      estimateOf({ depth: 0, marginAbovePct: null, shortfallToNextPct: 21 }),
      { run: 2 }
    )
    expect(stepperInput()).toHaveValue(null)
    expect(screen.getByTestId("team-card-depth-margin")).toHaveTextContent(
      "Not enough for battle 1 yet · 21% short of battle 1"
    )
  })

  it("notes the locked members not counted", () => {
    const value = team()
    renderEstimatedCard(value, estimateOf(), {
      run: 2,
      roster: ownedRoster(value.memberUnitIds.slice(1)),
    })
    expect(screen.getByTestId("team-card-depth-locked")).toHaveTextContent(
      "1 locked member not counted"
    )
  })

  it("mutes a chip the members no longer derive", () => {
    renderCard(team({ objectiveIndexes: [0, 2] }))
    const muted = screen
      .getAllByTestId("team-card-objective")
      .filter((chip) => chip.dataset.muted === "true")
    expect(muted).toHaveLength(1)
    expect(muted[0]).toHaveAttribute(
      "title",
      "Not covered by the current members"
    )
  })

  describe("Team power (spec: legendary-event-teams)", () => {
    const renderPower = (power: Partial<TeamCardViewModel>) => {
      const card = {
        ...buildTeamCardViewModel(team(), teamLane, teamUnitList, undefined, 1),
        ...power,
      }
      render(
        <ul>
          <TeamCard actions={actions()} card={card} lane={teamLane} />
        </ul>,
        { wrapper: i18nWrapper(i18n) }
      )
      return screen.getByTestId("team-card-power")
    }

    it("shows the plain sum with digit grouping on the points-left line", () => {
      const power = renderPower({ teamPower: 98895, teamPowerStatus: "ready" })
      expect(power).toHaveTextContent("Team power 98,895")
      expect(power).toHaveAttribute("data-state", "ready")
      // Beside the points left; the line wraps between the two, never inside either (French at
      // 375px).
      const points = screen.getByTestId("team-card-points")
      expect(power.parentElement).toBe(points.parentElement)
      expect(power.parentElement).toHaveClass("flex-wrap", "min-w-0")
      expect(power.parentElement).not.toHaveClass("whitespace-nowrap")
      expect(power).toHaveClass("whitespace-nowrap")
      expect(points).toHaveClass("whitespace-nowrap")
    })

    it("shows a placeholder dash while the power data loads", () => {
      const power = renderPower({
        teamPower: null,
        teamPowerStatus: "pending",
      })
      expect(power).toHaveTextContent("Team power —")
      expect(power).toHaveAttribute("data-state", "pending")
      expect(power).not.toHaveTextContent("Power data unavailable")
    })

    it("shows — with the reason for screen readers when power data is unavailable", () => {
      const power = renderPower({
        teamPower: null,
        teamPowerStatus: "unavailable",
      })
      expect(power).toHaveAttribute("data-state", "unavailable")
      expect(power).toHaveAttribute("title", "Power data unavailable")
      expect(within(power).getByText("—")).toHaveAttribute("aria-hidden")
      expect(within(power).getByText("Power data unavailable")).toHaveClass(
        "sr-only"
      )
      // The rest of the card is unchanged.
      expect(screen.getByTestId("team-card-points")).toHaveTextContent(
        "1,925 points left · battles 1–7"
      )
    })

    it("names the unsynced roster, not the power data, as the reason", () => {
      const power = renderPower({
        teamPower: null,
        teamPowerStatus: "noRoster",
      })
      expect(power).toHaveAttribute("data-state", "noRoster")
      expect(power).toHaveAttribute(
        "title",
        "Sync your roster to see team power"
      )
      expect(power).not.toHaveTextContent("Power data unavailable")
    })
  })

  describe("last run line (spec: legendary-event-teams)", () => {
    it("reads what the same team cleared last run beside the stepper, which keeps this run's depth", () => {
      renderCard(team(), 1, actions(), 3)
      const line = screen.getByTestId("team-card-last-run")
      expect(line).toHaveTextContent("Last run: cleared up to battle 3")
      expect(stepperInput()).toHaveValue(7)
      // Beside the depth stepper: the same row as the stepper.
      expect(line.parentElement).toBe(depthField().parentElement)
      expect(line).toHaveClass("md:basis-auto")
    })

    it("says no battle was cleared rather than battle 0", () => {
      renderCard(team(), 1, actions(), 0)
      expect(screen.getByTestId("team-card-last-run")).toHaveTextContent(
        "Last run: no battle cleared"
      )
    })

    it("shows no line for a team created since the previous run", () => {
      renderCard(team(), 1, actions(), undefined)
      expect(screen.queryByTestId("team-card-last-run")).toBeNull()
    })

    it("wraps under the stepper below 768px", () => {
      renderCard(team(), 1, actions(), 3)
      // A full-width flex item wraps onto its own line under the stepper; md:basis-auto puts it
      // back beside it at 768px and up.
      expect(screen.getByTestId("team-card-last-run")).toHaveClass("basis-full")
    })
  })

  describe("incomplete team (spec: a stored team below three characters is incomplete)", () => {
    // Uthar Alpha's imported team: Incisus and a Blood Angels Intercessor, depth 5 for run 2.
    const uthar = team({
      id: "uthar-short",
      name: "Max 2 Hits · Melee",
      memberUnitIds: ["ultraApothecary", "bloodIntercessor"],
      reserveUnitId: null,
      objectiveIndexes: [2, 3],
      runDepths: [
        {
          run: 2,
          expectedBattleClears: 5,
          expectedBattleClearsSource: "manual",
          recordedAt: "2026-10-01T00:00:00Z",
        },
      ],
    })
    const renderUthar = (value: LegendaryEventTeam) => {
      const cardActions = actions()
      const card = buildTeamCardViewModel(
        value,
        utharEvent.alpha,
        legendaryEventCharacters,
        undefined,
        2,
        () => estimateOf()
      )
      render(
        <ul>
          <TeamCard actions={cardActions} card={card} lane={utharEvent.alpha} />
        </ul>,
        { wrapper: i18nWrapper(i18n) }
      )
      return { card, cardActions }
    }

    it("shows both portraits, 2/5 and the warning, with no depth stepper", () => {
      const { card } = renderUthar(uthar)
      expect(card.incomplete).toBe(true)
      expect(card.estimate).toBeNull()
      expect(card.displayedDepth).toBeNull()
      // The stored depth is kept for when the team is completed.
      expect(card.expectedBattleClears).toBe(5)
      expect(
        screen
          .getAllByTestId("team-card-member")
          .map((member) => member.dataset.unit)
      ).toEqual(["ultraApothecary", "bloodIntercessor"])
      expect(screen.getByTestId("team-card-count")).toHaveTextContent("2/5")
      expect(screen.getByTestId("team-card-incomplete")).toHaveTextContent(
        "Needs at least 3 characters"
      )
      expect(screen.queryByTestId("team-card-depth")).toBeNull()
      expect(screen.queryByTestId("team-card-depth-label")).toBeNull()
    })

    it("keeps Edit and Delete", async () => {
      const { cardActions } = renderUthar(uthar)
      const user = userEvent.setup()
      await user.click(screen.getByTestId("team-card-menu"))
      expect(await screen.findByTestId("team-card-delete")).toBeInTheDocument()
      await user.click(screen.getByTestId("team-card-edit"))
      expect(cardActions.onEdit).toHaveBeenCalledTimes(1)
    })

    it("shows the stored run 2 depth again once a third member is saved", () => {
      const { card } = renderUthar({
        ...uthar,
        memberUnitIds: [...uthar.memberUnitIds, "ultraCalgar"],
      })
      expect(card.incomplete).toBe(false)
      expect(screen.queryByTestId("team-card-incomplete")).toBeNull()
      expect(stepperInput()).toHaveValue(5)
    })
  })
})
