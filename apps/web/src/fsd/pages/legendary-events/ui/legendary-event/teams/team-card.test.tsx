import { useEffect, useState } from "react"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import type {
  ClearEstimate,
  LegendaryEventRosterUnit,
  LegendaryEventTeam,
} from "@/entities/legendary-event"
import {
  teamLane,
  teamUnitList,
  teamUnits,
} from "@/test/fixtures/legendary-event-teams"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"

import { TeamCard } from "./team-card"
import { buildTeamCardViewModel, moveTargets } from "./teams.view-model"

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
  cardActions = actions()
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
      <TeamCard actions={cardActions} card={card} lane={teamLane} />
    </ul>,
    { wrapper: i18nWrapper(i18n) }
  )
  return cardActions
}

describe("buildTeamCardViewModel", () => {
  it("adds the covered objectives to the kill points: 30 + 20 + 25 = 75", () => {
    const card = buildTeamCardViewModel(
      team(),
      teamLane,
      teamUnitList,
      undefined,
      1
    )
    expect(card.pointsPerBattle).toBe(75)
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

  it("has no estimate when the dataset is absent (no estimator)", () => {
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
      { index: 0, derived: true, points: 20 },
      { index: 2, derived: false, points: 15 },
    ])
    expect(card.pointsPerBattle).toBe(50)
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
      "75 points per battle"
    )
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
})
