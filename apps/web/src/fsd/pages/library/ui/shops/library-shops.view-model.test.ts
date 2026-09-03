import { describe, expect, it } from "vitest"
import type {
  ResolvedShopOffer,
  ResolvedShopSlot,
} from "@workspace/game-catalog"

import { buildLibraryShopSlots } from "./library-shops.view-model"

function offer(overrides: Partial<ResolvedShopOffer>): ResolvedShopOffer {
  return {
    rewardType: "gold",
    rewardQty: 1000,
    cost: { currency: "guildCredits", amount: 50 },
    maxPerDay: 3,
    isGuaranteed: true,
    ...overrides,
  }
}

const label = (o: ResolvedShopOffer) => ({
  label: o.rewardType,
  iconUrl: undefined,
})

describe("buildLibraryShopSlots", () => {
  it("renders a single-reward slot directly", () => {
    const slots: ResolvedShopSlot[] = [
      { offers: [offer({ rewardType: "shards_eldarFarseer", rewardQty: 5 })] },
    ]

    const [view] = buildLibraryShopSlots(slots, label)
    expect(view!.kind).toBe("single")
    expect(view!.rewards).toHaveLength(1)
    expect(view!.rewards[0]!.rewardType).toBe("shards_eldarFarseer")
  })

  it("keeps a multi-reward slot as one 'random' unit, not split into separate offers", () => {
    const slots: ResolvedShopSlot[] = [
      {
        offers: [
          offer({
            rewardType: "shards_a",
            cost: { currency: "guildCredits", amount: 525 },
          }),
          offer({
            rewardType: "shards_b",
            cost: { currency: "guildCredits", amount: 525 },
          }),
          offer({
            rewardType: "shards_c",
            cost: { currency: "guildCredits", amount: 525 },
          }),
        ],
      },
    ]

    const views = buildLibraryShopSlots(slots, label)
    expect(views).toHaveLength(1)
    expect(views[0]!.kind).toBe("random")
    expect(views[0]!.rewards).toHaveLength(3)
    expect(views[0]!.uniformCost).toBe(true)
    expect(views[0]!.costAmount).toBe(525)
  })

  it("flags a random slot whose options cost different amounts", () => {
    const slots: ResolvedShopSlot[] = [
      {
        offers: [
          offer({
            rewardType: "x",
            cost: { currency: "elderShopCurrency", amount: 100 },
          }),
          offer({
            rewardType: "y",
            cost: { currency: "elderShopCurrency", amount: 250 },
          }),
        ],
      },
    ]

    const [view] = buildLibraryShopSlots(slots, label)
    expect(view!.uniformCost).toBe(false)
    expect(view!.costAmount).toBeUndefined()
  })

  it("returns an empty list for a day with no slots", () => {
    expect(buildLibraryShopSlots([], label)).toEqual([])
  })
})
