import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/dailies.json"
import deCommon from "../../../../../public/locales/de/common.json"
import en from "../../../../../public/locales/en/dailies.json"
import enCommon from "../../../../../public/locales/en/common.json"
import es from "../../../../../public/locales/es/dailies.json"
import esCommon from "../../../../../public/locales/es/common.json"
import fr from "../../../../../public/locales/fr/dailies.json"
import frCommon from "../../../../../public/locales/fr/common.json"

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  )
}

describe("Dailies translations", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("keeps the %s namespace aligned with English", (_locale, resource) => {
    expect(leafKeys(resource).sort()).toEqual(leafKeys(en).sort())
  })

  it.each([
    ["en", enCommon],
    ["de", deCommon],
    ["es", esCommon],
    ["fr", frCommon],
  ])("removes legacy Dailies keys from %s/common.json", (_locale, common) => {
    expect(common).not.toHaveProperty("dailies")
  })
})
