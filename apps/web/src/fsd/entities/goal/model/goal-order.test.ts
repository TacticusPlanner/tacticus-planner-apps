import { describe, expect, it } from "vitest"

import {
  applyPositionMove,
  goalOrderConflictDetails,
  inFlightInGlobalOrder,
  moveOntoDisplaced,
} from "./goal-order"

const goal = (
  goalId: string,
  globalPriority: number | null,
  status = "Active"
) => ({
  goalId,
  globalPriority,
  status,
})

describe("inFlightInGlobalOrder", () => {
  it("keeps Active and Paused goals in position order and drops terminal ones", () => {
    const ordered = inFlightInGlobalOrder([
      goal("c", 3),
      goal("done", null, "Completed"),
      goal("a", 1),
      goal("b", 2, "Paused"),
      goal("old", null, "Archived"),
    ])

    expect(ordered.map((entry) => entry.goalId)).toEqual(["a", "b", "c"])
  })

  it("puts an unpositioned in-flight goal last instead of dropping it", () => {
    const ordered = inFlightInGlobalOrder([goal("x", null), goal("a", 1)])

    expect(ordered.map((entry) => entry.goalId)).toEqual(["a", "x"])
  })
})

describe("moveOntoDisplaced", () => {
  const order = ["a", "b", "c", "d", "e"]

  it("moves a goal up onto the goal it displaces", () => {
    expect(moveOntoDisplaced(order, "e", "c")).toEqual([
      "a",
      "b",
      "e",
      "c",
      "d",
    ])
  })

  it("moves a goal down onto the goal it displaces", () => {
    expect(moveOntoDisplaced(order, "c", "e")).toEqual([
      "a",
      "b",
      "d",
      "e",
      "c",
    ])
  })

  it("is null for the same goal or an unknown one", () => {
    expect(moveOntoDisplaced(order, "a", "a")).toBeNull()
    expect(moveOntoDisplaced(order, "a", "zzz")).toBeNull()
  })
})

describe("applyPositionMove", () => {
  // A project projection holding A, C, E of the global order A,B,C,D,E.
  const projection = [goal("a", 1), goal("c", 3), goal("e", 5)]

  it("applies an upward move to a partial list by absolute position", () => {
    const moved = applyPositionMove(projection, "e", "c")

    expect(moved.map((entry) => [entry.goalId, entry.globalPriority])).toEqual([
      ["a", 1],
      ["c", 4],
      ["e", 3],
    ])
  })

  it("applies a downward move to a partial list by absolute position", () => {
    const moved = applyPositionMove(projection, "c", "e")

    expect(moved.map((entry) => [entry.goalId, entry.globalPriority])).toEqual([
      ["a", 1],
      ["c", 5],
      ["e", 4],
    ])
  })

  it("matches the id-based move on the complete list", () => {
    const all = ["a", "b", "c", "d", "e"].map((id, index) =>
      goal(id, index + 1)
    )
    const moved = applyPositionMove(all, "e", "c")

    expect(
      [...moved]
        .sort((left, right) => left.globalPriority! - right.globalPriority!)
        .map((entry) => entry.goalId)
    ).toEqual(moveOntoDisplaced(["a", "b", "c", "d", "e"], "e", "c"))
  })

  it("leaves the list alone when a goal is missing or has no position", () => {
    expect(applyPositionMove(projection, "e", "zzz")).toEqual(projection)
    expect(
      applyPositionMove([goal("a", null), goal("b", 2)], "a", "b")
    ).toEqual([goal("a", null), goal("b", 2)])
  })
})

describe("goalOrderConflictDetails", () => {
  it("narrows the structured reorder conflict", () => {
    const body = {
      issueCode: "goalOrderStale",
      message: "The goal order changed since it was loaded.",
      revision: 7,
      goalIds: ["a", "b"],
    }

    expect(goalOrderConflictDetails(body)).toEqual(body)
  })

  it("rejects other errors", () => {
    expect(goalOrderConflictDetails(null)).toBeNull()
    expect(
      goalOrderConflictDetails({ issueCode: "goalRevisionStale" })
    ).toBeNull()
    expect(
      goalOrderConflictDetails({ issueCode: "goalOrderStale", message: "x" })
    ).toBeNull()
  })
})
