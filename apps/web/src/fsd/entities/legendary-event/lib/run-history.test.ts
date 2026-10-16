import { describe, expect, it } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"
import {
  rosterAfterRun1,
  utharRun1Record,
  utharRun2Record,
} from "@/test/fixtures/legendary-event-run-records"

import type { LegendaryEventRunRecord } from "../model/run-record.types"
import type { LegendaryEventRosterUnit } from "../model/types"
import {
  previousRunTeamClears,
  recordHistory,
  recordLaneSummary,
  recordTeamClearedBattle,
  rosterDeltas,
  selectRunRecords,
} from "./run-history"

const roster = rosterAfterRun1 as unknown as LegendaryEventRosterUnit[]
const alphaEncounters = utharRun1Record.lanes.alpha
const run3: LegendaryEventRunRecord = { ...utharRun2Record, id: "r3", run: 3 }

describe("selectRunRecords", () => {
  it("makes the newest record current on an active event in that run", () => {
    expect(
      selectRunRecords([utharRun2Record, utharRun1Record], "active", {
        currentEventRun: 2,
      })
    ).toEqual({
      current: utharRun2Record,
      previous: utharRun1Record,
      earlier: [],
    })
  })

  it("has no current record before the run's first sync", () => {
    expect(
      selectRunRecords([utharRun2Record, utharRun1Record], "active", {
        currentEventRun: 3,
      })
    ).toEqual({
      current: null,
      previous: utharRun2Record,
      earlier: [utharRun1Record],
    })
  })

  it("makes the newest record previous on an event that is not active", () => {
    expect(
      selectRunRecords([run3, utharRun2Record, utharRun1Record], "upcoming", {
        currentEventRun: 3,
      })
    ).toEqual({
      current: null,
      previous: run3,
      earlier: [utharRun2Record, utharRun1Record],
    })
  })

  it("has nothing without records, and no previous on the first recorded run", () => {
    expect(selectRunRecords([], "active", undefined)).toEqual({
      current: null,
      previous: null,
      earlier: [],
    })
    expect(
      selectRunRecords([utharRun1Record], "active", { currentEventRun: 1 })
    ).toEqual({ current: utharRun1Record, previous: null, earlier: [] })
  })
})

describe("recordLaneSummary", () => {
  it("reproduces Uthar Alpha run 1: battle 4; 463 + 322 + 165 + 165 + 24 = 1,139", () => {
    // Each stored high score counts twice: once as the kill score, once as the high score.
    expect(recordLaneSummary(alphaEncounters, utharEvent.alpha)).toEqual({
      clearedBattle: 4,
      points: 1139,
    })
    const encounters = alphaEncounters ?? []
    const perBattle = encounters.map(
      (_, index) =>
        recordLaneSummary(encounters.slice(index, index + 1), {
          ...utharEvent.alpha,
          battleIds: utharEvent.alpha.battleIds.slice(index),
          battlesPoints: utharEvent.alpha.battlesPoints.slice(index),
          defeatAll: utharEvent.alpha.defeatAll.slice(index),
        }).points
    )
    expect(perBattle).toEqual([463, 322, 165, 165, 24])
  })

  it("is 0 / 0 for a null lane", () => {
    expect(recordLaneSummary(null, utharEvent.beta)).toEqual({
      clearedBattle: 0,
      points: 0,
    })
  })

  it("shows the cleared battle but no points on catalog drift", () => {
    const shortLane = {
      ...utharEvent.alpha,
      battleIds: utharEvent.alpha.battleIds.slice(0, 3),
      battlesPoints: utharEvent.alpha.battlesPoints.slice(0, 3),
      defeatAll: utharEvent.alpha.defeatAll.slice(0, 3),
    }
    expect(recordLaneSummary(alphaEncounters, shortLane)).toEqual({
      clearedBattle: 4,
      points: null,
    })
  })
})

describe("recordTeamClearedBattle", () => {
  it("clears Ultras up to battle 2 and Melee up to battle 3", () => {
    expect(
      recordTeamClearedBattle({ objectiveIndexes: [0, 3] }, alphaEncounters)
    ).toBe(2)
    expect(
      recordTeamClearedBattle({ objectiveIndexes: [3] }, alphaEncounters)
    ).toBe(3)
  })

  it("uses the lane's cleared battle for a team without objectives", () => {
    expect(
      recordTeamClearedBattle({ objectiveIndexes: [] }, alphaEncounters)
    ).toBe(4)
  })

  it("maps the previous run's teams by id", () => {
    expect(previousRunTeamClears(utharRun1Record).get("team-melee")).toEqual({
      laneId: "alpha",
      clearedBattle: 3,
    })
    expect(previousRunTeamClears(null).size).toBe(0)
  })
})

describe("rosterDeltas", () => {
  const snapshot = utharRun1Record.rosterSnapshot!

  it("lists Calgar's rank, stars and active ability, but no passive line", () => {
    expect(rosterDeltas(snapshot, roster, ["ultraCalgar"])).toEqual([
      {
        unitId: "ultraCalgar",
        unlocked: false,
        rank: { from: "Diamond1", to: "Diamond3" },
        progression: {
          from: "Legendary:RedFiveStars",
          to: "Legendary:OneBlueStar",
        },
        abilities: [{ slot: 0, abilityId: "CalgarActive", from: 40, to: 45 }],
      },
    ])
  })

  it("marks Tigurius unlocked since the run", () => {
    expect(rosterDeltas(snapshot, roster, ["ultraTigurius"])).toEqual([
      {
        unitId: "ultraTigurius",
        unlocked: true,
        rank: null,
        progression: null,
        abilities: [],
      },
    ])
  })

  it("omits unchanged units, units not owned now, and lower values", () => {
    const lower = [
      {
        unitId: "ultraCalgar",
        rank: "Diamond1",
        progressionIndex: "Legendary:RedFourStars",
        abilities: [{ abilityId: "CalgarActive", level: 30 }],
      },
    ] as unknown as LegendaryEventRosterUnit[]
    expect(
      rosterDeltas(snapshot, lower, ["ultraCalgar", "ultraTitus"])
    ).toEqual([])
  })
})

describe("recordHistory", () => {
  it("builds lanes, teams and deltas for the card", () => {
    const history = recordHistory(utharRun1Record, utharEvent, roster)
    expect(history.run).toBe(1)
    expect(history.teamCount).toBe(2)
    const alpha = history.lanes.find((lane) => lane.laneId === "alpha")!
    expect(alpha).toMatchObject({ clearedBattle: 4, points: 1139 })
    expect(
      alpha.teams.map((team) => [
        team.team.name,
        team.clearedBattle,
        team.plannedDepth,
      ])
    ).toEqual([
      ["Ultras", 2, 6],
      ["Melee", 3, null],
    ])
    expect(history.deltas.kind).toBe("ready")
    expect(
      history.deltas.kind === "ready" &&
        history.deltas.deltas.map((delta) => delta.unitId)
    ).toEqual(["ultraCalgar", "ultraTigurius"])
  })

  it("says why there is no changes list", () => {
    expect(
      recordHistory(
        { ...utharRun1Record, rosterSnapshot: null },
        utharEvent,
        roster
      ).deltas
    ).toEqual({ kind: "noSnapshot" })
    expect(
      recordHistory(utharRun1Record, utharEvent, undefined).deltas
    ).toEqual({
      kind: "noRoster",
    })
    expect(
      recordHistory({ ...utharRun1Record, teams: [] }, utharEvent, roster)
        .deltas
    ).toEqual({ kind: "noTeams" })
  })
})
