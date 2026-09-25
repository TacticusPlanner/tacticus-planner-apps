import { useEffect, useState } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { useLibraryShops } from "./use-library-shops"

// The catalog reads are stubbed; `useLiveQuery` is reduced to "run the querier once".
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: <T,>(querier: () => Promise<T>, deps: unknown[]) => {
    const [value, setValue] = useState<T>()
    useEffect(() => {
      void querier().then(setValue)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getShopsMap: async () => new Map([["guild", { id: "guild" }]]),
  getCharactersMap: async () => new Map(),
  getMowsMap: async () => new Map(),
  getEquipmentMap: async () =>
    new Map([
      ["I_Crit_C001", { name: "Combat Knife" }],
      ["I_Crit_U001", { name: "Balanced Combat Knife" }],
    ]),
}))
vi.mock("@workspace/game-catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/game-catalog")>()),
  todayDow: () => "monday",
  resolveShopSlotsForDay: () => [
    {
      offers: ["I_Crit_C001", "I_Crit_U001", "I_Crit_Z999"].map(
        (rewardType) => ({
          rewardType,
          rewardQty: 1,
          cost: { currency: "guildCredits", amount: 100 },
          maxPerDay: 1,
        })
      ),
    },
  ],
}))

const i18n = i18next.createInstance()

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    ns: ["shops", "equipmentItems"],
    resources: {
      en: {
        shops: { reward: { generic: "{{name}}" } },
        equipmentItems: { I_Crit_C001: "Combat Knife" },
      },
      de: {
        shops: { reward: { generic: "{{name}}" } },
        equipmentItems: { I_Crit_C001: "Kampfmesser" },
      },
    },
  })
})

describe("useLibraryShops equipment names", () => {
  it("localizes specific items, falls back per item, and follows locale switches", async () => {
    const { result } = renderHook(() => useLibraryShops(), {
      wrapper: ({ children }) => (
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      ),
    })
    const labels = () =>
      result.current.status === "ready"
        ? result.current.slots[0]!.rewards.map((reward) => reward.label)
        : []

    await waitFor(() => expect(result.current.status).toBe("ready"))
    // translated / catalog English (no translation) / unknown id
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
