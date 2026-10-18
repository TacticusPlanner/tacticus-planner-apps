import { describe, expect, it } from "vitest"

import {
  buildLanePointsModel,
  type LegendaryEventTeam,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"

import { buildUpgradeImpactState } from "./upgrade-impact-state"

// Uthar Alpha's imported two-member team: Max 2 Hits and Melee, stored depth 5 for run 2.
const short: LegendaryEventTeam = {
  id: "short",
  laneId: "alpha",
  name: "Max 2 Hits · Melee",
  sortOrder: 0,
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
}

const state = (teams: LegendaryEventTeam[]) =>
  buildUpgradeImpactState({
    teams,
    estimates: {
      battlePowers: [1000, 4000, 30000],
      roster: new Map(),
      config: {
        powerRatio: 0.5,
        calibrated: true,
        hordeMultipliers: new Map(),
        unitPower: unitPowerContextFixture(),
      },
    },
    lane: utharEvent.alpha,
    units: legendaryEventCharacters as unknown as LegendaryEventUnit[],
    run: 2,
    model: buildLanePointsModel(utharEvent.alpha),
    progress: undefined,
    initialRarityOf: () => undefined,
    nameOf: (unitId) => unitId,
  })

describe("buildUpgradeImpactState", () => {
  it("reads a lane whose only team is incomplete as having no team", () => {
    expect(state([short])).toEqual({ kind: "noTeams" })
  })

  it("reads the lane's complete teams", () => {
    expect(
      state([
        short,
        {
          ...short,
          id: "melee",
          memberUnitIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
          objectiveIndexes: [0, 3],
        },
      ]).kind
    ).toBe("ready")
  })
})
