import { describe, expect, it } from "vitest"
import { survivalEventsFixture } from "@workspace/game-catalog/testing"

import { killScoreIndex, waveRows } from "./wave-view"

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
