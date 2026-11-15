import { describe, expect, it } from "vitest"
import type { Rarity, UpgradeId } from "@workspace/game-domain"

import { upgradeRarityGroups } from "./upgrade-rarity-groups"

const id = (value: string) => value as UpgradeId
const rarities: Record<string, Rarity> = {
  chip: "Legendary",
  bolt: "Common",
  gear: "Legendary",
  core: "Epic",
}

describe("upgradeRarityGroups", () => {
  it("groups the unpicked materials by rarity, lowest first, with the range's quantities", () => {
    const groups = upgradeRarityGroups(
      new Map([
        [id("chip"), 45],
        [id("bolt"), 3],
        [id("gear"), 12],
        [id("core"), 0],
      ]),
      [{ upgradeId: "gear" }],
      (upgradeId) => rarities[upgradeId]
    )

    expect(groups).toEqual([
      { rarity: "Common", upgrades: [{ upgradeId: "bolt", quantity: 3 }] },
      { rarity: "Legendary", upgrades: [{ upgradeId: "chip", quantity: 45 }] },
    ])
  })

  it("skips materials with an unknown rarity", () => {
    expect(
      upgradeRarityGroups(new Map([[id("mystery"), 2]]), [], () => undefined)
    ).toEqual([])
  })
})
