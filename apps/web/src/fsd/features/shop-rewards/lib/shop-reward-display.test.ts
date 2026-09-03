import { describe, expect, it } from "vitest"

import {
  shopRewardDisplay,
  type ShopRewardDisplayContext,
} from "./shop-reward-display"

const ctx: ShopRewardDisplayContext = {
  t: ((key: string, options?: { defaultValue?: string }) =>
    options?.defaultValue ?? key) as unknown as ShopRewardDisplayContext["t"],
  charactersById: new Map([["eldarFarseer", { name: "Farseer" }]]),
  mowsById: new Map([["tauKrootox", { name: "Krootox" }]]),
}

describe("shopRewardDisplay", () => {
  it("resolves a character-shard reward to a portrait + shard label", () => {
    const display = shopRewardDisplay(
      "shards_eldarFarseer",
      "eldarFarseer",
      ctx
    )
    expect(display.kind).toBe("shard")
    expect(display.iconUrl).toContain("RoundPortrait")
    expect(display.iconUrl).toContain("farseer")
    expect(display.label).toBe("shops:reward.shards")
  })

  it("uses the MoW portrait for a MoW mythic-shard reward", () => {
    const display = shopRewardDisplay(
      "mythicShards_tauKrootox",
      "tauKrootox",
      ctx
    )
    expect(display.kind).toBe("mythicShard")
    expect(display.iconUrl).toContain("krootox")
  })

  it("maps an upgrade reward to the upgrade-material icon", () => {
    const display = shopRewardDisplay("upgHpM001", undefined, ctx)
    expect(display.kind).toBe("upgrade")
    expect(display.iconUrl).toContain("ui_icon_upgrade_upgHpM001")
  })

  it("maps a forge-badge reward to the rarity forge-badge asset", () => {
    const display = shopRewardDisplay(
      "itemAscensionResource_Mythic",
      undefined,
      ctx
    )
    expect(display.kind).toBe("forgeBadge")
    expect(display.iconUrl).toBe(
      "/game_catalog/resources/ui_forge_badges_mythic.png"
    )
  })

  it("maps an ascension-orb draft reward to the V1 droptable orb asset", () => {
    const display = shopRewardDisplay(
      "draft_ascensionOrbsLegendary",
      undefined,
      ctx
    )
    expect(display.kind).toBe("orb")
    expect(display.iconUrl).toBe(
      "/game_catalog/resources/ui_icon_droptable_draft_ascensionOrbsLegendary.png"
    )
  })

  it("maps MoW token drafts to the V1 droptable component icon", () => {
    const display = shopRewardDisplay(
      "draft_machinesOfWarTokens",
      undefined,
      ctx
    )
    expect(display.kind).toBe("mowToken")
    expect(display.iconUrl).toBe(
      "/game_catalog/resources/ui_icon_droptable_draft_machinesOfWarToken.png"
    )
  })

  it("maps an ability-token draft to the V1 droptable badge asset", () => {
    const display = shopRewardDisplay(
      "draft_abilityTokensMythic",
      undefined,
      ctx
    )
    expect(display.kind).toBe("abilityBadge")
    expect(display.iconUrl).toBe(
      "/game_catalog/resources/ui_icon_droptable_draft_abilityTokensMythic.png"
    )
  })

  it("maps an XP reward to the rarity XP-book asset", () => {
    const display = shopRewardDisplay("xpLegendary", undefined, ctx)
    expect(display.kind).toBe("xpBook")
    expect(display.iconUrl).toBe(
      "/game_catalog/books/ui_icon_consumable_xp_book_4.png"
    )
  })

  it("maps salvage / mythic salvage rewards to their resource assets", () => {
    expect(shopRewardDisplay("dust", undefined, ctx).iconUrl).toBe(
      "/game_catalog/resources/ui_icon_resource_salvage.png"
    )
    expect(shopRewardDisplay("mythicDust", undefined, ctx).iconUrl).toBe(
      "/game_catalog/resources/ui_icon_resource_mythic_salvage.png"
    )
  })

  it("maps a specific relic reward to the equipment item asset", () => {
    const display = shopRewardDisplay("R_Crit_Vitarus", undefined, ctx)
    expect(display.kind).toBe("equipment")
    expect(display.iconUrl).toBe(
      "/game_catalog/equipment/ui_icon_item_R_Crit_Vitarus.png"
    )
  })

  it("maps a generic equipment pool to its slot-type icon", () => {
    const display = shopRewardDisplay("itemsLegendary_I_Block", undefined, ctx)
    expect(display.kind).toBe("equipment")
    expect(display.iconUrl).toContain("ui_icon_itemtype_block")
  })

  it("gives expedition speed-ups their V1 resource icon", () => {
    const display = shopRewardDisplay("expeditionSpeedUp", undefined, ctx)
    expect(display.iconUrl).toBe(
      "/game_catalog/resources/Resource_ExpeditionSpeedUp.png"
    )
  })

  it("still falls back to a prettified text label for an unknown reward type", () => {
    const display = shopRewardDisplay("someFutureThing_M001", undefined, ctx)
    expect(display.kind).toBe("other")
    expect(display.iconUrl).toBeUndefined()
  })

  it("maps gold to the coin icon", () => {
    const display = shopRewardDisplay("gold", undefined, ctx)
    expect(display.kind).toBe("gold")
    expect(display.iconUrl).toBe("/game_catalog/misc/ui_icon_resource_coin.png")
  })
})
