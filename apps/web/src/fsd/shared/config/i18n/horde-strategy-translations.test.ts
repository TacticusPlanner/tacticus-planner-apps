import { describe, expect, it } from "vitest"

import { hordeModeTiers } from "@/test/fixtures/horde-mode-tiers"

import de from "../../../../../public/locales/de/hordeStrategy.json"
import en from "../../../../../public/locales/en/hordeStrategy.json"
import es from "../../../../../public/locales/es/hordeStrategy.json"
import fr from "../../../../../public/locales/fr/hordeStrategy.json"

const locales = { de, en, es, fr }

const fields = (resource: Record<string, Record<string, string>>) =>
  Object.entries(resource)
    .flatMap(([unitId, entry]) =>
      Object.keys(entry).map((field) => `${unitId}.${field}`)
    )
    .sort()

describe("horde-mode strategy translations", () => {
  it("covers every tiered character", () => {
    expect(Object.keys(en).sort()).toEqual(
      hordeModeTiers.characters.map((character) => character.unitId).sort()
    )
  })

  it("has the same fields in every locale, with no blank text", () => {
    for (const [code, resource] of Object.entries(locales)) {
      expect(fields(resource), code).toEqual(fields(en))
      for (const [unitId, entry] of Object.entries(resource)) {
        for (const [field, text] of Object.entries(entry)) {
          expect(text.trim(), `${code}:${unitId}.${field}`).not.toBe("")
        }
      }
    }
  })
})
