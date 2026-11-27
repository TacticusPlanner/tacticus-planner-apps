import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/myItems.json"
import en from "../../../../../public/locales/en/myItems.json"
import es from "../../../../../public/locales/es/myItems.json"
import fr from "../../../../../public/locales/fr/myItems.json"
import { compareCodeUnits } from "../../lib/compare"

const locales = { de, en, es, fr }

function leaves(value: unknown, prefix = ""): [string, unknown][] {
  if (typeof value !== "object" || value === null) return [[prefix, value]]
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key)
  )
}

const placeholders = (text: unknown) =>
  [...String(text).matchAll(/\{\{(\w+)\}\}/g)]
    .map((match) => match[1] ?? "")
    .toSorted(compareCodeUnits)

describe("My Items translations", () => {
  const english = new Map(leaves(en))

  it.each(Object.entries(locales))(
    "%s has every English key, translated, with the same placeholders",
    (code, locale) => {
      const entries = leaves(locale)
      expect(
        entries.map(([key]) => key).toSorted(compareCodeUnits),
        code
      ).toEqual([...english.keys()].toSorted(compareCodeUnits))
      for (const [key, value] of entries) {
        expect(
          typeof value === "string" && value.trim() !== "",
          `${code}:${key}`
        ).toBe(true)
        expect(placeholders(value), `${code}:${key}`).toEqual(
          placeholders(english.get(key))
        )
      }
    }
  )
})
