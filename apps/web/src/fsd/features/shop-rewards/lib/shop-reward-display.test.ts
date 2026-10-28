import { describe, expect, it } from "vitest"

import {
  shopRewardDisplay,
  type ShopRewardDisplayContext,
} from "./shop-reward-display"

const ctx: ShopRewardDisplayContext = {
  t: ((key: string, options?: Record<string, string>) =>
    key === "shops:reward.generic"
      ? options?.name
      : (options?.defaultValue ??
        key)) as unknown as ShopRewardDisplayContext["t"],
  charactersById: new Map([["eldarFarseer", { name: "Farseer" }]]),
  mowsById: new Map([["tauKrootox", { name: "Krootox" }]]),
  equipmentById: new Map([["I_Crit_C001", { name: "Combat Knife" }]]),
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
      "/game_catalog/datamines/atlases/ui_forge_badges_mythic.webp"
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
      "/game_catalog/datamines/droptables/ui_icon_droptable_draft_ascensionOrbsLegendary.webp"
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
      "/game_catalog/datamines/droptables/ui_icon_droptable_draft_machinesOfWarToken.webp"
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
      "/game_catalog/datamines/droptables/ui_icon_droptable_draft_abilityTokensMythic.webp"
    )
  })

  it("maps an XP reward to the rarity XP-book asset", () => {
    const display = shopRewardDisplay("xpLegendary", undefined, ctx)
    expect(display.kind).toBe("xpBook")
    expect(display.iconUrl).toBe(
      "/game_catalog/datamines/atlases/ui_icon_consumable_xp_book_4.webp"
    )
  })

  it("maps salvage / mythic salvage rewards to their resource assets", () => {
    expect(shopRewardDisplay("dust", undefined, ctx).iconUrl).toBe(
      "/game_catalog/datamines/atlases/ui_icon_resource_salvage.webp"
    )
    expect(shopRewardDisplay("mythicDust", undefined, ctx).iconUrl).toBe(
      "/game_catalog/datamines/atlases/ui_icon_resource_mythic_salvage.webp"
    )
  })

  it("maps a specific relic reward to the equipment item asset", () => {
    const display = shopRewardDisplay("R_Crit_Vitarus", undefined, ctx)
    expect(display.kind).toBe("equipment")
    expect(display.iconUrl).toBe(
      "/game_catalog/datamines/items/ui_icon_item_R_Crit_Vitarus.webp"
    )
  })

  it("uses the locale name for a specific equipment item", () => {
    const localized: ShopRewardDisplayContext = {
      ...ctx,
      t: ((key: string, options?: Record<string, string>) =>
        key === "equipmentItems:I_Crit_C001"
          ? "Kampfmesser"
          : key === "shops:reward.generic"
            ? options?.name
            : key) as unknown as ShopRewardDisplayContext["t"],
    }
    expect(shopRewardDisplay("I_Crit_C001", undefined, localized).label).toBe(
      "Kampfmesser"
    )
  })

  it("falls back to the catalog English name, then a readable id", () => {
    expect(shopRewardDisplay("I_Crit_C001", undefined, ctx).label).toBe(
      "Combat Knife"
    )
    expect(shopRewardDisplay("I_Crit_Z999", undefined, ctx).label).toBe(
      "I Crit Z999"
    )
  })

  it("keeps the generic pool label for an equipment pool", () => {
    const display = shopRewardDisplay("itemsLegendary_I_Block", undefined, ctx)
    expect(display.label).toBe("shops:reward.equipmentPool")
  })

  it("maps a generic equipment pool to the game's pool art", () => {
    const display = shopRewardDisplay("itemsLegendary_I_Block", undefined, ctx)
    expect(display.kind).toBe("equipment")
    expect(display.iconUrl).toContain(
      "droptables/ui_icon_droptable_itemsLegendary_I_Block.webp"
    )
  })

  it("maps an alliance item crate to the rarity crate", () => {
    const display = shopRewardDisplay("itemsChaosEpic", undefined, ctx)
    expect(display.kind).toBe("equipment")
    expect(display.iconUrl).toContain("ui_icon_droptable_item_epic.webp")
  })

  it("layers an alliance ability badge and maps an alliance orb", () => {
    const badge = shopRewardDisplay(
      "abilityTokenLegendary_Imperial",
      undefined,
      ctx
    )
    expect(badge.kind).toBe("abilityBadge")
    expect(badge.iconUrl).toMatchObject({ layers: expect.any(Array) })
    const orb = shopRewardDisplay(
      "heroAscensionOrbEpic_Imperial",
      undefined,
      ctx
    )
    expect(orb.kind).toBe("orb")
    expect(orb.iconUrl).toContain("ui_hero_ascension_orbs_epic.webp")
  })

  it("maps shard pools, seasonal currency and event resources", () => {
    expect(shopRewardDisplay("ShardsOrks", undefined, ctx).iconUrl).toContain(
      "HeroShard_Orks_Medium"
    )
    expect(shopRewardDisplay("ShardsAll", undefined, ctx).iconUrl).toContain(
      "HeroShard_Generic_Medium"
    )
    expect(
      shopRewardDisplay("seasonalEventCurrencyMarch2026", undefined, ctx)
        .iconUrl
    ).toContain("liveevents/ui_icon_resource_event_currency.webp")
    expect(shopRewardDisplay("crusadeBomb", undefined, ctx).iconUrl).toContain(
      "fonts/Resource_CrusadeBomb.webp"
    )
    expect(shopRewardDisplay("stamina", undefined, ctx).iconUrl).toContain(
      "ui_icon_resource_stamina_small"
    )
    expect(
      shopRewardDisplay("eventSummoningToken_Orks", undefined, ctx).iconUrl
    ).toContain("ui_icon_resource_summoning_token")
  })

  it("gives expedition speed-ups their V1 resource icon", () => {
    const display = shopRewardDisplay("expeditionSpeedUp", undefined, ctx)
    expect(display.iconUrl).toBe(
      "/game_catalog/datamines/fonts/Resource_ExpeditionSpeedUp.webp"
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
    expect(display.iconUrl).toBe(
      "/game_catalog/datamines/atlases/ui_icon_resource_coin_small.webp"
    )
  })
})
