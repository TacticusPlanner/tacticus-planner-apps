import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/npcTraitText.json"
import en from "../../../../../public/locales/en/npcTraitText.json"
import es from "../../../../../public/locales/es/npcTraitText.json"
import fr from "../../../../../public/locales/fr/npcTraitText.json"
import deProgression from "../../../../../public/locales/de/progression.json"
import enProgression from "../../../../../public/locales/en/progression.json"
import esProgression from "../../../../../public/locales/es/progression.json"
import frProgression from "../../../../../public/locales/fr/progression.json"
import { compareCodeUnits } from "../../lib/compare"

describe("NPC trait text translations", () => {
  it("covers the same traits in every locale, each with a description", () => {
    const enKeys = Object.keys(en).toSorted(compareCodeUnits)
    expect(enKeys.length).toBeGreaterThan(40)
    for (const [code, locale] of Object.entries({ de, en, es, fr })) {
      expect(Object.keys(locale).toSorted(compareCodeUnits), code).toEqual(
        enKeys
      )
      for (const [id, entry] of Object.entries(locale)) {
        expect(entry.description.trim(), `${code}:${id}`).not.toBe("")
      }
    }
  })

  it("carries the game's localized description", () => {
    expect(en.Flying.description).toContain("impassable hexes")
    expect(de.Flying.description).not.toBe(en.Flying.description)
  })
})

describe("progression translations", () => {
  it("names every rank and rarity in every locale", () => {
    for (const [code, locale] of Object.entries({
      de: deProgression,
      es: esProgression,
      fr: frProgression,
    })) {
      expect(Object.keys(locale.ranks), code).toEqual(
        Object.keys(enProgression.ranks)
      )
      expect(Object.keys(locale.rarities), code).toEqual(
        Object.keys(enProgression.rarities)
      )
    }
    expect(enProgression.ranks.Diamond3).toBe("Diamond III")
    expect(deProgression.rarities.Legendary).toBe("Legendär")
  })
})
