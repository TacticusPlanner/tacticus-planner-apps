import { describe, expect, it } from "vitest"

import {
  moveProjectGoals,
  projectGoalsAlreadyFirst,
  projectInFlightGoalIds,
} from "./project-moves"

describe("moveProjectGoals", () => {
  it("places the project's goals first as one block (the spec's worked example)", () => {
    // A (Team Lavi), B (GW S29), C (Chaos Core), D (GW S29), E (Chaos Core), F (Team Lavi)
    expect(
      moveProjectGoals(["A", "B", "C", "D", "E", "F"], ["E", "C"], {
        kind: "top",
      })
    ).toEqual(["C", "E", "A", "B", "D", "F"])
  })

  it("moves a goal shared with another project along with the block", () => {
    // B is in GW S29 and Chaos Core; moving Chaos Core takes it too.
    expect(
      moveProjectGoals(["A", "B", "C"], ["B", "C"], { kind: "top" })
    ).toEqual(["B", "C", "A"])
  })

  it("leaves an already-first block as it is", () => {
    expect(
      moveProjectGoals(["A", "B", "C"], ["A", "B"], { kind: "top" })
    ).toEqual(["A", "B", "C"])
  })

  it("ignores ids that are not in the order", () => {
    expect(moveProjectGoals(["A", "B"], ["B", "Z"], { kind: "top" })).toEqual([
      "B",
      "A",
    ])
  })
})

describe("projectGoalsAlreadyFirst", () => {
  it("is true when the in-flight goals hold positions 1..k", () => {
    expect(
      projectGoalsAlreadyFirst([
        { status: "Active", globalPriority: 2 },
        { status: "Paused", globalPriority: 1 },
        { status: "Completed", globalPriority: null },
      ])
    ).toBe(true)
  })

  it("is false with a gap", () => {
    expect(
      projectGoalsAlreadyFirst([
        { status: "Active", globalPriority: 1 },
        { status: "Active", globalPriority: 3 },
      ])
    ).toBe(false)
  })
})

describe("projectInFlightGoalIds", () => {
  it("keeps Active and Paused goals only", () => {
    expect(
      projectInFlightGoalIds([
        { goalId: "a", status: "Active" },
        { goalId: "p", status: "Paused" },
        { goalId: "c", status: "Completed" },
      ])
    ).toEqual(["a", "p"])
  })
})
