import { describe, expect, it } from "vitest"

import {
  fixtureCharacter,
  legendaryEventCharacters,
} from "@/test/fixtures/legendary-event-characters"
import { lysanderEvent, utharEvent } from "@/test/fixtures/legendary-events"

import type { LegendaryEventTeam } from "../model/plan.types"
import type {
  LegendaryEventProgress,
  LegendaryEventRosterUnit,
  LegendaryEventUnit,
} from "../model/types"
import { clearEstimateConfig } from "./clear-estimate"
import {
  buildMasterTable,
  filterMasterTableRows,
  sortMasterTable,
  type MasterTableEventInput,
  type MasterTableInput,
} from "./master-table"

const units = legendaryEventCharacters as unknown as LegendaryEventUnit[]
const dante = fixtureCharacter("bloodDante") as unknown as LegendaryEventUnit
const roster: LegendaryEventRosterUnit[] = [
  {
    unitId: "bloodDante",
    rank: "Gold1",
    progressionIndex: "Legendary:RedThreeStars",
  },
] as LegendaryEventRosterUnit[]
const config = clearEstimateConfig(null)

/** Battle powers that make any owned unit clear exactly `depth` battles of 18. */
const powersFor = (depth: number) =>
  Array.from({ length: 18 }, (_, index) => (index < depth ? 0 : 1e15))

const fullyCleared = (battles: number) =>
  Array.from({ length: battles }, () => ({
    objectivesCleared: [0, 1, 2, 3, 4, 5],
    highScore: 0,
    encounterPoints: 0,
  }))

const lysanderProgress = {
  id: "astarLysander",
  currentEventRun: 1,
  alpha: { encounters: fullyCleared(5) },
  beta: null,
  gamma: null,
} as unknown as LegendaryEventProgress

const team = (
  overrides: Partial<LegendaryEventTeam> &
    Pick<LegendaryEventTeam, "id" | "laneId">
): LegendaryEventTeam => ({
  name: overrides.id,
  sortOrder: 0,
  memberUnitIds: [],
  reserveUnitId: null,
  objectiveIndexes: [],
  runDepths: [],
  ...overrides,
})

function table(
  events: MasterTableEventInput[],
  overrides: Partial<MasterTableInput> = {}
) {
  return buildMasterTable({
    events,
    units,
    roster,
    config,
    unitSet: "all",
    pointsMode: "all",
    ...overrides,
  })
}

const danteRow = (result: ReturnType<typeof buildMasterTable>) =>
  result.rows.find((row) => row.unitId === "bloodDante")

