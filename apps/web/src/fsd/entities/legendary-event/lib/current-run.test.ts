import { describe, expect, it } from "vitest"

import type { LegendaryEventTeam } from "../model/plan.types"
import { currentLegendaryEventRun, teamDepthForRun } from "./current-run"

describe("currentLegendaryEventRun", () => {
  it("takes the synced run", () => {
    expect(currentLegendaryEventRun({ currentEventRun: 2 })).toBe(2)
  })

  it("defaults to run 1 without a synced entry or run", () => {
    expect(currentLegendaryEventRun(undefined)).toBe(1)
    expect(currentLegendaryEventRun({ currentEventRun: null })).toBe(1)
  })

  it("clamps an out-of-range run", () => {
    expect(currentLegendaryEventRun({ currentEventRun: 7 })).toBe(3)
    expect(currentLegendaryEventRun({ currentEventRun: 0 })).toBe(1)
    expect(currentLegendaryEventRun({ currentEventRun: Number.NaN })).toBe(1)
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
