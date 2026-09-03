import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/shops.json"
import en from "../../../../../public/locales/en/shops.json"
import es from "../../../../../public/locales/es/shops.json"
import fr from "../../../../../public/locales/fr/shops.json"

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  )
}

describe("Shops translations", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("keeps the %s namespace aligned with English", (_locale, resource) => {
    expect(leafKeys(resource).sort()).toEqual(leafKeys(en).sort())
  })

  it("provides the recommendations-page essentials in every locale", () => {
    for (const locale of [en, de, es, fr]) {
      expect(locale.title).toBeTruthy()
      expect(locale.group.guaranteed).toBeTruthy()
      expect(locale.group.possible).toBeTruthy()
      expect(locale.reward.shards).toContain("{{unit}}")
      expect(locale.currency.guildCredits).toBeTruthy()
      expect(locale.state.nothingToBuy).toBeTruthy()
      expect(locale.tour.shops.steps.purpose.title).toBeTruthy()
    }
  })
})
