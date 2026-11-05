import { describe, expect, it } from "vitest"

import type { EstimateOutcome } from "@/features/goal-farming"
import {
  goalCheckpointsView,
  parseCheckpointTarget,
} from "./goal-checkpoints-view"

const estimated = (
  checkpoints: { target: string; days: number }[]
): EstimateOutcome => ({
  status: "Estimated",
  days: 3,
  date: "2026-01-03",
  energyTotal: 50,
  raidsTotal: 5,
  checkpoints: checkpoints.map((checkpoint) => ({
    ...checkpoint,
    date: "2026-01-01",
    energy: 10,
  })),
})

describe("parseCheckpointTarget", () => {
  it("names a Rank checkpoint by its rank", () => {
    expect(parseCheckpointTarget("0", "Rank")).toEqual({
      kind: "Rank",
      rank: "Stone1",
    })
  })

  it("names a MoW Ability checkpoint by its track and level", () => {
    expect(parseCheckpointTarget("secondary:35", "Ability")).toEqual({
      kind: "Ability",
      track: "secondary",
      level: 35,
    })
  })

  it("returns null for a target it cannot read", () => {
    expect(parseCheckpointTarget("final", "Rank")).toBeNull()
    expect(parseCheckpointTarget("35", "Ability")).toBeNull()
  })
})

describe("goalCheckpointsView", () => {
  it("lists every checkpoint and picks the first one still to farm as next", () => {
    const view = goalCheckpointsView(
      estimated([
        { target: "7", days: 0 },
        { target: "8", days: 2 },
        { target: "9", days: 3 },
      ]),
      "Rank"
    )

    expect(view?.rows.map((row) => row.target)).toEqual(["7", "8", "9"])
    expect(view?.next?.target).toBe("8")
  })

  it("has no next checkpoint once inventory covers them all", () => {
    const view = goalCheckpointsView(
      estimated([
        { target: "7", days: 0 },
        { target: "8", days: 0 },
      ]),
      "Rank"
    )

    expect(view?.next).toBeNull()
  })

  it("shows nothing for a single checkpoint, a blocked goal or no estimate", () => {
    expect(
      goalCheckpointsView(estimated([{ target: "9", days: 1 }]), "Rank")
    ).toBeNull()
    expect(goalCheckpointsView(estimated([]), "Rank")).toBeNull()
    expect(
      goalCheckpointsView(
        { status: "Blocked", reason: "NoFarmLocation", resourceIds: [] },
        "Rank"
      )
    ).toBeNull()
    expect(goalCheckpointsView(undefined, "Rank")).toBeNull()
  })
})
