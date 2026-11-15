import {
  eventDay,
  type EventShopDay,
  type GameCatalogEventShop,
  type ResolvedEventSlot,
} from "@workspace/game-catalog"

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
    slotsByDay,
  }: {
    todayIndex: number
    /** Each event day's purchasable slots (resolved for the roster, freebies left out: the daily freebie is
     *  claimed in game, not bought). */
    slotsByDay: readonly (readonly ResolvedEventSlot[])[]
  }
): EventOfferGroup[] {
  const groups = new Map<string, EventOfferGroup>()
  for (let dayIndex = 0; dayIndex < event.dayCount; dayIndex++) {
    const day = eventDay(event, dayIndex)
    for (const slot of slotsByDay[dayIndex] ?? []) {
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
