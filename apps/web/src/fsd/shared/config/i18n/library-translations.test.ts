import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/library.json"
import en from "../../../../../public/locales/en/library.json"
import es from "../../../../../public/locales/es/library.json"
import fr from "../../../../../public/locales/fr/library.json"

const locales = { de, en, es, fr }

describe("Library translations", () => {
  it("provides the full Library navigation and collection copy in every locale", () => {
    for (const locale of Object.values(locales)) {
      expect(locale.section.label).toBeTruthy()
      expect(locale.section.description).toBeTruthy()
      expect(locale.collections.characters.label).toBeTruthy()
      expect(locale.collections.machinesOfWar.label).toBeTruthy()
      expect(locale.collections.npcs.label).toBeTruthy()
      expect(locale.collections.raidBosses.label).toBeTruthy()
      expect(locale.collections.noRecords).toBeTruthy()
      expect(locale.collections.raidBossesNoRecords).toBeTruthy()
      expect(locale.selector.label).toBeTruthy()
      expect(locale.selector.clear).toBeTruthy()
    }
  })

  it("keeps every locale structurally aligned with English", () => {
    expect(Object.keys(de.collections)).toEqual(Object.keys(en.collections))
    expect(Object.keys(es.collections)).toEqual(Object.keys(en.collections))
    expect(Object.keys(fr.collections)).toEqual(Object.keys(en.collections))
  })
})
