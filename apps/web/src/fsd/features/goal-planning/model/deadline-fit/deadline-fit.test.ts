import { describe, expect, it } from "vitest"

import type { EstimateOutcome } from "@/entities/goal-farming"

import {
  computeDeadlineFits,
  deadlineCutoffGoalId,
  deadlineFit,
  deadlineFitSummary,
  deadlineFitTone,
} from "./deadline-fit"

const DEADLINE = Date.parse("2026-11-27T00:00:00Z")

const row = (
  goalId: string,
  status: "Active" | "Paused" | "Completed" = "Active",
  goalType: "Rank" | "Ascension" | "Ability" = "Rank"
) => ({ goalId, status, goalType, entityType: "Character" })

const estimate = (date: string) => ({ date }) as unknown as EstimateOutcome

describe("deadlineFit", () => {
  it("follows the Uthar worked example", () => {
    // Completion instants: Nov 27 00:00, Nov 28 00:00, Dec 11 00:00 UTC.
    expect(deadlineFit("2026-11-26", DEADLINE)).toEqual({
      fits: true,
      date: "2026-11-26",
    })
    expect(deadlineFit("2026-11-27", DEADLINE)).toEqual({
      fits: false,
      daysLate: 1,
      date: "2026-11-27",
    })
    expect(deadlineFit("2026-12-10", DEADLINE)).toEqual({
      fits: false,
      daysLate: 14,
      date: "2026-12-10",
    })
  })

  it("rounds a partial day up", () => {
    const deadlineMidday = Date.parse("2026-11-27T12:00:00Z")
    expect(deadlineFit("2026-11-27", deadlineMidday)).toMatchObject({
      daysLate: 1,
    })
    expect(deadlineFit("2026-11-26", deadlineMidday)).toMatchObject({
      fits: true,
    })
  })

  it("is null for an unparseable date", () => {
    expect(deadlineFit("soon", DEADLINE)).toBeNull()
  })
})

describe("deadlineFitTone", () => {
  it("is on track, caution up to 7 days and urgent beyond", () => {
    expect(deadlineFitTone({ fits: true, date: "" })).toBe("onTrack")
    expect(deadlineFitTone({ fits: false, daysLate: 1, date: "" })).toBe(
      "caution"
    )
    expect(deadlineFitTone({ fits: false, daysLate: 7, date: "" })).toBe(
      "caution"
    )
    expect(deadlineFitTone({ fits: false, daysLate: 8, date: "" })).toBe(
      "urgent"
    )
  })
})

describe("deadline fit summary and cut-off", () => {
  const rows = [
    row("ragnar"),
    row("kharn", "Active", "Ascension"),
    row("calgar"),
    row("abaddon"),
    row("trajann", "Paused", "Ascension"),
  ]
  const estimates = new Map([
    ["ragnar", estimate("2026-11-26")],
    ["kharn", estimate("2026-11-27")],
    ["calgar", estimate("2026-12-10")],
    ["abaddon", estimate("2026-11-01")],
    ["trajann", estimate("2026-11-20")],
  ])
  const reached = new Map([["abaddon", true]])

  it("counts reached as fit and paused as not estimated", () => {
    const fits = computeDeadlineFits(rows, estimates, reached, DEADLINE)
    expect([...fits.keys()]).toEqual(["ragnar", "kharn", "calgar"])
    expect(deadlineFitSummary(rows, fits, reached)).toEqual({
      fit: 2,
      total: 4,
      notEstimated: 1,
      allDone: false,
    })
  })

  it("counts blocked, unestimated and character ability goals as not estimated", () => {
    const more = [
      row("blocked"),
      row("unestimated"),
      row("ability", "Active", "Ability"),
    ]
    const blocked = new Map([
      ["blocked", { status: "Blocked" } as unknown as EstimateOutcome],
      ["ability", estimate("2026-11-01")],
    ])
    const fits = computeDeadlineFits(more, blocked, new Map(), DEADLINE)
    expect(deadlineFitSummary(more, fits, new Map())).toEqual({
      fit: 0,
      total: 0,
      notEstimated: 3,
      allDone: false,
    })
  })

  it("reads all done when every counted goal is reached or completed", () => {
    const done = [row("a", "Completed"), row("b")]
    const fits = computeDeadlineFits(
      done,
      new Map(),
      new Map([["b", true]]),
      DEADLINE
    )
    expect(deadlineFitSummary(done, fits, new Map([["b", true]]))).toEqual({
      fit: 2,
      total: 2,
      notEstimated: 0,
      allDone: true,
    })
  })

  it("places the cut-off before the first goal that misses", () => {
    const fits = computeDeadlineFits(rows, estimates, reached, DEADLINE)
    expect(
      deadlineCutoffGoalId(["abaddon", "ragnar", "kharn", "calgar"], fits)
    ).toBe("kharn")
    expect(deadlineCutoffGoalId(["abaddon", "ragnar"], fits)).toBeNull()
  })
})
