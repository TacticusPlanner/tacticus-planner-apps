import { describe, expect, it } from "vitest"

import {
  eventMissions,
  type BattleEnemies,
  type LegendaryEventMissionRef,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"
import { fixtureCharacter } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"

import { missionOrder, type MissionOrderInput } from "./mission-order"
import type { PlannedToken } from "./token-plan"

const ref = (index: number): LegendaryEventMissionRef => ({
  track: "regular",
  mission: eventMissions(utharEvent, "regular").find(
    (mission) => mission.index === index
  )!,
})

// Uthar regular: 0 any battle (untracked), 2 "Defeat 75 AdMechs".
const ANY_BATTLE = ref(0)
const ADMECH = ref(2)

const token = (fields: Partial<PlannedToken>): PlannedToken => ({
  laneId: "alpha",
  battleIndex: 0,
  teamId: "melee",
  teamName: "Melee",
  clearedIds: [0],
  points: 100,
  runningPoints: 100,
  maybe: false,
  playableNow: true,
  ...fields,
})

const counts = (admech: number) => ({
  waves: 3,
  enemies: admech + 10,
  byFaction: new Map([["AdeptusMechanicus", admech]]),
  byTrait: new Map<string, number>(),
})

const enemies: Record<string, BattleEnemies> = {
  "alpha-0": { factions: new Set(["Necrons"]), traits: new Set() },
  "alpha-1": { factions: new Set(["Necrons"]), traits: new Set() },
  "beta-0": {
    factions: new Set(["AdeptusMechanicus"]),
    traits: new Set(),
    counts: counts(40),
  },
  "beta-1": {
    factions: new Set(["AdeptusMechanicus"]),
    traits: new Set(),
    counts: counts(40),
  },
}

const members: readonly LegendaryEventUnit[] = [fixtureCharacter("astarCyrus")]

function input(
  tokens: PlannedToken[],
  open: LegendaryEventMissionRef[],
  sections: MissionOrderInput["sections"] = [
    { run: 1, start: 0, count: tokens.length },
  ]
): MissionOrderInput {
  return {
    tokens,
    sections,
    missionsOf: () => open,
    membersOf: () => members,
    enemiesOf: (laneId, battleIndex) => enemies[`${laneId}-${battleIndex}`],
  }
}

// Points order: Alpha 1, Alpha 2, Beta 1, Beta 2 (running from 1,000 synced points).
const plan = [
  token({ battleIndex: 0, points: 300, runningPoints: 1300 }),
  token({ battleIndex: 1, points: 280, runningPoints: 1580 }),
  token({ laneId: "beta", battleIndex: 0, points: 200, runningPoints: 1780 }),
  token({ laneId: "beta", battleIndex: 1, points: 150, runningPoints: 1930 }),
]

describe("missionOrder", () => {
  it("moves the run's mission battles first, keeping each lane's order and the run's points", () => {
    const result = missionOrder(input(plan, [ANY_BATTLE, ADMECH]))

    expect(
      result.tokens.map((entry) => `${entry.laneId}${entry.battleIndex + 1}`)
    ).toEqual(["beta1", "beta2", "alpha1", "alpha2"])
    expect(result.tokens.map((entry) => entry.runningPoints)).toEqual([
      1200, 1350, 1650, 1930,
    ])
    expect(result.steps[0]).toEqual([
      expect.objectContaining({ total: 40, needed: 75, completes: false }),
    ])
    expect(result.steps[1]).toEqual([
      expect.objectContaining({ total: 75, needed: 75, completes: true }),
    ])
    expect(result.runs).toEqual([
      {
        run: 1,
        missions: [
          { ref: ADMECH, needed: 75, reached: 75, doneAt: 1, estimate: false },
        ],
        untracked: [ANY_BATTLE],
      },
    ])
  })

  it("keeps points order when no open mission tells the tokens apart", () => {
    const result = missionOrder(input(plan, [ANY_BATTLE]))

    expect(result.tokens).toEqual(plan)
    expect(result.runs[0]!.missions).toEqual([])
  })

  it("reorders only inside each run and reports a run that never finishes a mission", () => {
    const result = missionOrder(
      input(
        plan,
        [ADMECH],
        [
          { run: 1, start: 0, count: 3 },
          { run: 2, start: 3, count: 1 },
        ]
      )
    )

    expect(
      result.tokens.map((entry) => `${entry.laneId}${entry.battleIndex + 1}`)
    ).toEqual(["beta1", "alpha1", "alpha2", "beta2"])
    expect(result.runs.map((entry) => entry.missions[0])).toEqual([
      expect.objectContaining({ reached: 40, doneAt: null }),
      expect.objectContaining({ reached: 40, doneAt: null }),
    ])
  })

  it("keeps each run's supply slots in order", () => {
    const slotted = plan.map((entry, slot) => ({ ...entry, slot }))
    const result = missionOrder(input(slotted, [ADMECH]))

    expect(result.tokens.map((entry) => entry.slot)).toEqual([0, 1, 2, 3])
  })
})
