import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/equipmentItems.json"
import en from "../../../../../public/locales/en/equipmentItems.json"
import es from "../../../../../public/locales/es/equipmentItems.json"
import fr from "../../../../../public/locales/fr/equipmentItems.json"

const locales = { de, en, es, fr }

// Catalog coverage was verified against tacticus-planner-api's equipment dataset (214 ids) when the
// names were ported from V1; a catalog change that adds ids falls back to the catalog English name.
describe("equipment item name translations", () => {
  it("covers the same equipment ids in every locale with no empty names", () => {
    const enKeys = Object.keys(en).sort()
    expect(enKeys).toHaveLength(214)

    for (const [code, locale] of Object.entries(locales)) {
      expect(Object.keys(locale).sort(), code).toEqual(enKeys)
      for (const [id, name] of Object.entries(locale)) {
        expect(name.trim(), `${code}:${id}`).not.toBe("")
      }
    }
  })

  it("carries the V1 game localization", () => {
    expect(en.I_Crit_C001).toBe("Combat Knife")
    expect(de.I_Crit_C001).toBe("Kampfmesser")
  })
})
