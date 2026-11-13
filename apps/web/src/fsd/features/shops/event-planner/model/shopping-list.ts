import type { ClassifiedEntry } from "./classify"

// The shopping list's groups and totals, all reduced from the one classification (spec
// event-shop-shopping-list). Amounts are in the event currency.

interface ShoppingTotals {
  stillToBuy: number
  bought: number
  missed: number
  /** stillToBuy + bought + missed. */
  inCart: number
}

export interface DayGroup {
  dayIndex: number
  entries: ClassifiedEntry[]
  /** Σ to-buy packs × cost of the group. */
  stillToBuy: number
}

interface WeekGroup {
  week: number
  days: DayGroup[]
}

export interface ShoppingList {
  totals: ShoppingTotals
  /** Past entries not fully bought, oldest first. */
  needsReview: ClassifiedEntry[]
  /** Today's entries that still have packs to buy (empty when the event isn't running). */
  today: DayGroup | null
  /** Later days with packs to buy, by day. */
  later: DayGroup[]
  /** Fully bought entries, by day. */
  done: ClassifiedEntry[]
  doneBought: number
  /** Every entry by week and day (the All view). */
  all: WeekGroup[]
  ended: boolean
  /** Weeks holding any entry (each gets "Clear week …"). */
  weeks: number[]
}

const toBuyCost = (entry: ClassifiedEntry) =>
  entry.toBuyPacks * entry.costPerPack

function groupByDay(entries: readonly ClassifiedEntry[]): DayGroup[] {
  const byDay = new Map<number, ClassifiedEntry[]>()
  for (const entry of entries) {
    const bucket = byDay.get(entry.dayIndex)
    if (bucket) bucket.push(entry)
    else byDay.set(entry.dayIndex, [entry])
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dayIndex, dayEntries]) => ({
      dayIndex,
      entries: dayEntries,
      stillToBuy: dayEntries.reduce((sum, entry) => sum + toBuyCost(entry), 0),
    }))
}

/**
 * Builds every group from the classified cart. `todayIndex` is the event day of now and `dayCount` the
 * event's length; an event whose last day is past is `ended`.
 */
export function buildShoppingList(
  entries: readonly ClassifiedEntry[],
  todayIndex: number,
  dayCount: number
): ShoppingList {
  const totals: ShoppingTotals = {
    stillToBuy: 0,
    bought: 0,
    missed: 0,
    inCart: 0,
  }
  for (const entry of entries) {
    totals.stillToBuy += toBuyCost(entry)
    totals.bought += entry.boughtPacks * entry.costPerPack
    totals.missed += entry.missedPacks * entry.costPerPack
  }
  totals.inCart = totals.stillToBuy + totals.bought + totals.missed

  const upcoming = groupByDay(
    entries.filter((entry) => entry.state === "upcoming")
  )
  const done = entries.filter((entry) => entry.state === "done")
  const byWeek = new Map<number, ClassifiedEntry[]>()
  for (const entry of entries) {
    const bucket = byWeek.get(entry.entry.week)
    if (bucket) bucket.push(entry)
    else byWeek.set(entry.entry.week, [entry])
  }

  return {
    totals,
    needsReview: entries.filter((entry) => entry.state === "needsReview"),
    today: upcoming.find((group) => group.dayIndex === todayIndex) ?? null,
    later: upcoming.filter((group) => group.dayIndex > todayIndex),
    done,
    doneBought: done.reduce(
      (sum, entry) => sum + entry.boughtPacks * entry.costPerPack,
      0
    ),
    all: [...byWeek.entries()]
      .sort(([a], [b]) => a - b)
      .map(([week, weekEntries]) => ({ week, days: groupByDay(weekEntries) })),
    ended: todayIndex >= dayCount,
    weeks: [...byWeek.keys()].sort((a, b) => a - b),
  }
}

/** What Clear week would remove from `week`: to-buy entries, and the unbought packs of Needs review
 *  entries (counts and cost for the confirm dialog). */
export function clearWeekSummary(
  entries: readonly ClassifiedEntry[],
  week: number
) {
  const inWeek = entries.filter((entry) => entry.entry.week === week)
  const toBuy = inWeek.filter((entry) => entry.state === "upcoming")
  const review = inWeek.filter((entry) => entry.state === "needsReview")
  return {
    toBuyCount: toBuy.length,
    toBuyCost: toBuy.reduce((sum, entry) => sum + toBuyCost(entry), 0),
    reviewCount: review.length,
    reviewBoughtPacks: review.reduce(
      (sum, entry) => sum + entry.boughtPacks,
      0
    ),
  }
}
