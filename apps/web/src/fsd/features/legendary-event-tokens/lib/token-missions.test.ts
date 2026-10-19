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
const CHAOS = ref("premium", 1)

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
  "beta-3": { factions: new Set(["AdeptusMechanicus"]), traits: new Set() },
}

function input(
  tokens: PlannedToken[],
  open: LegendaryEventMissionRef[],
  nextIndex = 0
): TokenMissionsInput {
  return {
    plan: { tokens },
    next: { token: tokens[nextIndex]!, index: nextIndex },
    open,
    membersOf: (teamId) => teams[teamId] ?? [],
    enemiesOf: (laneId, battleIndex) => enemies[`${laneId}-${battleIndex}`],
  }
}

describe("nextTokenMissions", () => {
  const alpha3 = token({ teamId: "big", battleIndex: 2, points: 240 })
  const beta4 = token({ laneId: "beta", battleIndex: 3, points: 210 })

  it("offers a playable token progressing more open missions, with the points it gives up", () => {
    const result = nextTokenMissions(
      input([alpha3, beta4], [ANY_BATTLE, ADMECH, NO_BIG_TARGET])
    )
    expect(result.progressed).toEqual([])
    expect(result.alternative).toEqual({
      token: beta4,
      index: 1,
      missions: [ADMECH, NO_BIG_TARGET],
      pointsDifference: -30,
    })
  })

  it("shows no alternative when the Next token already progresses the most", () => {
    const next = token({ laneId: "beta", battleIndex: 3, points: 300 })
    const result = nextTokenMissions(
      input([next, token({ battleIndex: 2 })], [ADMECH, NO_BIG_TARGET])
    )
    expect(result.progressed).toEqual([ADMECH, NO_BIG_TARGET])
    expect(result.alternative).toBeNull()
  })

  it("has nothing to show without open missions", () => {
    expect(nextTokenMissions(input([alpha3, beta4], []))).toEqual({
      progressed: [],
      alternative: null,
    })
  })

  it("never picks a token for any-battle missions alone", () => {
    const result = nextTokenMissions(input([alpha3, beta4], [ANY_BATTLE]))
    expect(result.alternative).toBeNull()
  })

  it("skips tokens the Next token's eligibility rules out", () => {
    const maybe = token({ laneId: "beta", battleIndex: 3, maybe: true })
    const later = token({ laneId: "beta", battleIndex: 3, points: 50 })
    const locked = token({
      laneId: "beta",
      battleIndex: 3,
      playableNow: false,
    })
    expect(
      nextTokenMissions(input([alpha3, maybe, later], [ADMECH])).alternative
    ).toBeNull()
    expect(
      nextTokenMissions(input([alpha3, locked], [ADMECH])).alternative
    ).toBeNull()
  })

  it("breaks a tie on missions by points, then plan order", () => {
    const low = token({ laneId: "beta", battleIndex: 3, points: 150 })
    const high = token({ battleIndex: 5, points: 180 })
    const same = token({ battleIndex: 6, points: 180 })
    const result = nextTokenMissions(
      input([alpha3, low, high, same], [NO_BIG_TARGET, CHAOS])
    )
    expect(result.alternative?.index).toBe(2)
  })
})
