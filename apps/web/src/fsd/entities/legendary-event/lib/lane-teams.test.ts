import { describe, expect, it } from "vitest"

import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"

import {
  UTHAR_ALPHA_POWERS,
  WORKED_CONFIG,
  rosterOf,
} from "./clear-estimate.fixtures"
import { impactTeams, teamReaches } from "./lane-teams"

const team = {
  id: "melee",
  laneId: "alpha" as const,
  name: "Melee",
  sortOrder: 0,
  memberUnitIds: ["ultraApothecary", "ultraCalgar", "ultraTitus"],
  reserveUnitId: "ultraTigurius",
  // Ultramarines and Melee derive; Resilient (1) no longer does.
  objectiveIndexes: [0, 1, 3],
  runDepths: [
    {
      run: 2 as const,
      expectedBattleClears: 6,
      expectedBattleClearsSource: "manual" as const,
      recordedAt: "2026-10-01T00:00:00Z",
    },
  ],
}

describe("impactTeams / teamReaches", () => {
  it("keeps derived stored objectives and the current run's stored depth", () => {
    const [run1] = impactTeams(
      [team],
      utharEvent.alpha,
      legendaryEventCharacters,
      1
    )
    expect(run1).toEqual({
      id: "melee",
      memberUnitIds: team.memberUnitIds,
      coveredObjectiveIndexes: [0, 3],
      manualDepth: null,
    })
    expect(
      impactTeams([team], utharEvent.alpha, legendaryEventCharacters, 2)[0]
        ?.manualDepth
    ).toBe(6)
  })

  it("reaches the stored depth, else the estimate (26,376 clears 5)", () => {
    const inputs = {
      battlePowers: UTHAR_ALPHA_POWERS,
      roster: rosterOf(team.memberUnitIds),
      config: WORKED_CONFIG,
    }
    const teams = impactTeams(
      [team],
      utharEvent.alpha,
      legendaryEventCharacters,
      1
    )
    expect(teamReaches(teams, inputs)[0]?.depth).toBe(5)
    expect(
      teamReaches([{ ...teams[0]!, manualDepth: 2 }], inputs)[0]?.depth
    ).toBe(2)
  })

  it("leaves out an incomplete team (Uthar's two-member team)", () => {
    const short = {
      ...team,
      id: "short",
      memberUnitIds: ["ultraApothecary", "bloodIntercessor"],
      reserveUnitId: "ultraCalgar",
    }
    expect(
      impactTeams(
        [short, team],
        utharEvent.alpha,
        legendaryEventCharacters,
        2
      ).map((entry) => entry.id)
    ).toEqual(["melee"])
  })
})
