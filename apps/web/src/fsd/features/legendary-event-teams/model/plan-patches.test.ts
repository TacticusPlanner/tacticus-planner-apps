import { describe, expect, it } from "vitest"

import type {
  LegendaryEventPlan,
  LegendaryEventTeam,
} from "@/entities/legendary-event"

import {
  teamUpdateRequest,
  withLaneOrder,
  withTeamDepth,
  withoutTeam,
} from "./plan-patches"

const team = (
  id: string,
  laneId: LegendaryEventTeam["laneId"],
  sortOrder: number
): LegendaryEventTeam => ({
  id,
  laneId,
  name: id,
  sortOrder,
  memberUnitIds: ["u1"],
  reserveUnitId: null,
  objectiveIndexes: [],
  runDepths: [
    {
      run: 1,
      expectedBattleClears: 7,
      expectedBattleClearsSource: "estimate",
      recordedAt: "2026-10-01T00:00:00Z",
    },
  ],
})

const plan: LegendaryEventPlan = {
  eventId: "e",
  revision: 1,
  catalogVersion: "1",
  notes: null,
  showPaidOptions: false,
  teams: [
    team("a", "alpha", 0),
    team("b", "alpha", 1),
    team("c", "alpha", 2),
    team("x", "beta", 0),
  ],
}

const orderOf = (value: LegendaryEventPlan) =>
  value.teams.map((entry) => `${entry.id}:${entry.sortOrder}`)

describe("plan patches", () => {
  it("reorders one lane densely and leaves the others", () => {
    expect(orderOf(withLaneOrder(plan, "alpha", ["c", "a", "b"]))).toEqual([
      "c:0",
      "a:1",
      "b:2",
      "x:0",
    ])
  })

  it("re-densifies the lane after a delete", () => {
    expect(orderOf(withoutTeam(plan, "b"))).toEqual(["a:0", "c:1", "x:0"])
  })

  it("sets one run's depth as manual and removes it with null", () => {
    const set = withTeamDepth(plan, "a", 2, 9, "now")
    expect(set.teams[0]!.runDepths.map((entry) => entry.run)).toEqual([1, 2])
    const cleared = withTeamDepth(set, "a", 1, null, "now")
    expect(cleared.teams[0]!.runDepths).toEqual([
      expect.objectContaining({ run: 2, expectedBattleClears: 9 }),
    ])
  })

  it("keeps an unchanged depth's source and marks a changed or cleared one", () => {
    const stored = plan.teams[0]!
    const draft = {
      name: "  a  ",
      memberUnitIds: ["u1"],
      reserveUnitId: null,
      objectiveIndexes: [3, 1],
      expectedBattleClears: 7,
    }
    expect(teamUpdateRequest(draft, 1, 4, stored)).toMatchObject({
      name: "a",
      objectiveIndexes: [1, 3],
      expectedBattleClearsSource: "estimate",
    })
    expect(
      teamUpdateRequest({ ...draft, expectedBattleClears: 8 }, 1, 4, stored)
    ).toMatchObject({ expectedBattleClearsSource: "manual" })
    expect(
      teamUpdateRequest({ ...draft, expectedBattleClears: null }, 1, 4, stored)
    ).toMatchObject({
      expectedBattleClears: null,
      expectedBattleClearsSource: null,
    })
  })
})
