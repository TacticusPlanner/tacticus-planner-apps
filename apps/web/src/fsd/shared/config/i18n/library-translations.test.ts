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

  it("provides the NPC Library page copy and tour in every locale", () => {
    const enLeaves = leafKeys(en.npcs).sort()
    expect(enLeaves.length).toBeGreaterThan(40)

    for (const [code, locale] of Object.entries(locales)) {
      expect(leafKeys(locale.npcs).sort(), code).toEqual(enLeaves)
      for (const key of enLeaves) {
        const value = key
          .split(".")
          .reduce<unknown>(
            (node, part) => (node as Record<string, unknown>)[part],
            locale.npcs
          )
        expect(
          typeof value === "string" && value.trim() !== "",
          `${code}:npcs.${key}`
        ).toBe(true)
      }
      expect(locale.npcs.filtersCount).toContain("{{count}}")
      expect(locale.npcs.attacks.hits_other).toContain("{{count}}")
      expect(locale.npcs.attacks.range).toContain("{{range}}")
      expect(locale.npcs.healthAtLevel).toContain("{{health}}")
      expect(Object.keys(locale.npcs.tour.steps)).toEqual([
        "filters",
        "list",
        "picker",
        "variation",
        "level",
        "stats",
      ])
    }
  })

  it("provides the Machines of War list and unit page copy in every locale", () => {
    for (const section of ["mowsList", "mowUnit"] as const) {
      const enLeaves = leafKeys(en[section]).sort()
      for (const [code, locale] of Object.entries(locales)) {
        const localeSection = locale[section]
        expect(leafKeys(localeSection).sort(), code).toEqual(enLeaves)
        for (const key of enLeaves) {
          const value = key
            .split(".")
            .reduce<unknown>(
              (node, part) => (node as Record<string, unknown>)[part],
              localeSection
            )
          expect(
            typeof value === "string" && value.trim() !== "",
            `${code}:${section}.${key}`
          ).toBe(true)
          if (code !== "en" && !/^\{\{\w+\}\}/.test(String(value))) {
            const english = key
              .split(".")
              .reduce<unknown>(
                (node, part) => (node as Record<string, unknown>)[part],
                en[section]
              )
            expect(value, `${code}:${section}.${key} is untranslated`).not.toBe(
              english
            )
          }
        }
      }
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
