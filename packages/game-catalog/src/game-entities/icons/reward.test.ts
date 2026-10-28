import { describe, expect, it } from "vitest"

import {
  equipmentPoolIcon,
  heroShardPoolIcon,
  isResourceGlyph,
  itemPoolIcon,
  resourceGlyphIcon,
  seasonalEventCurrencyIcon,
} from "./reward"

const base = "/game_catalog/datamines"

describe("seasonalEventCurrencyIcon", () => {
  it("uses the season's own art, else the generic event currency", () => {
    expect(seasonalEventCurrencyIcon("seasonalEventCurrencyApril2026")).toBe(
      `${base}/liveevents/ui_icon_resource_event_currency_april_2026.webp`
    )
    expect(seasonalEventCurrencyIcon("seasonalEventCurrencyJune2026")).toBe(
      `${base}/fonts/SE_Currency_june_26.webp`
    )
    expect(seasonalEventCurrencyIcon("seasonalEventCurrencyMarch2026")).toBe(
      `${base}/liveevents/ui_icon_resource_event_currency.webp`
    )
  })
})

describe("pool icons", () => {
  it("maps a rarity item crate", () => {
    expect(itemPoolIcon("Epic")).toBe(
      `${base}/droptables/ui_icon_droptable_item_epic.webp`
    )
  })

  it("maps an equipment pool, and nothing for an unknown slot", () => {
    expect(equipmentPoolIcon("Legendary", "I_Block")).toBe(
      `${base}/droptables/ui_icon_droptable_itemsLegendary_I_Block.webp`
    )
    expect(equipmentPoolIcon("Legendary", "I_Unknown")).toBeUndefined()
  })

  it("maps a hero shard pool, with the generic pool for any other group", () => {
    expect(heroShardPoolIcon("Orks")).toBe(
      `${base}/droptables/ui_icon_droptable_HeroShard_Orks_Medium.webp`
    )
    expect(heroShardPoolIcon("All")).toBe(
      `${base}/droptables/ui_icon_droptable_HeroShard_Generic_Medium.webp`
    )
  })
})

describe("resourceGlyphIcon", () => {
  it("maps the named resources", () => {
    expect(resourceGlyphIcon("crusadeBomb")).toBe(
      `${base}/fonts/Resource_CrusadeBomb.webp`
    )
    expect(isResourceGlyph("intel")).toBe(true)
    expect(isResourceGlyph("toString")).toBe(false)
  })
})
