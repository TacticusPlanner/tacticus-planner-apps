import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/arena.json"
import en from "../../../../../public/locales/en/arena.json"
import es from "../../../../../public/locales/es/arena.json"
import fr from "../../../../../public/locales/fr/arena.json"

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  )
}

describe("Arena translations", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("keeps the %s namespace aligned with English", (_locale, resource) => {
    expect(leafKeys(resource).sort()).toEqual(leafKeys(en).sort())
  })

  it("provides the page, mode, category, and tour copy", () => {
    for (const locale of [en, de, es, fr]) {
      expect(locale.title).toBeTruthy()
      expect(locale.mode.xp).toBeTruthy()
      expect(locale.mode.power).toBeTruthy()
      expect(locale.category["active-project"].title).toBeTruthy()
      expect(locale.category["overall-goals"].title).toBeTruthy()
      expect(locale.category.random.title).toBeTruthy()
      expect(locale.empty["no-active-project"]).toBeTruthy()
      expect(locale.empty["no-active-goals"]).toBeTruthy()
      expect(locale.variant.option).toContain("{{count}}")
      expect(locale.rationale.strength).toContain("{{power}}")
      expect(Object.keys(locale.tour.arena.steps).sort()).toEqual([
        "category",
        "mode",
        "purpose",
        "regenerate",
        "variants",
      ])
    }
  })
})
