import type { GameCatalogEventShop } from "@workspace/game-catalog"

// The event's currency budget (spec event-shop-shopping-list): the estimated income over the whole
// event against what the plan spends. Amounts are in the event currency.

export interface EventShopBudget {
  /** Bought plus still to buy; missed packs were never paid for. */
  spend: number
  /** Σ estimated free income over every week. */
  free: number
  /** `free` plus Σ the bonus shipment over every week. */
  withBonus: number
}

/**
 * The budget, or null when any week of the event has no estimated income: a partial sum would read
 * as a budget for the whole event and understate it.
 */
export function eventShopBudget(
  event: Pick<GameCatalogEventShop, "weeks">,
  totals: { bought: number; stillToBuy: number }
): EventShopBudget | null {
  if (event.weeks.length === 0) return null
  let free = 0
  let bonus = 0
  for (const week of event.weeks) {
    const income = week.estimatedWeeklyIncome
    if (!income) return null
    free += income.free
    bonus += income.bonusShipment
  }
  return {
    spend: totals.bought + totals.stillToBuy,
    free,
    withBonus: free + bonus,
  }
}
