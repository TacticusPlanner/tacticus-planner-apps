import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/abilities.json"
import en from "../../../../../public/locales/en/abilities.json"
import es from "../../../../../public/locales/es/abilities.json"
import fr from "../../../../../public/locales/fr/abilities.json"
import npcAbilityIds from "@/test/fixtures/npc-ability-ids.json"

const locales = { de, en, es, fr }

// Internal engine markers: the game gives them no name and no icon, so they are omitted from the
// namespace and never rendered (see the npc-library spec).
const unnamedByDesign = [
  "BossEndFightUndefeated",
  "RepairEnthusiast",
  "RunsAround",
  "RunsAway",
]

describe("ability name translations", () => {
  it("covers the same ability ids in every locale with no empty names", () => {
    const enKeys = Object.keys(en).sort()
    expect(enKeys.length).toBeGreaterThan(400)

    for (const [code, locale] of Object.entries(locales)) {
      expect(Object.keys(locale).sort(), code).toEqual(enKeys)
      for (const [id, name] of Object.entries(locale)) {
        expect(name.trim(), `${code}:${id}`).not.toBe("")
      }
    }
  })

  it("names every NPC ability except the known internal markers", () => {
    const missing = npcAbilityIds.filter((id) => !(id in en))

    expect(missing.sort()).toEqual(unnamedByDesign)
    expect(npcAbilityIds.length - missing.length).toBe(303)
  })

  it("carries real per-locale translations", () => {
    expect(en.AdaptiveStrategy).toBe("Adaptive Strategy")
    expect(de.AdaptiveStrategy).toBe("Wandelbare Taktik")
    expect(fr.RelentlessMarch).not.toBe(en.RelentlessMarch)
  })
})
