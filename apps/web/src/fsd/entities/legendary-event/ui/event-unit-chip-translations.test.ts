import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/legendaryEvents.json"
import en from "../../../../../public/locales/en/legendaryEvents.json"
import es from "../../../../../public/locales/es/legendaryEvents.json"
import fr from "../../../../../public/locales/fr/legendaryEvents.json"

const KEYS = ["abilities", "notOwned", "rankShading", "rankShadingHint"]

describe("Unit chip translations", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("translates every unit chip string into %s", (_locale, resource) => {
    for (const key of KEYS) {
      const value = (resource.unitChip as Record<string, string>)[key]
      const english = (en.unitChip as Record<string, string>)[key]
      expect(value, key).toBeTruthy()
      expect(value, key).not.toBe(english)
    }
  })

  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])(
    "translates the Event board's unit table strings into %s",
    (_locale, resource) => {
      for (const key of ["showAll", "showBest", "keysHint"]) {
        const value = (resource.eventBoard as Record<string, string>)[key]
        const english = (en.eventBoard as Record<string, string>)[key]
        expect(value, key).toBeTruthy()
        expect(value, key).not.toBe(english)
        if (key !== "keysHint") expect(value, key).toContain("{{count}}")
      }
    }
  )

  it("keeps the ability levels' placeholders in every language", () => {
    for (const resource of [en, de, es, fr]) {
      expect(resource.unitChip.abilities).toContain("{{active}}")
      expect(resource.unitChip.abilities).toContain("{{passive}}")
    }
  })
})
