import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/library.json"
import en from "../../../../../public/locales/en/library.json"
import es from "../../../../../public/locales/es/library.json"
import fr from "../../../../../public/locales/fr/library.json"

const locales = { de, en, es, fr }

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  )
}

describe("Library translations", () => {
  it("provides the full Library navigation and collection copy in every locale", () => {
    for (const locale of Object.values(locales)) {
      expect(locale.section.label).toBeTruthy()
      expect(locale.section.description).toBeTruthy()
      expect(locale.collections.characters.label).toBeTruthy()
      expect(locale.collections.machinesOfWar.label).toBeTruthy()
      expect(locale.collections.npcs.label).toBeTruthy()
      expect(locale.collections.raidBosses.label).toBeTruthy()
      expect(locale.collections.shops.label).toBeTruthy()
      expect(locale.collections.shops.description).toBeTruthy()
      expect(locale.collections.noRecords).toBeTruthy()
      expect(locale.collections.raidBossesNoRecords).toBeTruthy()
      expect(locale.selector.label).toBeTruthy()
      expect(locale.selector.clear).toBeTruthy()
    }
  })

  it("provides the Shops browsing-page copy in every locale", () => {
    for (const locale of Object.values(locales)) {
      expect(locale.shops.title).toBeTruthy()
      expect(Object.keys(locale.shops.days)).toEqual([
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
        "SAT",
        "SUN",
      ])
      expect(locale.shops.randomSlot).toContain("{{count}}")
      expect(locale.shops.state.empty).toBeTruthy()
      expect(locale.shops.tour.libraryShops.steps.day.title).toBeTruthy()
    }
  })

  it("keeps every locale structurally aligned with English", () => {
    expect(Object.keys(de.collections)).toEqual(Object.keys(en.collections))
    expect(Object.keys(es.collections)).toEqual(Object.keys(en.collections))
    expect(Object.keys(fr.collections)).toEqual(Object.keys(en.collections))
    for (const locale of [de, es, fr]) {
      expect(leafKeys(locale.shops).sort()).toEqual(leafKeys(en.shops).sort())
    }
  })
})
