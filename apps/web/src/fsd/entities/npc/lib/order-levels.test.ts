import { describe, expect, it } from "vitest"

import { makhotepRecords, npcRecord, statRow } from "./npc-fixtures"
import { orderLevels } from "./order-levels"

describe("orderLevels", () => {
  it("displays an unsorted served ladder in rank-then-stars order while keeping served indices", () => {
    const boss = makhotepRecords.find((r) => r.id === "necroBossWarden")!

    const levels = orderLevels(boss)

    expect(levels.map((l) => [l.row.rank, l.row.stars])).toEqual([
      [1, 2],
      [2, 2],
      [9, 6],
    ])
    expect(levels.map((l) => l.servedIndex)).toEqual([1, 0, 2])
    expect(levels.every((l) => !l.tie)).toBe(true)
  })

  it("flags every row in a rank/stars tie and keeps their served order", () => {
    const havoc = npcRecord("blackNpc4HavocSurv", "Havoc", {
      stats: [
        statRow(20, 14, 34_594),
        statRow(20, 14, 172_970),
        statRow(20, 14, 1_729_700),
        statRow(17, 11, 5_000),
      ],
    })

    const levels = orderLevels(havoc)

    expect(levels.map((l) => l.servedIndex)).toEqual([3, 0, 1, 2])
    expect(levels.map((l) => l.tie)).toEqual([false, true, true, true])
    expect(levels.slice(1).map((l) => l.row.health)).toEqual([
      34_594, 172_970, 1_729_700,
    ])
  })

  it("does not mutate the served ladder", () => {
    const boss = makhotepRecords.find((r) => r.id === "necroBossWarden")!
    const before = boss.stats.map((s) => s.rank)
    orderLevels(boss)
    expect(boss.stats.map((s) => s.rank)).toEqual(before)
  })
})
