import {
  eventDay,
  resolveEventDaySlots,
  type EventShopDay,
  type GameCatalogEventShop,
  type ShopLockContext,
} from "@workspace/game-catalog"

import { withoutFreebies } from "./freebie"

/** One offer on one event day. */
interface EventOfferDay extends EventShopDay {
  slotIndex: number
  rewardType: string
  /** Set for shard and mythic-shard rewards. */
  unitId?: string
  /** Reward units per pack. */
  qty: number
  cost: number
  cap: number
  past: boolean
}

/** Every day a reward is sold, in day order. */
export interface EventOfferGroup {
  rewardType: string
  unitId?: string
  days: EventOfferDay[]
}

/**
 * Every offer of the event, grouped by reward with the days it is sold (spec event-shop-planner: shop
 * search). With the roster's lock context only the offers the player gets are listed; without it, every
 * option of each slot. The page filters the groups by the reward's name.
 */
export function eventOfferGroups(
  event: GameCatalogEventShop,
  {
    todayIndex,
    powerLevel,
    lockContext,
    now,
  }: {
    todayIndex: number
    powerLevel?: number
    lockContext?: ShopLockContext
    now?: number
  }
): EventOfferGroup[] {
  const groups = new Map<string, EventOfferGroup>()
  for (let dayIndex = 0; dayIndex < event.dayCount; dayIndex++) {
    const day = eventDay(event, dayIndex)
    // The daily freebie is claimed in game, not bought, so search leaves it out.
    for (const slot of withoutFreebies(
      event,
      resolveEventDaySlots(event, dayIndex, { powerLevel, lockContext, now })
    )) {
      for (const offer of slot.offers) {
        let group = groups.get(offer.rewardType)
        if (!group) {
          group = {
            rewardType: offer.rewardType,
            unitId: offer.unitId,
            days: [],
          }
          groups.set(offer.rewardType, group)
        }
        group.days.push({
          ...day,
          slotIndex: slot.slotIndex,
          rewardType: offer.rewardType,
          unitId: offer.unitId,
          qty: offer.rewardQty,
          cost: offer.cost.amount,
          cap: offer.maxPerDay,
          past: dayIndex < todayIndex,
        })
      }
    }
  }
  return [...groups.values()]
}
