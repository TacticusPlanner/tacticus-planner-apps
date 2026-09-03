import type {
  ResolvedShopOffer,
  ResolvedShopSlot,
} from "@workspace/game-catalog"

/** One resolved reward option in a slot, enriched with a display label + icon. */
export interface LibraryShopRewardView {
  rewardType: string
  unitId?: string
  qty: number
  cost: { currency: string; amount: number }
  maxPerDay: number
  freeOfferType?: string
  label: string
  iconUrl?: string
}

/**
 * One shop slot for the selected day. `kind: "single"` — the slot always yields `rewards[0]` that
 * day; `kind: "random"` — the slot yields exactly one of `rewards` (length > 1), shown as a single
 * "N possible rewards" unit, never split into separate guaranteed offers.
 */
export interface LibraryShopSlotView {
  kind: "single" | "random"
  rewards: LibraryShopRewardView[]
  /** True when every option in a random slot costs the same amount in the shop's currency. */
  uniformCost: boolean
  costAmount?: number
}

export type ResolveRewardDisplay = (offer: ResolvedShopOffer) => {
  label: string
  iconUrl?: string
}

/**
 * Turns the permissive resolver's grouped slots into the browse-page view model: a single-reward slot
 * renders directly, a multi-reward slot stays one "one of these" card. Slot order is preserved.
 */
export function buildLibraryShopSlots(
  slots: readonly ResolvedShopSlot[],
  resolveReward: ResolveRewardDisplay
): LibraryShopSlotView[] {
  return slots.map((slot) => {
    const rewards: LibraryShopRewardView[] = slot.offers.map((offer) => {
      const { label, iconUrl } = resolveReward(offer)
      return {
        rewardType: offer.rewardType,
        unitId: offer.unitId,
        qty: offer.rewardQty,
        cost: offer.cost,
        maxPerDay: offer.maxPerDay,
        freeOfferType: offer.freeOfferType,
        label,
        iconUrl,
      }
    })

    const uniformCost = rewards.every(
      (reward) => reward.cost.amount === rewards[0]?.cost.amount
    )

    return {
      kind: rewards.length > 1 ? "random" : "single",
      rewards,
      uniformCost,
      costAmount: uniformCost ? rewards[0]?.cost.amount : undefined,
    }
  })
}
