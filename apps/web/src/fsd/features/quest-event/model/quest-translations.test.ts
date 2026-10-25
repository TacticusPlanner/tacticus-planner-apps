import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/quest.json"
import en from "../../../../../public/locales/en/quest.json"
import es from "../../../../../public/locales/es/quest.json"
import fr from "../../../../../public/locales/fr/quest.json"
import { QUEST_OBJECTIVE_TYPES } from "./quest-objectives"

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  )
}

describe("Quest translations", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("keeps the %s namespace aligned with English", (_locale, resource) => {
    expect(leafKeys(resource).sort()).toEqual(leafKeys(en).sort())
  })

  it("words every objective type the tab knows", () => {
    for (const type of QUEST_OBJECTIVE_TYPES) {
      expect((en.objectives as Record<string, string>)[type], type).toBeTruthy()
    }
  })
})
