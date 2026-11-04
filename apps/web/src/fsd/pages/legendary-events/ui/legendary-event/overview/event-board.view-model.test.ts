import { describe, expect, it, vi } from "vitest"

import {
  eventUnitChipData,
  objectivesSatisfied,
  type LaneProgressView,
  type LegendaryEventRosterUnit,
  type LegendaryEventTeam,
} from "@/entities/legendary-event"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"

import {
  buildEventBoardLane,
  buildEventBoardTable,
  isVisibleLanesValue,
  parseVisibleLanes,
  serializeVisibleLanes,
} from "./event-board.view-model"

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

const units = legendaryEventCharacters as never
const nameOf = (unitId: string) => unitId

const rosterUnit = (
  unitId: string,
  rank: LegendaryEventRosterUnit["rank"]
): LegendaryEventRosterUnit =>
  ({
    unitId,
    rank,
    progressionIndex: "Epic:RedOneStar",
    abilities: [
      { abilityId: "active", level: 30 },
      { abilityId: "passive", level: 25 },
    ],
    appliedUpgradeSlots: [],
    equippedItems: [],
  }) as unknown as LegendaryEventRosterUnit

describe("buildEventBoardTable", () => {
  const byIndex = (index: number) =>
    legendaryEventCharacters.filter(
      (unit) =>
        lane.availableUnitIds.includes(unit.id) &&
        objectivesSatisfied(unit as never, lane).includes(index)
    )
  // Two units named so that name order puts the weaker one first, both reading Calgar's power
  // data (the fixture holds only Ultramarines).
  const [strong, weak] = byIndex(0).sort((a, b) => b.id.localeCompare(a.id))
  const fixture = unitPowerContextFixture()
  const calgar = fixture.characters.get("ultraCalgar")!
  const powerContext = {
    ...fixture,
    characters: new Map([
      ...fixture.characters,
      [strong!.id, calgar],
      [weak!.id, calgar],
    ]),
  }
  const roster = new Map([
    [weak!.id, rosterUnit(weak!.id, "Iron1")],
    [strong!.id, rosterUnit(strong!.id, "Diamond3")],
  ])

  it("lists, per objective, the allowed units satisfying it, strongest owned first", () => {
    const columns = buildEventBoardTable(
      lane,
      units,
      roster,
      powerContext,
      new Set(),
      nameOf
    )
    expect(columns.map((column) => column.objectiveIndexes)).toEqual(
      [...lane.unitsRestrictions]
        .map((objective) => [objective.index])
        .sort((a, b) => a[0]! - b[0]!)
    )
    const first = columns[0]!
    expect(first.units.map((unit) => unit.unitId).sort()).toEqual(
      byIndex(0)
        .map((unit) => unit.id)
        .sort()
    )
    expect(first.ownedCount).toBe(2)
    expect(first.units.slice(0, 2).map((unit) => unit.unitId)).toEqual([
      strong!.id,
      weak!.id,
    ])
    expect(first.units[0]).toMatchObject({
      owned: true,
      rank: "Diamond3",
      activeLevel: 30,
      passiveLevel: 25,
    })
    expect(first.units[2]).toMatchObject({ owned: false })
  })

  it("merges the selected objectives into one leading column", () => {
    const columns = buildEventBoardTable(
      lane,
      units,
      roster,
      null,
      new Set([2, 0]),
      nameOf
    )
    expect(columns[0]!.objectiveIndexes).toEqual([0, 2])
    expect(columns).toHaveLength(lane.unitsRestrictions.length - 1)
    const both = new Set(
      byIndex(0)
        .filter((unit) => byIndex(2).includes(unit))
        .map((unit) => unit.id)
    )
    expect(new Set(columns[0]!.units.map((unit) => unit.unitId))).toEqual(both)
  })

  it("orders by name with ownership unknown when the roster is unavailable", () => {
    const [first] = buildEventBoardTable(
      lane,
      units,
      undefined,
      null,
      new Set(),
      nameOf
    )
    const ids = first!.units.map((unit) => unit.unitId)
    expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)))
    expect(first!.units.every((unit) => unit.owned === undefined)).toBe(true)
    expect(first!.ownedCount).toBe(0)
  })
})

describe("eventUnitChipData", () => {
  it("reads rank, ascension and ability levels from the roster", () => {
    const roster = new Map([["a", rosterUnit("a", "Gold2")]])
    expect(eventUnitChipData("a", roster)).toEqual({
      unitId: "a",
      owned: true,
      rank: "Gold2",
      progression: "Epic:RedOneStar",
      activeLevel: 30,
      passiveLevel: 25,
    })
    expect(eventUnitChipData("b", roster)).toEqual({
      unitId: "b",
      owned: false,
    })
    expect(eventUnitChipData("a", undefined)).toEqual({
      unitId: "a",
      owned: undefined,
    })
  })
})

describe("visible lanes", () => {
  it("round-trips the shown lanes in lane order and rejects an empty set", () => {
    expect(serializeVisibleLanes(["gamma", "alpha"])).toBe("alpha,gamma")
    expect(parseVisibleLanes("gamma,alpha,bogus")).toEqual(["alpha", "gamma"])
    expect(isVisibleLanesValue("beta")).toBe(true)
    expect(isVisibleLanesValue("")).toBe(false)
    expect(isVisibleLanesValue(3)).toBe(false)
  })
})
