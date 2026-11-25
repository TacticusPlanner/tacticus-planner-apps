import { describe, expect, it } from "vitest"

import { projectCompletion } from "./project-card-progress"

const plan = {
  goalDates: new Map([
    ["a", "2026-12-01"],
    ["b", "2026-12-20"],
    ["c", "2026-12-05"],
  ]),
  plannedGoalIds: ["a", "b", "c", "blocked"],
  onslaughtWaitDate: null,
}

describe("projectCompletion", () => {
  it("takes the latest date of the project's goals and counts the undated ones", () => {
    expect(projectCompletion(["a", "c", "blocked"], plan)).toEqual({
      completionDate: "2026-12-05",
      unestimatedGoalCount: 1,
    })
  })

  it("ignores goals the run did not plan", () => {
    expect(projectCompletion(["a", "paused"], plan)).toEqual({
      completionDate: "2026-12-01",
      unestimatedGoalCount: 0,
    })
  })

  it("has no date when nothing can be estimated", () => {
    expect(projectCompletion(["blocked"], plan)).toEqual({
      completionDate: null,
      unestimatedGoalCount: 1,
    })
  })

  it("extends a date by the Onslaught wait but never creates one", () => {
    const waiting = { ...plan, onslaughtWaitDate: "2026-12-10" }
    expect(projectCompletion(["a"], waiting).completionDate).toBe("2026-12-10")
    expect(projectCompletion(["b"], waiting).completionDate).toBe("2026-12-20")
    expect(projectCompletion(["blocked"], waiting).completionDate).toBeNull()
  })
})
