import { describe, expect, it } from "vitest"
import { survivalEventsFixture } from "@workspace/game-catalog/testing"

import { killScoreIndex, waveGroups, waveRows } from "./wave-view"

const december = survivalEventsFixture.find(
  (event) => event.id === "december-2026"
)

describe("waveRows", () => {
  it("puts each medal on the wave that earns it and marks the last wave final", () => {
    if (!december) throw new Error("fixture")
    const rows = waveRows(december)
    expect(rows).toHaveLength(20)
    expect(rows[0]?.medal).toBe("iron")
    expect(rows.find((row) => row.wave.wave === 13)?.medal).toBe("diamond")
    expect(rows.filter((row) => row.final).map((row) => row.wave.wave)).toEqual(
      [20]
    )
    expect(rows.find((row) => row.wave.wave === 16)?.wave.cloneHealthPct).toBe(
      december.waves.find((wave) => wave.wave === 16)?.cloneHealthPct
    )
  })
})

describe("killScoreIndex", () => {
  it("keys each kill score by npc and stats row", () => {
    if (!december) throw new Error("fixture")
    const [first] = december.scoring.killScores
    if (!first) throw new Error("fixture")
    expect(
      killScoreIndex(december).get(`${first.npcId}:${first.statsIndex}`)
    ).toBe(first.score)
  })
})

describe("waveGroups", () => {
  it("starts a group after each wave that raises the rarity cap", () => {
    if (!december) throw new Error("fixture")
    const groups = waveGroups(december)
    expect(
      groups.map((group) => [
        group.rarity,
        group.rows.map((row) => row.wave.wave),
      ])
    ).toEqual([
      ["Common", [1, 2, 3]],
      ["Uncommon", [4, 5]],
      ["Rare", [6, 7]],
      ["Epic", [8, 9, 10]],
      ["Legendary", [11, 12, 13, 14]],
      ["Mythic", [15, 16, 17, 18, 19, 20]],
    ])
  })

  it("totals each enemy across the group's waves", () => {
    if (!december) throw new Error("fixture")
    const [first] = waveGroups(december)
    const spawned = december.waves
      .filter((wave) => wave.wave <= 3)
      .flatMap((wave) => wave.enemies)
      .reduce((sum, enemy) => sum + enemy.count, 0)
    expect(first?.enemies.reduce((sum, enemy) => sum + enemy.count, 0)).toBe(
      spawned
    )
    expect(new Set(first?.enemies.map((enemy) => enemy.npcId)).size).toBe(
      first?.enemies.length
    )
  })

  it("lists the medals and totals the power-ups each group's clears bring", () => {
    if (!december) throw new Error("fixture")
    const groups = waveGroups(december)
    expect(groups.map((group) => group.medals)).toEqual([
      ["iron", "bronze"],
      [],
      ["silver"],
      ["gold"],
      ["platinum", "diamond"],
      [],
    ])
    const [first] = groups
    const granted = december.waves
      .filter((wave) => wave.wave <= 3)
      .flatMap((wave) => wave.powerUpsOnClear)
      .reduce((sum, powerUp) => sum + powerUp.count, 0)
    expect(
      first?.powerUps.reduce((sum, powerUp) => sum + powerUp.count, 0)
    ).toBe(granted)
    const mythic = groups.at(-1)
    expect(
      mythic?.powerUps.find((powerUp) => powerUp.id === "powupReinforcement")
        ?.count
    ).toBe(2)
  })
})
