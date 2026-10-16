import { describe, expect, it } from "vitest"

import type { LegendaryEventTeam } from "../model/plan.types"
import { currentLegendaryEventRun, teamDepthForRun } from "./current-run"

describe("currentLegendaryEventRun", () => {
  it("takes the run in progress", () => {
    expect(currentLegendaryEventRun({ currentRun: 2, nextRun: 3 })).toBe(2)
  })

  it("takes the next run between runs (Uthar: run 3)", () => {
    expect(currentLegendaryEventRun({ currentRun: null, nextRun: 3 })).toBe(3)
  })

  it("defaults to run 1 when the run is unknown or every run is over", () => {
    expect(currentLegendaryEventRun({ currentRun: null, nextRun: null })).toBe(
      1
    )
  })
})

describe("teamDepthForRun", () => {
  const team: Pick<LegendaryEventTeam, "runDepths"> = {
    runDepths: [
      {
        run: 1,
        expectedBattleClears: 7,
        expectedBattleClearsSource: "manual",
        recordedAt: "2026-10-01T00:00:00Z",
      },
    ],
  }

  it("returns the run's depth", () => {
    expect(teamDepthForRun(team, 1)?.expectedBattleClears).toBe(7)
  })

  it("returns null for a run without a depth", () => {
    expect(teamDepthForRun(team, 2)).toBeNull()
  })
})
