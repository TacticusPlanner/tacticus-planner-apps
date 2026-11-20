import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/npcs.json"
import en from "../../../../../public/locales/en/npcs.json"
import es from "../../../../../public/locales/es/npcs.json"
import fr from "../../../../../public/locales/fr/npcs.json"
import { compareCodeUnits } from "../../lib/compare"

const locales = { de, en, es, fr }

describe("NPC name translations", () => {
  it("covers the same variation ids in every locale with no empty names", () => {
    const enKeys = Object.keys(en).toSorted(compareCodeUnits)
    expect(enKeys.length).toBeGreaterThan(500)

    for (const [code, locale] of Object.entries(locales)) {
      expect(Object.keys(locale).toSorted(compareCodeUnits), code).toEqual(
        enKeys
      )
      for (const [id, name] of Object.entries(locale)) {
        expect(name.trim(), `${code}:${id}`).not.toBe("")
      }
    }
  })

  it("carries the game localization for translated units", () => {
    expect(en.necroNpc1Warrior).toBe("Necron Warrior")
    expect(de.necroNpc1Warrior).toBe("Necronkrieger")
    expect(de.necroNpc1WarriorSurv).toBe("Necronkrieger")
    expect(fr.tyranBossHiveTyrantLeviathan).toBe("Tyran des Ruches")
  })
})
