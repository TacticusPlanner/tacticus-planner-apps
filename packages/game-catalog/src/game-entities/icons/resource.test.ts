import { describe, expect, it } from "vitest"

import {
  abilityBadgeIcon,
  forgeBadgeIcon,
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
    expect(abilityBadgeIcon("Epic", "Xenos")).toBe(
      "/game_catalog/badges/xenos-epic.webp"
    )
    expect(forgeBadgeIcon("Mythic")).toBe(
      "/game_catalog/datamines/atlases/ui_forge_badges_mythic.webp"
    )
    expect(orbIcon("Rare")).toBe(
      "/game_catalog/datamines/atlases/ui_hero_ascension_orbs_rare.webp"
    )
    expect(xpBookIcon("Legendary")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_consumable_xp_book_4.webp"
    )
    expect(goldIcon()).toBe("/game_catalog/misc/ui_icon_resource_coin.webp")
    expect(salvageIcon()).toBe(
      "/game_catalog/datamines/atlases/ui_icon_resource_salvage.webp"
    )
    expect(mowComponentIcon("Imperial")).toBe(
      "/game_catalog/datamines/atlases/ui_machines_of_war_tokens_imperial.webp"
    )
    expect(orbAllianceIcon("Chaos")).toBe(
      "/game_catalog/datamines/atlases/ui_hero_ascension_orbs_chaos.webp"
    )
    expect(energyIcon()).toBe("/game_catalog/misc/energy.webp")
    expect(onslaughtTokenIcon()).toBe("/game_catalog/campaigns/Onslaught.webp")
  })
})
