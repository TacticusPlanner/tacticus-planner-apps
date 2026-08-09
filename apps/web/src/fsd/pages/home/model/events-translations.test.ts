import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/events.json"
import en from "../../../../../public/locales/en/events.json"
import es from "../../../../../public/locales/es/events.json"
import fr from "../../../../../public/locales/fr/events.json"

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  )
}

describe("Events translations", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("keeps the %s namespace aligned with English", (_locale, resource) => {
    expect(leafKeys(resource).sort()).toEqual(leafKeys(en).sort())
  })
})
