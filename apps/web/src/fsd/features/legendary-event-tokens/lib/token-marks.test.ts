import { describe, expect, it } from "vitest"

import { tokenMarkIds, tokenMarkOutcome } from "./token-marks"

describe("tokenMarkIds", () => {
  it("marks every cleared cell Stop here", () => {
    expect(tokenMarkIds([0, 1, 4], "stopHere")).toEqual([0, 1, 4])
  })

  it("marks only the objective cells Maybe clear", () => {
    expect(tokenMarkIds([0, 1, 4], "maybeClear")).toEqual([1, 4])
  })

  it("marks defeat-all Maybe clear when the token clears no objective", () => {
    expect(tokenMarkIds([0], "maybeClear")).toEqual([0])
  })
})

describe("tokenMarkOutcome", () => {
  const teams = [
    { id: "melee", laneId: "alpha" },
    { id: "ranged", laneId: "alpha" },
    { id: "psykers", laneId: "beta" },
  ]
  const depths: Record<string, number | null> = {
    melee: 8,
    ranged: 9,
    psykers: 12,
  }
  const outcome = (
    teamId: string,
    battleIndex: number,
    depthOf = (id: string) => depths[id] ?? null
  ) =>
    tokenMarkOutcome({ teamId, laneId: "alpha", battleIndex, teams, depthOf })

  it("drops the team to the battles before and leaves the cells to a team that reaches it", () => {
    // Melee fell short on battle 6; Ranged reaches battle 9.
    expect(outcome("melee", 5)).toEqual({ depth: 5, markCells: false })
  })

  it("marks the cells too when no other team of the lane reaches the battle", () => {
    // Battle 10: Ranged stops at 9 and Psykers are in another lane.
    expect(outcome("melee", 9)).toEqual({ depth: 9, markCells: true })
    expect(outcome("melee", 5, () => null)).toEqual({
      depth: 5,
      markCells: true,
    })
  })

  it("only marks the cells on battle 1, where no depth fits", () => {
    expect(outcome("melee", 0)).toEqual({ depth: null, markCells: true })
  })
})
