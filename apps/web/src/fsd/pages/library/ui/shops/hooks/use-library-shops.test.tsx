import { afterEach, describe, expect, it } from "vitest"

import { i18n } from "@/test/i18n-instance"
import { act, renderHook, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { useLibraryShops } from "./use-library-shops"

const everyDay = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

// One guild slot offering three equipment rewards every day, so today's weekday doesn't matter.
const guildShop = {
  id: "guild",
  slots: [
    {
      variants: ["I_Crit_C001", "I_Crit_T001", "I_Crit_Z999"].map((type) => ({
        reward: { type, qty: 1 },
        cost: { currency: "guildCredits", amount: 100 },
        maxPurchasesPerDay: 1,
        weight: 1,
        days: everyDay,
      })),
    },
  ],
}

afterEach(async () => {
  await i18n.changeLanguage("en")
  i18n.removeResourceBundle("de", "equipmentItems")
})

describe("useLibraryShops equipment names", () => {
  it("localizes specific items, falls back per item, and follows locale switches", async () => {
    await seedGameCatalog({
      shops: [guildShop],
      equipment: [
        { id: "I_Crit_C001", name: "Combat Knife" },
        { id: "I_Crit_T001", name: "Balanced Combat Knife" },
      ],
    })
    i18n.addResourceBundle("de", "equipmentItems", {
      I_Crit_C001: "Kampfmesser",
    })

    const { result } = renderHook(() => useLibraryShops())
    const labels = () =>
      result.current.status === "ready"
        ? result.current.slots[0]!.rewards.map((reward) => reward.label)
        : []

    await waitFor(() => expect(result.current.status).toBe("ready"))
    // translated / catalog English (no translation: I_Crit_T001 is test-only) / unknown id
    expect(labels()).toEqual([
      "Combat Knife",
      "Balanced Combat Knife",
      "I Crit Z999",
    ])

    await act(() => i18n.changeLanguage("de"))
    expect(labels()).toEqual([
      "Kampfmesser",
      "Balanced Combat Knife",
      "I Crit Z999",
    ])
  })
})
