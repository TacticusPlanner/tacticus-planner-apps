import type {
  GameCatalogEventShop,
  ResolvedEventSlot,
} from "@workspace/game-catalog"

/** The daily freebie. The data sells gold ×1 for 1 event currency with 5 event currency as its free
 *  offer; in game it is the day's free event currency ×5, claimed every day, so it is never planned and
 *  is shown as that currency. */
export interface DailyFreebie {
  cost: number
  back: number
}

/** The freebie terms when `rewardType` in `slot` is the daily freebie, else null. */
export function dailyFreebie(
  event: Pick<GameCatalogEventShop, "currency">,
  slot: ResolvedEventSlot,
  rewardType: string
): DailyFreebie | null {
  const variant = slot.variants.find(
    (candidate) =>
      candidate.reward.type === rewardType &&
      candidate.cost.currency === event.currency &&
      candidate.freeOffer?.type === event.currency &&
      candidate.freeOffer.qty > candidate.cost.amount
  )
  return variant?.freeOffer
    ? { cost: variant.cost.amount, back: variant.freeOffer.qty }
    : null
}

/** The slots without the daily freebie, for what the player can buy (search, Coverage). */
export function withoutFreebies(
  event: Pick<GameCatalogEventShop, "currency">,
  slots: readonly ResolvedEventSlot[]
): ResolvedEventSlot[] {
  return slots.map((slot) => ({
    ...slot,
    offers: slot.offers.filter(
      (offer) => !dailyFreebie(event, slot, offer.rewardType)
    ),
  }))
}
