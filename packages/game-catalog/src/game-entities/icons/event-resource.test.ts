import { describe, expect, it } from "vitest"

import {
  chestIcon,
  heroReleaseChestIcon,
  heroReleaseCurrencyIcon,
  heroReleaseEventResourceIcon,
  legendaryEventResourceIcon,
  guildRaidChestTier,
} from "./event-resource"

const base = "/game_catalog/datamines"

describe("legendaryEventResourceIcon", () => {
  it("uses the game's event glyphs", () => {
    expect(legendaryEventResourceIcon("points")).toBe(
      `${base}/fonts/lhe_points.webp`
    )
    expect(legendaryEventResourceIcon("tokens")).toBe(
      `${base}/fonts/lhe_tokens.webp`
    )
  })
})

describe("heroReleaseEventResourceIcon", () => {
  it("uses the game's event glyphs", () => {
    expect(heroReleaseEventResourceIcon("points")).toBe(
      `${base}/fonts/hre_points.webp`
    )
    expect(heroReleaseEventResourceIcon("shards")).toBe(
      `${base}/fonts/hre_shards.webp`
    )
  })
})

describe("heroReleaseCurrencyIcon", () => {
  it("picks the featured faction's currency", () => {
    expect(heroReleaseCurrencyIcon("Orks")).toBe(
      `${base}/fonts/Hre_Currency_Orks.webp`
    )
    expect(heroReleaseCurrencyIcon("EmperorsChildren")).toBe(
      `${base}/fonts/Hre_Currency_EmpChi.webp`
    )
  })

  it("is undefined for a faction without a glyph", () => {
    expect(heroReleaseCurrencyIcon("Custodes")).toBeUndefined()
  })
})

describe("heroReleaseChestIcon", () => {
  it("picks the featured faction's chest", () => {
    expect(heroReleaseChestIcon("TheLostAndTheDamned")).toBe(
      `${base}/chests/ui_icon_chest_hre_losta.webp`
    )
  })

  it("falls back to the generic event chest", () => {
    expect(heroReleaseChestIcon("Objects")).toBe(
      `${base}/chests/ui_icon_chest_hre_mythic.webp`
    )
    expect(heroReleaseChestIcon(undefined)).toBe(
      `${base}/chests/ui_icon_chest_hre_mythic.webp`
    )
  })
})

describe("chestIcon", () => {
  it("is the tier's chest", () => {
    expect(chestIcon("diamond")).toBe(
      `${base}/chests/ui_icon_chest_diamond.webp`
    )
  })
})

describe("guildRaidChestTier", () => {
  it("maps a boss rarity to its chest tier", () => {
    expect(guildRaidChestTier("chest_guildboss_defeated_2_legendary")).toBe(
      "diamond"
    )
    expect(guildRaidChestTier("chest_guildboss_defeated_common")).toBe("wood")
    expect(guildRaidChestTier("chest-0")).toBeUndefined()
  })
})
