import { describe, expect, it } from "vitest"
import type { BattleId, UpgradeId } from "@workspace/game-domain"

import {
  buildFarmLocationsByUpgrade,
  planCellAlternatives,
} from "./plan-cell-alternatives"

const battle = (id: string) => id as BattleId
const upgrade = (id: string) => id as UpgradeId

describe("buildFarmLocationsByUpgrade", () => {
  it("indexes each upgrade's distinct farm locations in catalog order", () => {
    const result = buildFarmLocationsByUpgrade([
      {
        id: upgrade("U1"),
        farmLocations: [
          { battleId: battle("B2") },
          { battleId: battle("B1") },
          { battleId: battle("B2") },
        ],
      },
      { id: upgrade("U2"), farmLocations: [] },
    ])

    expect(result.get("U1")).toEqual(["B2", "B1"])
    expect(result.has("U2")).toBe(false)
  })
})

describe("planCellAlternatives", () => {
  const locations = new Map([
    ["U1", [battle("B1"), battle("B2"), battle("B3"), battle("B4")]],
  ])

  it("lists the unplanned locations, raidable ones before locked ones", () => {
    const result = planCellAlternatives(
      {
        resourceId: "U1",
        nodes: [{ battleId: battle("B2"), raidsPerformed: 3 }],
      },
      locations,
      new Set([battle("B2"), battle("B4")])
    )

    expect(result).toEqual([
      { battleId: "B4", locked: false },
      { battleId: "B1", locked: true },
      { battleId: "B3", locked: true },
    ])
  })

  it("returns nothing for a resource without catalog locations", () => {
    expect(
      planCellAlternatives(
        { resourceId: "shards_x", nodes: [] },
        locations,
        new Set()
      )
    ).toEqual([])
  })
})
