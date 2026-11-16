import { describe, expect, it } from "vitest"

import type { EstimateOutcome } from "@/entities/goal-farming"

import {
  computeDeadlineFits,
  deadlineCutoffGoalId,
  deadlineFit,
  deadlineFitSummary,
  deadlineFitTone,
  eventEndCutoffGoalId,
} from "./deadline-fit"

const DEADLINE = Date.parse("2026-11-27T00:00:00Z")
/** Uthar's run 3: starts Nov 27 and ends 7 days later, Dec 4. */
const WINDOW = {
  deadlineMs: DEADLINE,
  endMs: Date.parse("2026-12-04T00:00:00Z"),
}

const row = (
  goalId: string,
  status: "Active" | "Paused" | "Completed" = "Active",
  goalType: "Rank" | "Ascension" | "Ability" = "Rank"
) => ({ goalId, status, goalType, entityType: "Character" })

const estimate = (date: string) => ({ date }) as unknown as EstimateOutcome

describe("deadlineFit", () => {
  it("follows the Uthar worked example", () => {
    // Completion instants: Nov 27 00:00, Nov 28 00:00, Dec 4 00:00, Dec 11 00:00 UTC.
    expect(deadlineFit("2026-11-26", WINDOW)).toEqual({
      fits: true,
      date: "2026-11-26",
    })
    expect(deadlineFit("2026-11-27", WINDOW)).toEqual({
      fits: false,
      duringEvent: true,
      date: "2026-11-27",
    })
    expect(deadlineFit("2026-12-03", WINDOW)).toEqual({
      fits: false,
      duringEvent: true,
      date: "2026-12-03",
    })
    expect(deadlineFit("2026-12-10", WINDOW)).toEqual({
      fits: false,
      duringEvent: false,
      daysLate: 7,
      date: "2026-12-10",
    })
  })

  it("counts the days late from the run's end and rounds a partial day up", () => {
    const midday = {
      deadlineMs: Date.parse("2026-11-27T12:00:00Z"),
      endMs: Date.parse("2026-12-04T12:00:00Z"),
    }
    expect(deadlineFit("2026-12-04", midday)).toMatchObject({
      duringEvent: false,
      daysLate: 1,
    })
    expect(deadlineFit("2026-12-03", midday)).toMatchObject({
      duringEvent: true,
    })
    expect(deadlineFit("2026-11-26", midday)).toMatchObject({
      fits: true,
    })
  })

  it("is null for an unparseable date", () => {
    expect(deadlineFit("soon", WINDOW)).toBeNull()
  })
})

describe("deadlineFitTone", () => {
  it("is on track before the start, caution during the run and urgent after it", () => {
    expect(deadlineFitTone({ fits: true, date: "" })).toBe("onTrack")
    expect(deadlineFitTone({ fits: false, duringEvent: true, date: "" })).toBe(
      "caution"
    )
    expect(
      deadlineFitTone({
        fits: false,
        duringEvent: false,
        daysLate: 1,
        date: "",
      })
    ).toBe("urgent")
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
    const fits = computeDeadlineFits(rows, estimates, reached, WINDOW)
    expect([...fits.keys()]).toEqual(["ragnar", "kharn", "calgar"])
    expect(deadlineFitSummary(rows, fits, reached)).toEqual({
      fit: 2,
      duringEvent: 1,
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
    const fits = computeDeadlineFits(more, blocked, new Map(), WINDOW)
    expect(deadlineFitSummary(more, fits, new Map())).toEqual({
      fit: 0,
      duringEvent: 0,
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
      WINDOW
    )
    expect(deadlineFitSummary(done, fits, new Map([["b", true]]))).toEqual({
      fit: 2,
      duringEvent: 0,
      total: 2,
      notEstimated: 0,
      allDone: true,
    })
  })

  it("places the cut-off before the first goal that misses", () => {
    const fits = computeDeadlineFits(rows, estimates, reached, WINDOW)
    expect(
      deadlineCutoffGoalId(["abaddon", "ragnar", "kharn", "calgar"], fits)
    ).toBe("kharn")
    expect(deadlineCutoffGoalId(["abaddon", "ragnar"], fits)).toBeNull()
  })

  it("places the end cut-off before the first goal that finishes after the run", () => {
    const fits = computeDeadlineFits(rows, estimates, reached, WINDOW)
    expect(
      eventEndCutoffGoalId(["abaddon", "ragnar", "kharn", "calgar"], fits)
    ).toBe("calgar")
    expect(eventEndCutoffGoalId(["ragnar", "kharn"], fits)).toBeNull()
  })
})
