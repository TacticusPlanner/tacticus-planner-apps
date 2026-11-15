import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/eventShops.json"
import en from "../../../../../public/locales/en/eventShops.json"
import es from "../../../../../public/locales/es/eventShops.json"
import fr from "../../../../../public/locales/fr/eventShops.json"

function leaves(value: unknown, prefix = ""): [string, string][] {
  if (typeof value !== "object" || value === null) {
    return [[prefix, String(value)]]
  }
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key)
  )
}

// Texts that are the same word in the locale (proper names, shared terms, pure placeholders).
const SAME_AS_ENGLISH: Record<string, readonly string[]> = {
  de: [
    "rewards.chainLabel",
    "rewards.step",
    "rewards.position",
    "search.offer",
    "slot.of",
    "slot.lineTotal",
    "header.picker",
    "header.name",
    "tabs.shop",
    "tabs.plan",
    "slot.pack",
    "alliances.xenos",
    "alliances.chaos",
    "coverage.cost",
  ],
  es: [
    "rewards.chainLabel",
    "rewards.step",
    "rewards.position",
    "search.offer",
    "slot.of",
    "slot.lineTotal",
    "header.name",
    "tabs.plan",
    "slot.pack",
    "alliances.imperial",
    "alliances.xenos",
    "coverage.cost",
  ],
  fr: [
    "rewards.chainLabel",
    "rewards.position",
    "search.offer",
    "slot.of",
    "slot.lineTotal",
    "header.name",
    "tabs.missions",
    "tabs.plan",
    "slot.pack",
    "alliances.xenos",
    "alliances.chaos",
    "coverage.cost",
    "coverage.xp",
    "rewards.points",
  ],
}

describe("Event shop translations", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ] as const)(
    "keeps the %s namespace aligned with English",
    (_locale, resource) => {
      expect(
        leaves(resource)
          .map(([key]) => key)
          .sort()
      ).toEqual(
        leaves(en)
          .map(([key]) => key)
          .sort()
      )
    }
  )

  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ] as const)("translates every %s text", (locale, resource) => {
    const english = new Map(leaves(en))
    const untranslated = leaves(resource)
      .filter(([key, text]) => english.get(key) === text)
      .map(([key]) => key)
      .filter((key) => !SAME_AS_ENGLISH[locale]!.includes(key))
    expect(untranslated).toEqual([])
  })

  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ] as const)("keeps every %s placeholder", (_locale, resource) => {
    const placeholders = (text: string) =>
      [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()
    const english = new Map(leaves(en))
    for (const [key, text] of leaves(resource)) {
      expect(placeholders(text), key).toEqual(placeholders(english.get(key)!))
    }
  })
})
