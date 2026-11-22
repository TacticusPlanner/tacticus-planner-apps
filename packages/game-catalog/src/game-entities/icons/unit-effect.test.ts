import { describe, expect, it } from "vitest"

import { medalIcon, milestoneMedalIcon } from "./medal"
import { mowAmmoIcon } from "./resource"
import { statIcon } from "./stat"
import { tileIcon } from "./tile"
import { unitEffectIcon } from "./unit-effect"

describe("status, tile and medal icons", () => {
  it("maps effect names onto the game's own file names", () => {
    expect(unitEffectIcon("pinned")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_uniteffect_supressed_01.webp"
    )
    expect(unitEffectIcon("poisoned")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_uniteffect_poisoned.webp"
    )
  })

  it("returns the tile glyphs", () => {
    expect(tileIcon("fire")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_tile_effect_fire.webp"
    )
    expect(tileIcon("trench")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_trait_tile_trench.webp"
    )
  })

  it("returns the medals, crit and block stats and the MoW ammo", () => {
    expect(medalIcon()).toBe(
      "/game_catalog/datamines/atlases/ui_campaign_medal.webp"
    )
    expect(milestoneMedalIcon("Gold")).toBe(
      "/game_catalog/datamines/fonts/Gold_Medal.webp"
    )
    expect(statIcon("block")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_stat_block_01.webp"
    )
    expect(statIcon("critDamage")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_stat_critdmg_01.webp"
    )
    expect(mowAmmoIcon()).toBe(
      "/game_catalog/datamines/atlases/ui_icon_resource_machines_of_war_ammo_small.webp"
    )
  })
})
