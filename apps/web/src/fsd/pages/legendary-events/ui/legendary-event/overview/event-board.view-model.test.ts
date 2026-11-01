import { describe, expect, it, vi } from "vitest"

import type {
  LaneProgressView,
  LegendaryEventTeam,
} from "@/entities/legendary-event"
import { lysanderEvent } from "@/test/fixtures/legendary-events"

import { buildEventBoardLane } from "./event-board.view-model"

// Each test team's member ids name the objectives its members derive ("d0-d2" derives 0 and 2).
vi.mock("@/entities/legendary-event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/legendary-event")>()),
  derivedTeamCoverage: (memberUnitIds: readonly string[]) =>
    (memberUnitIds[0] ?? "")
      .split("-")
      .filter((part) => part.startsWith("d"))
      .map((part) => Number(part.slice(1))),
}))

const lane = lysanderEvent.alpha

const team = (
  id: string,
  derives: string,
  objectiveIndexes: number[]
): LegendaryEventTeam => ({
  id,
  laneId: "alpha",
  name: id,
  sortOrder: 0,
  memberUnitIds: [derives, "b", "c"],
  reserveUnitId: null,
  objectiveIndexes,
  runDepths: [],
})

describe("buildEventBoardLane", () => {
  it("lists every objective in order and counts the teams covering each", () => {
    const board = buildEventBoardLane(
      lane,
      [team("t1", "d0-d2", [0, 2]), team("t2", "d0", [0])],
      [],
      undefined
    )
    const ordered = [...lane.unitsRestrictions].sort(
      (a, b) => a.index - b.index
    )
    expect(board.objectives.map((entry) => entry.objective.index)).toEqual(
      ordered.map((objective) => objective.index)
    )
    const covering = Object.fromEntries(
      board.objectives.map((entry) => [
        entry.objective.index,
        entry.coveringTeams,
      ])
    )
    expect(covering[0]).toBe(2)
    expect(covering[1]).toBe(0)
    expect(covering[2]).toBe(1)
  })

  it("counts a stored objective only while the members still derive it", () => {
    const board = buildEventBoardLane(
      lane,
      [team("t1", "d0", [0, 1])],
      [],
      undefined
    )
    expect(board.teams[0]!.coveredObjectiveIndexes).toEqual([0])
    expect(
      board.objectives.find((entry) => entry.objective.index === 1)!
        .coveringTeams
    ).toBe(0)
  })

  it("does not count a derived objective the team does not store", () => {
    const board = buildEventBoardLane(
      lane,
      [team("t1", "d0-d1", [0])],
      [],
      undefined
    )
    expect(board.teams[0]!.coveredObjectiveIndexes).toEqual([0])
  })

  it("reads cleared counts from synced progress, and none without it", () => {
    const progress = {
      battles: [
        { cleared: [true, true, false, false, false, false] },
        { cleared: [true, true, true, false, false, false] },
      ],
    } as unknown as LaneProgressView
    const withProgress = buildEventBoardLane(lane, [], [], progress)
    expect(withProgress.objectives[0]).toMatchObject({
      cleared: 2,
      battles: 2,
    })
    expect(withProgress.objectives[1]).toMatchObject({ cleared: 1 })

    const without = buildEventBoardLane(lane, [], [], undefined)
    expect(without.objectives[0]).toMatchObject({
      cleared: null,
      battles: lane.battleIds.length,
    })
  })
})
