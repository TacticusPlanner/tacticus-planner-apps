import { describe, expect, it } from "vitest"

import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { lysanderBattles } from "@/test/fixtures/lysander-battles"

import {
  battleEnemyCount,
  defaultBattleIndex,
  orderLaneBattles,
  sortedWaves,
} from "./battle-preview"

const lane = (completeFlags: boolean[]) => ({
  status: "synced" as const,
  battles: completeFlags.map((complete) => ({ complete })),
})

describe("defaultBattleIndex", () => {
  it("opens on the first battle that is not complete", () => {
    expect(
      defaultBattleIndex(
        lane([true, true, true, true, true, true, false, false]),
        18
      )
    ).toBe(6)
  })

  it("opens on battle 1 without synced progress", () => {
    expect(defaultBattleIndex(undefined, 18)).toBe(0)
    expect(defaultBattleIndex({ status: "noEvent", battles: [] }, 18)).toBe(0)
    expect(defaultBattleIndex({ status: "noLane", battles: [] }, 18)).toBe(0)
  })

  it("opens on the last battle when every battle is complete", () => {
    expect(defaultBattleIndex(lane(Array(18).fill(true)), 18)).toBe(17)
  })
})

describe("orderLaneBattles", () => {
  it("orders a lane's battles by its battleIds", () => {
    const shuffled = [...lysanderBattles].reverse()
    const alpha = orderLaneBattles(lysanderEvent.alpha.battleIds, shuffled)
    expect(alpha.map((battle) => battle.number)).toEqual(
      Array.from({ length: 18 }, (_, index) => index + 1)
    )
    expect(alpha.every((battle) => battle.track === "alpha")).toBe(true)
  })

  it("skips ids with no served battle", () => {
    expect(
      orderLaneBattles(
        ["astarLysander-alpha-1", "missing"],
        lysanderBattles
      ).map((battle) => battle.id)
    ).toEqual(["astarLysander-alpha-1"])
  })
})

describe("Lysander Alpha battle 1", () => {
  const battle = lysanderBattles.find(
    (candidate) => candidate.id === "astarLysander-alpha-1"
  )!

  it("counts every enemy: 7 + 4 + 5 + 6 + 4 + 6 = 32", () => {
    expect(
      battle.waves.map((wave) =>
        wave.enemies.reduce((sum, enemy) => sum + enemy.count, 0)
      )
    ).toEqual([7, 4, 5, 6, 4, 6])
    expect(battleEnemyCount(battle)).toBe(32)
  })

  it("sorts waves by round", () => {
    const shuffled = { waves: [...battle.waves].reverse() }
    expect(sortedWaves(shuffled).map((wave) => wave.round)).toEqual([
      1, 3, 4, 5, 6, 8,
    ])
  })
})
