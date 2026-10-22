import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { act, renderHook, waitFor } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import { useShopRecommendations } from "./use-shop-recommendations"

// The catalog and player data are seeded; the goal plan and the needs/offer builders are stubbed, so
// only the equipment-name path is under test.
const state = vi.hoisted(() => ({
  active: [{ goal: { goalId: "goal-1" } }] as unknown[],
  members: undefined as unknown,
  globalPlan: {
    loading: false,
    isError: false,
    entries: [
      { goal: { goalId: "goal-1", projectIds: ["p1"] } },
      { goal: { goalId: "goal-2", projectIds: ["p2"] } },
    ],
    retry: () => undefined,
  },
}))
vi.mock("@/entities/goal", () => ({
  useGlobalGoalPlan: () => state.globalPlan,
}))
vi.mock("@/features/rank-lookup", () => ({
  mapCharacterStorageToDomain: (record: unknown) => record,
  mapUpgradeStorageToDomain: (record: unknown) => record,
}))
vi.mock("@/features/daily-raids", () => ({
  activeProjectMembers: (members: unknown) => {
    state.members = members
    return state.active
  },
}))
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

// A two-locale instance (the shared test one is English only) whose English bundle names one of
// the two knives, so the other falls back to its catalog name.
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

beforeEach(async () => {
  await seedGameCatalog({
    shops: [{ id: "guild" }],
    equipment: [
      { id: "I_Crit_C001", name: "Combat Knife" },
      { id: "I_Crit_U001", name: "Balanced Combat Knife" },
    ],
  })
  await seedPlayerData({
    "inventory-upgrades": [],
    "player-details": { powerLevel: 0 },
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

  it("covers every Active goal in the global plan when no project is selected", async () => {
    const { result } = renderHook(() => useShopRecommendations(undefined), {
      wrapper: ({ children }) => (
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      ),
    })

    await waitFor(() => expect(result.current.status).toBe("ready"))
  })

  it("scopes to a project by the goals' projectIds, without a membership read", async () => {
    const { result } = renderHook(() => useShopRecommendations("p2"), {
      wrapper: ({ children }) => (
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      ),
    })

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(state.members).toEqual([
      { goal: { goalId: "goal-2", projectIds: ["p2"] } },
    ])
  })

  it("reports no Active goals instead of an empty shop list when the scope has none", async () => {
    state.active = []
    try {
      const { result } = renderHook(() => useShopRecommendations(undefined), {
        wrapper: ({ children }) => (
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        ),
      })

      await waitFor(() => expect(result.current.status).toBe("no-goals"))
    } finally {
      state.active = [{ goal: { goalId: "goal-1" } }]
    }
  })
})
