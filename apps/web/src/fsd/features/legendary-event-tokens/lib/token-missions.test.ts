import { describe, expect, it } from "vitest"

import {
  eventMissions,
  type BattleEnemies,
  type LegendaryEventMissionRef,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"
import { fixtureCharacter } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"

import { nextTokenMissions, type TokenMissionsInput } from "./token-missions"
import type { PlannedToken } from "./token-plan"

const ref = (
  track: "regular" | "premium",
  index: number
): LegendaryEventMissionRef => ({
  track,
  mission: eventMissions(utharEvent, track).find(
    (mission) => mission.index === index
  )!,
})

// Uthar: regular 0 any battle, 2 "Defeat 75 AdMechs"; premium 4 "Win 5 battles without deploying
// any Big Target characters", 1 "Defeat 30 enemies with Chaos units".
const ANY_BATTLE = ref("regular", 0)
const ADMECH = ref("regular", 2)
const NO_BIG_TARGET = ref("premium", 4)

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

const unit = (id: string, traits: string[] = []): LegendaryEventUnit => ({
  ...fixtureCharacter(id),
  traits,
})

const teams: Record<string, readonly LegendaryEventUnit[]> = {
  melee: [unit("astarCyrus"), unit("astarEradicator")],
  big: [unit("astarCyrus", ["BigTarget"])],
}

const enemies: Record<string, BattleEnemies> = {
  "alpha-2": { factions: new Set(["Necrons"]), traits: new Set() },
  "beta-3": {
    factions: new Set(["AdeptusMechanicus"]),
    traits: new Set(),
    counts: {
      waves: 1,
      enemies: 40,
      byFaction: new Map([["AdeptusMechanicus", 40]]),
      byTrait: new Map(),
    },
  },
}

function input(
  tokens: PlannedToken[],
  open: LegendaryEventMissionRef[]
): TokenMissionsInput {
  return {
    next: { token: tokens[0]! },
    open,
    membersOf: (teamId) => teams[teamId] ?? [],
    enemiesOf: (laneId, battleIndex) => enemies[`${laneId}-${battleIndex}`],
  }
}

describe("nextTokenMissions", () => {
  const alpha3 = token({ teamId: "big", battleIndex: 2, points: 240 })
  const beta4 = token({ laneId: "beta", battleIndex: 3, points: 210 })

  it("lists the current missions the Next token progresses, with what it adds", () => {
    expect(
      nextTokenMissions(input([beta4, alpha3], [ADMECH, NO_BIG_TARGET]))
    ).toEqual({
      progressed: [
        { ref: ADMECH, amount: 40, estimate: false },
        { ref: NO_BIG_TARGET, amount: 1, estimate: false },
      ],
    })
  })

  it("counts only each track's current mission and leaves untracked kinds out", () => {
    // "Any battle" is the current regular mission, so AdMechs waits; it is untracked, so only the
    // premium mission counts.
    const result = nextTokenMissions(
      input([beta4], [ANY_BATTLE, ADMECH, NO_BIG_TARGET])
    )
    expect(result.progressed.map((entry) => entry.ref)).toEqual([NO_BIG_TARGET])
  })

  it("has nothing to show without open missions", () => {
    expect(nextTokenMissions(input([alpha3, beta4], []))).toEqual({
      progressed: [],
    })
  })
})
