import { describe, expect, it } from "vitest"

import {
  abilityBadgeIcon,
  forgeBadgeIcon,
  gameModeTokenIcon,
  goldIcon,
  salvageIcon,
  energyIcon,
  onslaughtTokenIcon,
  mowComponentIcon,
  orbAllianceIcon,
  orbIcon,
  xpBookIcon,
} from "./resource"

describe("goal resource icons", () => {
  it("maps ids to shipped assets", () => {
    expect(
      abilityBadgeIcon("Epic", "Xenos").layers.map((layer) => layer.src)
    ).toEqual([
      "/game_catalog/datamines/atlases/ui_ability_badges_epic.webp",
      "/game_catalog/datamines/atlases/ui_ability_badges_xenos.webp",
    ])
    expect(forgeBadgeIcon("Mythic")).toBe(
      "/game_catalog/datamines/atlases/ui_forge_badges_mythic.webp"
    )
    expect(orbIcon("Rare")).toBe(
      "/game_catalog/datamines/atlases/ui_hero_ascension_orbs_rare.webp"
    )
    expect(xpBookIcon("Legendary")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_consumable_xp_book_4.webp"
    )
    expect(goldIcon()).toBe(
      "/game_catalog/datamines/atlases/ui_icon_resource_coin_small.webp"
    )
    expect(salvageIcon()).toBe(
      "/game_catalog/datamines/atlases/ui_icon_resource_salvage.webp"
    )
    expect(mowComponentIcon("Imperial")).toBe(
      "/game_catalog/datamines/atlases/ui_machines_of_war_tokens_imperial.webp"
    )
    expect(orbAllianceIcon("Chaos")).toBe(
      "/game_catalog/datamines/atlases/ui_hero_ascension_orbs_chaos.webp"
    )
    expect(energyIcon()).toBe(
      "/game_catalog/datamines/atlases/ui_icon_resource_stamina_small.webp"
    )
    expect(onslaughtTokenIcon()).toBe(
      "/game_catalog/curated/campaigns/Onslaught.webp"
    )
  })
})

describe("abilityBadgeIcon", () => {
  it("places the alliance emblem inside the rarity frame's square box", () => {
    for (const rarity of [
      "Common",
      "Uncommon",
      "Rare",
      "Epic",
      "Legendary",
      "Mythic",
    ] as const) {
      const [frame, emblem] = abilityBadgeIcon(rarity, "Chaos").layers
      for (const layer of [frame!, emblem!]) {
        expect(layer.left + layer.width).toBeLessThanOrEqual(100)
        expect(layer.top + layer.height).toBeLessThanOrEqual(100)
      }
      expect(emblem!.left).toBeGreaterThan(frame!.left)
      expect(emblem!.top).toBeGreaterThan(frame!.top)
    }
  })
})

describe("gameModeTokenIcon", () => {
  it("maps each game mode to the game's battle-token sprite", () => {
    expect(gameModeTokenIcon("arena")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_resource_token_battle_pvp.webp"
    )
    expect(gameModeTokenIcon("bombTokens")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_bomb.webp"
    )
  })
})
