import { describe, expect, it } from "vitest"

import { adjacentBattle, firstOpenBattleIndex } from "./battle-info-target"

describe("firstOpenBattleIndex", () => {
  it("picks the first battle that isn't fully cleared", () => {
    expect(
      firstOpenBattleIndex({
        battles: [
          { index: 0, complete: true },
          { index: 1, complete: false },
          { index: 2, complete: false },
        ],
      } as never)
    ).toBe(1)
  })

  it("falls back to the last battle when all are cleared, the first without progress", () => {
    expect(
      firstOpenBattleIndex({
        battles: [
          { index: 0, complete: true },
          { index: 1, complete: true },
        ],
      } as never)
    ).toBe(1)
    expect(firstOpenBattleIndex(undefined)).toBe(0)
  })
})

describe("adjacentBattle", () => {
  const target = { laneId: "alpha", battleIndex: 0 } as const

  it("steps within the lane", () => {
    expect(adjacentBattle(target, 3, 1)).toStrictEqual({
      laneId: "alpha",
      battleIndex: 1,
    })
  })

  it("stops at either end", () => {
    expect(adjacentBattle(target, 3, -1)).toBeNull()
    expect(adjacentBattle({ ...target, battleIndex: 2 }, 3, 1)).toBeNull()
  })
})
