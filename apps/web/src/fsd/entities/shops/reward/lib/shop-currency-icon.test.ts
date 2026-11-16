import { describe, expect, it } from "vitest"

import { shopCurrencyIcon } from "./shop-currency-icon"

describe("shopCurrencyIcon", () => {
  it.each([
    ["seasonalEventCurrencyJune2026", "fonts/SE_Currency_june_26.webp"],
    [
      "seasonalEventCurrencyAugust2026",
      "liveevents/ui_icon_resource_event_currency_august_2026.webp",
    ],
    // October 2026 shipped no dedicated art: the generic event currency.
    [
      "seasonalEventCurrencyOctober2026",
      "liveevents/ui_icon_resource_event_currency.webp",
    ],
  ])("resolves the event shop currency %s", (currency, file) => {
    expect(shopCurrencyIcon(currency)).toMatch(new RegExp(`${file}$`))
  })

  it("leaves an unknown currency without an icon", () => {
    expect(shopCurrencyIcon("unknownCurrency")).toBeUndefined()
  })
})
