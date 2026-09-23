import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/npcAbilityText.json"
import en from "../../../../../public/locales/en/npcAbilityText.json"
import es from "../../../../../public/locales/es/npcAbilityText.json"
import fr from "../../../../../public/locales/fr/npcAbilityText.json"

const locales = { de, en, es, fr }
type Entry = {
  description: string
  variables: Record<string, (string | number)[]>
  constants: Record<string, string>
  scaled: string[]
}

const DAMAGE_PROFILE_TYPE = /^DamageProfileType(Style)?(_\d+)?$/
const trimmedHas = (rec: Record<string, unknown>, key: string) =>
  rec[key] !== undefined || Object.keys(rec).some((k) => k.trim() === key)

const placeholders = (text: string) => [
  ...new Set([...text.matchAll(/\{\[([^\]]+)\]\}/g)].map((m) => m[1])),
]

describe("NPC ability rules text", () => {
  it("covers the same abilities in every locale", () => {
    const enKeys = Object.keys(en).sort()
    expect(enKeys.length).toBeGreaterThan(50)

    for (const [code, locale] of Object.entries(locales)) {
      expect(Object.keys(locale).sort(), code).toEqual(enKeys)
    }
  })

  it("resolves every placeholder from the entry's own variable and constant tables", () => {
    for (const [code, locale] of Object.entries(locales)) {
      for (const [id, raw] of Object.entries(locale)) {
        const entry = raw as Entry
        const missing = placeholders(entry.description).filter((name) => {
          if (name === "UnitName" || name.startsWith("S/")) return false
          if (trimmedHas(entry.variables, name)) return false
          if (trimmedHas(entry.constants, name)) return false
          const match = DAMAGE_PROFILE_TYPE.exec(name)
          if (match)
            return !trimmedHas(
              entry.constants,
              `damageProfile${match[2] ?? ""}`
            )
          return true
        })
        expect(missing, `${code}:${id}`).toEqual([])
      }
    }
  })

  it("covers every ability the page can display", () => {
    // The only ids left out are the internal markers the game never names, which the UI drops.
    expect(Object.keys(en).length).toBe(302)
  })

  it("carries per-level variable tables and real localized text", () => {
    const entry = (en as Record<string, Entry>).AdaptiveStrategy
    expect(entry.variables.minDmg.length).toBeGreaterThan(20)
    expect(entry.variables.minDmg[0]).toBe(12)
    expect((de as Record<string, Entry>).AdaptiveStrategy.description).not.toBe(
      entry.description
    )
  })

  it("stores no variables the description never references", () => {
    for (const raw of Object.values(en)) {
      const entry = raw as Entry
      const used = new Set(placeholders(entry.description))
      expect(
        Object.keys(entry.variables).filter((k) => !used.has(k.trim()))
      ).toEqual([])
    }
  })
})
