import { useEffect, useState } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { useShopRecommendations } from "./use-shop-recommendations"

// Everything upstream of reward display is stubbed; only the equipment-name path is under test.
vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ isSuccess: true, isError: false, data: { goals: [] } }),
  useQueries: () => [],
}))
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
  getAscensionCostsMap: async () => new Map(),
  getCharactersMap: async () => new Map(),
  getMowsMap: async () => new Map(),
  getShops: async () => [{ id: "guild" }],
  getUnlockShardCostsMap: async () => new Map(),
  getUpgrades: async () => [],
  getEquipmentMap: async () =>
    new Map([
      ["I_Crit_C001", { name: "Combat Knife" }],
      ["I_Crit_U001", { name: "Balanced Combat Knife" }],
    ]),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getInventoryShard: async () => undefined,
  getInventoryUpgrades: async () => [],
  getPlayerCharacter: async () => undefined,
  getPlayerCharacters: async () => [],
  getPlayerDetails: async () => ({ powerLevel: 0 }),
  getPlayerMow: async () => undefined,
  getPlayerMows: async () => [],
}))
vi.mock("@/entities/goal", () => ({ goalQueries: { detail: () => ({}) } }))
vi.mock("@/entities/project", () => ({ projectQueries: { goals: () => ({}) } }))
vi.mock("@/features/rank-lookup", () => ({
  mapCharacterStorageToDomain: (record: unknown) => record,
  mapUpgradeStorageToDomain: (record: unknown) => record,
}))
vi.mock("@/features/daily-raids", () => ({ activeProjectMembers: () => [] }))
vi.mock("./shop-needs", () => ({ aggregateShopNeeds: () => ({}) }))
vi.mock("./shop-recommendations", () => ({
  buildShopRecommendations: () => [
    {
      shopId: "guild",
      guaranteed: ["I_Crit_C001", "I_Crit_U001", "I_Crit_Z999"].map(
        (rewardType) => ({ rewardType })
      ),
      possible: [],
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

describe("useShopRecommendations equipment names", () => {
  it("localizes specific items, falls back per item, and follows locale switches", async () => {
    const { result } = renderHook(() => useShopRecommendations("project-1"), {
      wrapper: ({ children }) => (
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      ),
    })
    const names = () =>
      result.current.status === "ready"
        ? result.current.sections[0]!.guaranteed.map((card) => card.rewardName)
        : []

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(names()).toEqual([
      "Combat Knife",
      "Balanced Combat Knife",
      "I Crit Z999",
    ])

    await act(() => i18n.changeLanguage("de"))
    expect(names()).toEqual([
      "Kampfmesser",
      "Balanced Combat Knife",
      "I Crit Z999",
    ])
  })
})
