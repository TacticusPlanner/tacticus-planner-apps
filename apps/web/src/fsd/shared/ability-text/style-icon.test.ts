import { describe, expect, it } from "vitest"

import { styleIcon } from "./style-icon"

// The shipped English game text (NPC and raid boss rules text), and every catalog image in the app.
const localeFiles = import.meta.glob<string>("/public/locales/en/**/*.json", {
  query: "?raw",
  import: "default",
  eager: true,
})
const appImages = new Set(
  Object.keys(import.meta.glob("/public/game_catalog/**/*.webp")).map((path) =>
    path.replace(/^\/public/, "")
  )
)

/** Every `<style="…">` name in the shipped text. */
function shippedStyleNames(): string[] {
  const names = new Set<string>()
  for (const text of Object.values(localeFiles)) {
    for (const match of text.matchAll(/<style=\\?"?(\w+)/g)) {
      names.add(match[1] ?? "")
    }
  }
  return [...names].filter((name) => name !== "")
}

describe("styleIcon", () => {
  it("maps each kind of styled token to its game icon", () => {
    expect(styleIcon("DMG_Psychic")).toContain(
      "ui_icon_damage_profile2_Psychic.webp"
    )
    expect(styleIcon("DMG_Direct")).toContain(
      "ui_icon_damage_profile2_DirectDamage.webp"
    )
    expect(styleIcon("Psyker")).toContain("ui_icon_trait_psychic_01.webp")
    expect(styleIcon("Faction_Orks")).toContain("ui_icon_faction_orks_01.webp")
    expect(styleIcon("Aliance_Chaos")).toContain("ui_ability_badges_chaos.webp")
    expect(styleIcon("Stat_Block")).toContain("ui_icon_stat_block_01.webp")
    expect(styleIcon("Debuff_Pinned")).toContain(
      "ui_icon_uniteffect_supressed_01.webp"
    )
    expect(styleIcon("Effect_Fire")).toContain("ui_icon_tile_effect_fire.webp")
  })

  it("has no icon for styles that name no game thing", () => {
    expect(styleIcon("Cooldown")).toBeUndefined()
    expect(styleIcon("NormalAttack")).toBeUndefined()
    expect(styleIcon("Tile_Grass")).toBeUndefined()
    expect(styleIcon("DMG_None")).toBeUndefined()
    expect(styleIcon("Aliance_Unknown")).toBeUndefined()
  })

  it("points every icon the shipped text uses at a sprite that is in the app", () => {
    const names = shippedStyleNames()
    expect(names.length).toBeGreaterThan(50)
    const missing = names
      .map((name) => [name, styleIcon(name)] as const)
      .filter(
        (entry): entry is readonly [string, string] => entry[1] !== undefined
      )
      .filter(([, url]) => !appImages.has(url.replace(/\?.*$/, "")))
    expect(missing).toEqual([])
  })
})
