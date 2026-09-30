import { describe, expect, it } from "vitest"
import { battleIdSchema } from "@workspace/game-domain"

import type { DailyRaidGoalViewModel } from "@/features/daily-raids"
import type { RaidDaySchedule } from "@/features/goal-farming"
import { buildPlanDayCells, buildPlanUnitRanges } from "./plan-day-cells"

const b1 = battleIdSchema.parse("B1")
const b2 = battleIdSchema.parse("B2")

const goal = (
  goalId: string,
  priority: number,
  unitId: string
): DailyRaidGoalViewModel => ({
  goalId,
  priority,
  unitId: unitId as never,
  unitType: "Character",
  unitLabel: unitId,
  targetLabel: "",
  goalKind: "Unlock",
})

const goalsById = new Map([
  ["calgar", goal("calgar", 1, "calgar")],
  ["calgar2", goal("calgar2", 2, "calgar")],
  ["tigurius", goal("tigurius", 3, "tigurius")],
])

const entry = (goalId: string, resourceId: string, battleId = b1) => ({
  goalId,
  resourceId: resourceId as never,
  battleId,
  raidsPerformed: 2,
  itemsFarmed: 2,
  energySpent: 12,
  dailyAttempts: 10,
})

const schedule = (
  day: number,
  entries: RaidDaySchedule["entries"]
): RaidDaySchedule => ({
  day,
  entries,
  attemptsUsedByBattle: new Map(),
  energyTotal: 0,
  raidsTotal: 0,
})

const progress = (rows: [string, number, number][]) =>
  new Map(rows.map(([key, owned, target]) => [key, { owned, target }] as const))

const source = (
  attemptsLeft: [typeof b1, number][] = [],
  byDay: [number, [string, number, number][]][] = []
) => ({
  goalsById,
  resourceProgressByDay: new Map(
    byDay.map(([day, rows]) => [day, progress(rows)] as const)
  ),
  attemptsLeftByBattle: new Map(attemptsLeft),
})

describe("buildPlanDayCells", () => {
  it("merges a shared material across goals with summed progress", () => {
    const cells = buildPlanDayCells(
      schedule(2, [entry("tigurius", "seal", b2), entry("calgar", "seal", b1)]),
      source(
        [],
        [
          [
            2,
            [
              ["calgar:seal", 1, 1],
              ["tigurius:seal", 0, 1],
            ],
          ],
        ]
      )
    )

    expect(cells.actionable).toHaveLength(1)
    const [cell] = cells.actionable
    expect(cell).toMatchObject({ owned: 1, target: 2 })
    expect(cell!.units.map((unit) => unit.unitId)).toEqual([
      "calgar",
      "tigurius",
    ])
    expect(cell!.nodes).toEqual([
      { battleId: b2, raidsPerformed: 2 },
      { battleId: b1, raidsPerformed: 2 },
    ])
  })

  it("counts a unit with two goals once and orders cells by priority", () => {
    const cells = buildPlanDayCells(
      schedule(2, [
        entry("tigurius", "late"),
        entry("calgar2", "shared"),
        entry("calgar", "shared"),
      ]),
      source(
        [],
        [
          [
            2,
            [
              ["tigurius:late", 0, 5],
              ["calgar:shared", 0, 3],
              ["calgar2:shared", 0, 4],
            ],
          ],
        ]
      )
    )

    expect(cells.actionable.map((cell) => cell.resourceId)).toEqual([
      "shared",
      "late",
    ])
    expect(cells.actionable[0]!.units).toHaveLength(1)
    expect(cells.actionable[0]).toMatchObject({ owned: 0, target: 7 })
    expect(cells.units.map((unit) => unit.unitId)).toEqual([
      "calgar",
      "tigurius",
    ])
  })

  describe("Raided rule", () => {
    const day1 = schedule(1, [
      entry("calgar", "a", b1),
      entry("calgar", "b", b1),
      entry("calgar", "b", b2),
    ])
    const open = [
      ["calgar:a", 0, 1],
      ["calgar:b", 0, 1],
    ] as [string, number, number][]

    it("moves a Day 1 cell whose every node is exhausted", () => {
      const cells = buildPlanDayCells(
        day1,
        source(
          [
            [b1, 0],
            [b2, 0],
          ],
          [[1, open]]
        )
      )
      expect(cells.raided.map((cell) => cell.resourceId)).toEqual(["a", "b"])
      expect(cells.actionable).toEqual([])
      expect(cells.units).toEqual([])
    })

    it("keeps a partially exhausted or unknown-attempts cell actionable", () => {
      const cells = buildPlanDayCells(
        day1,
        source([[b1, 0]], [[1, open]]) // b2 unknown
      )
      expect(cells.raided.map((cell) => cell.resourceId)).toEqual(["a"])
      expect(cells.actionable.map((cell) => cell.resourceId)).toEqual(["b"])
    })

    it("moves a future-day cell whose need is already met", () => {
      const cells = buildPlanDayCells(
        schedule(4, [entry("calgar", "a")]),
        source([], [[4, [["calgar:a", 12, 12]]]])
      )
      expect(cells.raided).toHaveLength(1)
      expect(cells.actionable).toEqual([])
    })

    it("ignores real attempts on future days", () => {
      const cells = buildPlanDayCells(
        schedule(2, [entry("calgar", "a")]),
        source([[b1, 0]], [[2, [["calgar:a", 0, 1]]]])
      )
      expect(cells.actionable).toHaveLength(1)
    })
  })
})

describe("buildPlanUnitRanges", () => {
  it("reports first/last actionable day per unit beyond the first three days", () => {
    const s = source(
      [],
      [
        [1, [["calgar:a", 0, 1]]],
        [9, [["tigurius:a", 0, 1]]],
        [2, [["tigurius:a", 0, 1]]],
      ]
    )
    const days = [
      buildPlanDayCells(schedule(1, [entry("calgar", "a")]), s),
      buildPlanDayCells(schedule(2, [entry("tigurius", "a")]), s),
      buildPlanDayCells(schedule(9, [entry("tigurius", "a")]), s),
    ]

    expect(
      buildPlanUnitRanges(days).map(({ unit, firstDay, lastDay }) => [
        unit.unitId,
        firstDay,
        lastDay,
      ])
    ).toEqual([
      ["calgar", 1, 1],
      ["tigurius", 2, 9],
    ])
  })

  it("is empty when no cell is actionable", () => {
    expect(
      buildPlanUnitRanges([buildPlanDayCells(schedule(1, []), source())])
    ).toEqual([])
  })
})