describe("buildMasterTable", () => {
  const events = [{ event: lysanderEvent }, { event: utharEvent }]

  it("reproduces Dante across Lysander and Uthar in All mode: 6,534 + 4,608 = 11,142", () => {
    const row = danteRow(table(events))!
    const lysander = row.cells.astarLysander!
    // Alpha 32 + 80 + 40 = 152 × 18; Beta does not allow Imperials; Gamma 31 + 40 + 60 + 80 = 211 × 18.
    expect(lysander.lanes.alpha).toEqual({ points: 152 * 18, depth: null })
    expect(lysander.lanes.beta).toBeUndefined()
    expect(lysander.lanes.gamma).toEqual({ points: 211 * 18, depth: null })
    expect(lysander).toMatchObject({ points: 6534, objectivesCount: 5 })
    // Alpha 34 + 65 + 90 = 189 × 18; Gamma 17 + 50 = 67 × 18.
    const uthar = row.cells.votanUthar!
    expect(uthar.lanes.alpha?.points).toBe(3402)
    expect(uthar.lanes.gamma?.points).toBe(1206)
    expect(uthar).toMatchObject({ points: 4608, objectivesCount: 3 })
    expect(row.total).toBe(11_142)
    expect(row.owned).toBe(true)
    expect(row.rank).toBe("Gold1")
  })

  it("deducts cleared battles in Remaining: Lysander Alpha 152 × 13 = 1,976, total 10,382", () => {
    const row = danteRow(
      table(
        [
          { event: lysanderEvent, progress: lysanderProgress },
          { event: utharEvent },
        ],
        { pointsMode: "remaining" }
      )
    )!
    expect(row.cells.astarLysander!.lanes.alpha?.points).toBe(1976)
    expect(row.cells.astarLysander!.points).toBe(5774)
    expect(row.cells.votanUthar!.points).toBe(4608)
    expect(row.total).toBe(10_382)
  })

  it("equals All in Remaining without a synced entry", () => {
    const remaining = danteRow(table(events, { pointsMode: "remaining" }))!
    expect(remaining.total).toBe(11_142)
  })

  it("counts Estimated within the estimated battles: 304 + 844 + 1,134 + 603 = 2,885", () => {
    const row = danteRow(
      table(
        [
          {
            event: lysanderEvent,
            progress: lysanderProgress,
            battlePowers: { alpha: powersFor(7), gamma: powersFor(4) },
          },
          {
            event: utharEvent,
            battlePowers: { alpha: powersFor(6), gamma: powersFor(9) },
          },
        ],
        { pointsMode: "estimated" }
      )
    )!
    const lysander = row.cells.astarLysander!
    expect(lysander.lanes.alpha).toEqual({ points: 304, depth: 7 })
    expect(lysander.lanes.gamma).toEqual({ points: 844, depth: 4 })
    expect(lysander.points).toBe(1148)
    const uthar = row.cells.votanUthar!
    expect(uthar.lanes.alpha).toEqual({ points: 1134, depth: 6 })
    expect(uthar.lanes.gamma).toEqual({ points: 603, depth: 9 })
    expect(uthar.points).toBe(1737)
    expect(row.total).toBe(2885)
  })

  it("gives a locked unit 0 in every Estimated cell and keeps it in the All set", () => {
    const result = table(
      [{ event: lysanderEvent, battlePowers: { alpha: powersFor(7) } }],
      { pointsMode: "estimated", roster: [] }
    )
    const row = danteRow(result)!
    expect(row.owned).toBe(false)
    expect(row.total).toBe(0)
    expect(row.cells.astarLysander!.lanes.alpha).toEqual({
      points: 0,
      depth: null,
    })
  })

  it("counts only the objectives Dante's teams cover in In teams: (31 + 60 + 80) × 18 = 3,078", () => {
    const plan = {
      teams: [
        team({
          id: "assault",
          laneId: "gamma",
          memberUnitIds: ["bloodDante"],
          // Min 3 Hits (2) and Rapid Assault (4), both still derived by Dante.
          objectiveIndexes: [2, 4],
        }),
      ],
    }
    const result = table([{ event: lysanderEvent, plan }], {
      unitSet: "inTeams",
    })
    expect(result.rows.map((row) => row.unitId)).toEqual(["bloodDante"])
    const cell = danteRow(result)!.cells.astarLysander!
    expect(cell).toMatchObject({
      points: 3078,
      teamCount: 1,
      laneIds: ["gamma"],
    })
    expect(cell.lanes.alpha).toEqual({ points: 0, depth: null })
  })

  it("counts defeat-all only for a reserve-only unit", () => {
    const plan = {
      teams: [
        team({
          id: "assault",
          laneId: "gamma",
          memberUnitIds: ["bloodDante"],
          reserveUnitId: "bloodMephiston",
          objectiveIndexes: [2, 4],
        }),
      ],
    }
    const result = table([{ event: lysanderEvent, plan }], {
      unitSet: "inTeams",
    })
    const reserve = result.rows.find((row) => row.unitId === "bloodMephiston")!
    expect(reserve.cells.astarLysander).toMatchObject({
      points: 31 * 18,
      teamCount: 1,
      laneIds: ["gamma"],
    })
  })

  it("uses the deepest effective depth of the unit's teams in In teams Estimated", () => {
    const plan = {
      teams: [
        team({
          id: "assault",
          laneId: "gamma",
          memberUnitIds: ["bloodDante"],
          objectiveIndexes: [2, 4],
          runDepths: [
            {
              run: 1,
              expectedBattleClears: 3,
              expectedBattleClearsSource: "manual",
              recordedAt: "2026-10-01T00:00:00Z",
            },
          ],
        }),
      ],
    }
    const cell = danteRow(
      table(
        [
          {
            event: lysanderEvent,
            plan,
            battlePowers: { gamma: powersFor(10) },
          },
        ],
        {
          unitSet: "inTeams",
          pointsMode: "estimated",
        }
      )
    )!.cells.astarLysander!
    expect(cell.lanes.gamma).toEqual({ points: 171 * 3, depth: 3 })
  })

  it("lists only owned units in Unlocked", () => {
    const result = table(events, { unitSet: "unlocked" })
    expect(result.rows.map((row) => row.unitId)).toEqual(["bloodDante"])
  })

  it("leaves out units no selected event allows", () => {
    // Every lane Lysander Alpha, which allows only Imperials.
    const imperialOnly = {
      ...lysanderEvent,
      beta: lysanderEvent.alpha,
      gamma: lysanderEvent.alpha,
    }
    const result = table([{ event: imperialOnly }])
    expect(result.rows.map((row) => row.unitId)).not.toContain("tauFarsight")
    expect(result.rows.every((row) => row.total > 0)).toBe(true)
  })

  it("gives each row its own empty cell for an event the unit cannot play", () => {
    const imperialOnly = {
      ...lysanderEvent,
      id: "imperialOnly",
      beta: lysanderEvent.alpha,
      gamma: lysanderEvent.alpha,
    }
    const result = table([{ event: imperialOnly }, { event: utharEvent }])
    const empty = result.rows
      .map((row) => row.cells.imperialOnly!)
      .filter((cell) => Object.keys(cell.lanes).length === 0)
    expect(empty.length).toBeGreaterThan(1)
    expect(empty[0]).toEqual({
      points: 0,
      objectivesCount: 0,
      teamCount: 0,
      laneIds: [],
      lanes: {},
    })
    expect(empty[0]).not.toBe(empty[1])
    expect(empty[0]!.laneIds).not.toBe(empty[1]!.laneIds)
  })
})

