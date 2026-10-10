import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/common.json"
import en from "../../../../../public/locales/en/common.json"
import es from "../../../../../public/locales/es/common.json"
import fr from "../../../../../public/locales/fr/common.json"

function leaves(value: unknown, prefix = ""): [string, string][] {
  if (typeof value !== "object" || value === null)
    return [[prefix, String(value)]]
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key)
  )
}
const placeholders = (text: string) =>
  [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()

const sections = {
  "progress.events": (locale: typeof en) => locale.progress.events,
  "tour.campaignEvents": (locale: typeof en) => locale.tour.campaignEvents,
}

describe("Campaign Events translations", () => {
  describe.each(Object.entries(sections))("%s", (_name, pick) => {
    const english = new Map(leaves(pick(en)))

    it.each([
      ["de", de],
      ["es", es],
      ["fr", fr],
    ])("keeps %s aligned with English keys and placeholders", (_l, locale) => {
      const translated = new Map(leaves(pick(locale as typeof en)))
      expect([...translated.keys()].sort()).toEqual([...english.keys()].sort())
      for (const [key, text] of translated) {
        expect(placeholders(text), key).toEqual(placeholders(english.get(key)!))
      }
    })

    it.each([
      ["de", de],
      ["es", es],
      ["fr", fr],
    ])("actually translates %s rather than copying English", (_l, locale) => {
      const translated = leaves(pick(locale as typeof en))
      const copied = translated.filter(
        ([key, text]) => english.get(key) === text
      )
      // Only placeholder-only formats and loan words ("Max", "Manual") may legitimately match.
      expect(copied.length).toBeLessThanOrEqual(3)
    })
  })

  it.each([
    ["en", en],
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("drops the replaced editor keys from %s", (_locale, locale) => {
    for (const key of [
      "regularProgress",
      "useSynced",
      "manual",
      "synced",
      "save",
    ]) {
      expect(locale.progress.events).not.toHaveProperty(key)
    }
  })
})
