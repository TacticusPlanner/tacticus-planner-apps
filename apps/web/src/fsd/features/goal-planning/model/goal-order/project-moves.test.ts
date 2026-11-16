import { describe, expect, it } from "vitest"

import {
  moveProjectGoals,
  projectGoalsAlreadyFirst,
  projectInFlightGoalIds,
  projectMoveReferences,
} from "./project-moves"

const ORDER = ["A", "B", "C", "D", "E", "F"]
const GW = ["B", "D"]
const CHAOS = ["C", "E"]

describe("moveProjectGoals before and after a project", () => {
  it("places Chaos Core before GW S29's first goal", () => {
    expect(
      moveProjectGoals(ORDER, CHAOS, { kind: "before", referenceIds: GW })
    ).toEqual(["A", "C", "E", "B", "D", "F"])
  })

  it("places Chaos Core after GW S29's last goal", () => {
    expect(
      moveProjectGoals(ORDER, CHAOS, { kind: "after", referenceIds: GW })
    ).toEqual(["A", "B", "D", "C", "E", "F"])
  })

  it("keeps a goal in both projects where it is", () => {
    // G is in Chaos Core and GW S29: it stays, and C goes before it.
    expect(
      moveProjectGoals(["A", "G", "B", "C"], ["G", "C"], {
        kind: "before",
        referenceIds: ["G", "B"],
      })
    ).toEqual(["A", "C", "G", "B"])
  })

  it("moves nothing against an empty reference", () => {
    expect(
      moveProjectGoals(ORDER, CHAOS, { kind: "after", referenceIds: [] })
    ).toEqual(ORDER)
  })
})

describe("projectMoveReferences", () => {
  const project = (projectId: string, status = "Active") => ({
    projectId,
    name: projectId,
    status,
  })
  const goal = (goalId: string, projectIds: string[], status = "Active") => ({
    goalId,
    status,
    projectIds,
  })

  it("offers live projects with an in-flight goal not shared with the moved one", () => {
    const projects = [
      project("Chaos"),
      project("GW"),
      project("Shared"),
      project("Old", "Archived"),
      project("Empty"),
      project("Done"),
    ]
    const goals = [
      goal("c", ["Chaos"]),
      goal("b", ["GW"], "Paused"),
      goal("s", ["Chaos", "Shared"]),
      goal("o", ["Old"]),
      goal("d", ["Done"], "Completed"),
    ]
    expect(
      projectMoveReferences(projects, "Chaos", goals).map(
        (candidate) => candidate.projectId
      )
    ).toEqual(["GW"])
  })
})

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