describe("sortMasterTable and filterMasterTableRows", () => {
  const result = buildMasterTable({
    events: [{ event: lysanderEvent }, { event: utharEvent }],
    units: [
      dante,
      fixtureCharacter("ultraCalgar") as unknown as LegendaryEventUnit,
    ],
    roster,
    unitSet: "all",
    pointsMode: "all",
  })
  const nameOf = (unitId: string) =>
    unitId === "bloodDante" ? "Dante" : "Calgar"

  it("sorts by one event's points, then the total, then the name", () => {
    const uthar = (unitId: string) =>
      result.rows.find((row) => row.unitId === unitId)!.cells.votanUthar!.points
    const sorted = sortMasterTable(result.rows, "votanUthar", nameOf)
    expect(uthar(sorted[0]!.unitId)).toBeGreaterThanOrEqual(
      uthar(sorted[1]!.unitId)
    )
    const byTotal = sortMasterTable(result.rows, null, nameOf)
    expect(byTotal[0]!.total).toBeGreaterThanOrEqual(byTotal[1]!.total)
  })

  it("breaks ties by name", () => {
    const tied = result.rows.map((row) => ({ ...row, total: 1, cells: {} }))
    expect(
      sortMasterTable(tied, null, nameOf).map((row) => row.unitId)
    ).toEqual(["ultraCalgar", "bloodDante"])
  })

  it("filters by localized name, case-insensitively", () => {
    expect(
      filterMasterTableRows(result.rows, "dan", nameOf).map((row) => row.unitId)
    ).toEqual(["bloodDante"])
    expect(filterMasterTableRows(result.rows, "  ", nameOf)).toHaveLength(2)
  })
})
