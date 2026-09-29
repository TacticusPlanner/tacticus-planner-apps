import { describe, expect, it } from "vitest"

import {
  abilityBadgeIcon,
  forgeBadgeIcon,
  goldIcon,
  mowComponentIcon,
  orbIcon,
  xpBookIcon,
} from "./resource"

describe("goal resource icons", () => {
  it("maps ids to shipped assets", () => {
    expect(abilityBadgeIcon("Epic")).toBe(
      "/game_catalog/resources/ui_icon_droptable_draft_abilityTokensEpic.png"
    )
    expect(forgeBadgeIcon("Mythic")).toBe(
      "/game_catalog/resources/ui_forge_badges_mythic.png"
    )
    expect(orbIcon("Rare")).toBe(
      "/game_catalog/resources/ui_hero_ascension_orbs_rare.png"
    )
    expect(xpBookIcon("Legendary")).toBe(
      "/game_catalog/books/ui_icon_consumable_xp_book_4.png"
    )
    expect(goldIcon()).toBe("/game_catalog/misc/ui_icon_resource_coin.png")
    expect(mowComponentIcon()).toBe("/game_catalog/misc/components_generic.png")
  })
})
