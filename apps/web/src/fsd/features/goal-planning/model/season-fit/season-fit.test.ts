import { describe, expect, it } from "vitest"

import type { EstimateOutcome } from "@/features/goal-farming/@x/goal-planning"

import {
  completionInstantMs,
  computeSeasonFits,
  isSeasonFitEligible,
  isSeasonFitMode,
  seasonCutoffGoalId,
  seasonFitOffset,
} from "./season-fit"
import type { SeasonWindows } from "./season-windows"

// Battle Pass around 2026-10-27 (season-windows.test.ts): deadline Nov 15, then Dec 20, Jan 24.
const BATTLE_PASS: SeasonWindows = {
  seasonNumber: 42,
  boundariesMs: [
    Date.parse("2026-11-15T00:00:00Z"),
    Date.parse("2026-12-20T00:00:00Z"),
    Date.parse("2027-01-24T00:00:00Z"),
  ],
}

function estimated(date: string): EstimateOutcome {
  return { days: 1, date, energyTotal: 0, raidsTotal: 0 }
}

const blocked: EstimateOutcome = {
  status: "Blocked",
  reason: "NoFarmLocation",
  resourceIds: [],
}

function row(
  goalId: string,
  overrides: Partial<{ status: "Active" | "Paused"; goalType: string }> = {}
) {
  return {
    goalId,
    status: overrides.status ?? "Active",
    goalType: (overrides.goalType ?? "Rank") as "Rank",
  }
}

describe("completionInstantMs", () => {
  it("is the start of the day after the inclusive Done By date", () => {
    expect(completionInstantMs("2026-11-14")).toBe(
      Date.parse("2026-11-15T00:00:00Z")
    )
  })

  it("rejects malformed dates", () => {
    expect(completionInstantMs("14/11/2026")).toBeNull()
  })
})

describe("seasonFitOffset", () => {
  it("computes the spec's Battle Pass worked example", () => {
    expect(
      ["2026-11-14", "2026-11-15", "2026-12-25", "2027-02-01"].map((date) =>
        seasonFitOffset(date, BATTLE_PASS)
      )
    ).toEqual([0, 1, 2, 3])
  })

  it("counts past the last known boundary of a short list as later", () => {
    const authoredOnly: SeasonWindows = {
      seasonNumber: undefined,
      boundariesMs: [Date.parse("2026-11-02T05:00:00Z")],
    }

    expect(seasonFitOffset("2026-11-01", authoredOnly)).toBe(0)
    expect(seasonFitOffset("2026-11-05", authoredOnly)).toBe(3)
  })

  it("returns null for an unparseable date", () => {
    expect(seasonFitOffset("soon", BATTLE_PASS)).toBeNull()
  })
})

describe("isSeasonFitEligible", () => {
  const estimate = estimated("2026-11-01")

  it("accepts an Active, unreached, estimated goal", () => {
    expect(isSeasonFitEligible(row("a"), estimate, false)).toBe(true)
  })

  it.each([
    ["an Ability goal", row("a", { goalType: "Ability" }), estimate, false],
    ["a Paused goal", row("a", { status: "Paused" }), estimate, false],
    ["a Reached goal", row("a"), estimate, true],
    ["a Blocked goal", row("a"), blocked, false],
    ["an unestimated goal", row("a"), undefined, false],
  ])("rejects %s", (_label, input, outcome, reached) => {
    expect(isSeasonFitEligible(input, outcome, reached)).toBe(false)
  })
})

describe("computeSeasonFits", () => {
  it("keys each eligible goal's fit and skips the rest", () => {
    const fits = computeSeasonFits(
      [row("a"), row("b", { goalType: "Ability" }), row("c")],
      new Map([
        ["a", estimated("2026-11-10")],
        ["b", estimated("2026-11-10")],
        ["c", estimated("2026-12-01")],
      ]),
      new Map(),
      BATTLE_PASS
    )

    expect([...fits]).toEqual([
      ["a", { offset: 0, date: "2026-11-10" }],
      ["c", { offset: 1, date: "2026-12-01" }],
    ])
  })
})

describe("seasonCutoffGoalId", () => {
  const fits = new Map([
    ["a", { offset: 0 as const, date: "2026-11-01" }],
    ["b", { offset: 0 as const, date: "2026-11-02" }],
    ["c", { offset: 1 as const, date: "2026-11-20" }],
    ["d", { offset: 0 as const, date: "2026-11-03" }],
  ])

  it("is the first goal in display order past the season", () => {
    expect(seasonCutoffGoalId(["a", "b", "c", "d"], fits)).toBe("c")
  })

  it("skips goals without a fit", () => {
    expect(seasonCutoffGoalId(["x", "a", "c"], fits)).toBe("c")
  })

  it("is null when every goal makes the season", () => {
    expect(seasonCutoffGoalId(["a", "b", "d"], fits)).toBeNull()
  })
})

describe("isSeasonFitMode", () => {
  it("accepts the stored values only", () => {
    expect(isSeasonFitMode("guildWar")).toBe(true)
    expect(isSeasonFitMode("Battle Pass Season")).toBe(false)
  })
})
