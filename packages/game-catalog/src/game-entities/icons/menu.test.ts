import { describe, expect, it } from "vitest"

import { battleGlyphIcon, gameMenuIcon, shopIcon } from "./menu"

const base = "/game_catalog/datamines"

describe("gameMenuIcon", () => {
  it("maps a section to the game's menu art", () => {
    expect(gameMenuIcon("onslaught")).toBe(
      `${base}/atlases/ui_icon_menu_battle_onslaught.webp`
    )
    expect(gameMenuIcon("raids")).toBe(`${base}/fonts/raids.webp`)
  })
})

describe("shopIcon", () => {
  it("maps the planner's shop ids", () => {
    expect(shopIcon("rogue-trader")).toBe(`${base}/fonts/ElderShop.webp`)
    expect(shopIcon("war")).toBe(`${base}/atlases/ui_icon_guildwars.webp`)
  })

  it("is undefined for an unknown shop", () => {
    expect(shopIcon("October2026EventShop")).toBeUndefined()
  })
})

describe("battleGlyphIcon", () => {
  it("maps a battle outcome to the game's glyph", () => {
    expect(battleGlyphIcon("lightningVictory")).toBe(
      `${base}/atlases/ui_icon_lightning_victory.webp`
    )
    expect(battleGlyphIcon("summon")).toBe(`${base}/fonts/summon.webp`)
  })
})
