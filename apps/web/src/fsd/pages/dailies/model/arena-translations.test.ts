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

  it("provides the page, mode, category, control, and tour copy", () => {
    for (const locale of [en, de, es, fr]) {
      expect(locale.title).toBeTruthy()
      expect(locale.mode.xp).toBeTruthy()
      expect(locale.mode.power).toBeTruthy()
      expect(locale.project.label).toBeTruthy()
      expect(locale.teamSize.label).toBeTruthy()
      expect(locale.category.plan.title).toBeTruthy()
      expect(locale.category.random.title).toBeTruthy()
      expect(locale.category.fewerThanRequested).toContain("{{delivered}}")
      expect(locale.category.fewerThanRequested).toContain("{{requested}}")
      expect(locale.lock.lock).toBeTruthy()
      expect(locale.lock.unlock).toBeTruthy()
      expect(locale.rationale.strength).toContain("{{power}}")
      expect(Object.keys(locale.tour.arena.steps).sort()).toEqual([
        "locks",
        "mode",
        "plan",
        "project",
        "purpose",
        "regenerate",
        "teamSize",
      ])
    }
  })
})
