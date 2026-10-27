import { describe, expect, it } from "vitest"

import curated from "../../../../../datamine/curated-names.json"

// The namespaces `scripts/generate-game-names-i18n.mjs` writes from the pinned datamine.
const files = import.meta.glob<Record<string, string>>(
  "../../../../../public/locales/*/{upgrades,abilities,equipmentItems,characters,mows,traits,factions,mythicQuestTasks}.json",
  { eager: true, import: "default" }
)

/** namespace -> locale -> table. */
const tables: Record<string, Record<string, Record<string, string>>> = {}
for (const [path, table] of Object.entries(files)) {
  const match = /\/locales\/([^/]+)\/([^/]+)\.json$/.exec(path)
  if (!match?.[1] || !match[2]) throw new Error(`unexpected path ${path}`)
  ;(tables[match[2]] ??= {})[match[1]] = table
}

describe("game name translations", () => {
  it("covers the same ids in every locale with no empty terms", () => {
    expect(Object.keys(tables).sort()).toEqual([
      "abilities",
      "characters",
      "equipmentItems",
      "factions",
      "mows",
      "mythicQuestTasks",
      "traits",
      "upgrades",
    ])
    for (const [namespace, locales] of Object.entries(tables)) {
      expect(Object.keys(locales).sort(), namespace).toEqual([
        "de",
        "en",
        "es",
        "fr",
      ])
      const enKeys = Object.keys(locales.en ?? {}).sort()
      expect(enKeys.length, namespace).toBeGreaterThan(10)
      for (const [code, table] of Object.entries(locales)) {
        expect(Object.keys(table).sort(), `${namespace}/${code}`).toEqual(
          enKeys
        )
        for (const [id, term] of Object.entries(table)) {
          expect(term.trim(), `${namespace}/${code}:${id}`).not.toBe("")
        }
      }
    }
  })

  it("applies the curated terms in each locale they give", () => {
    for (const [namespace, entry] of Object.entries(curated)) {
      if (typeof entry === "string" || !("values" in entry)) continue
      for (const [id, value] of Object.entries(entry.values)) {
        for (const [locale, term] of Object.entries(value)) {
          if (locale === "why") continue
          expect(
            tables[namespace]?.[locale]?.[id],
            `${namespace}/${locale}:${id}`
          ).toBe(term)
        }
      }
    }
  })

  it("carries the game's own localized terms", () => {
    expect(tables.characters?.en?.votanUthar).toBe("Ûthar")
    expect(tables.traits?.de?.Flying).toBe("Fliegend")
  })
})
