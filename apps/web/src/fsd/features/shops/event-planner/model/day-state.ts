import type { ClassifiedEntry } from "./classify"

/** A planned item's state as the calendar and day chips colour it. */
export type PlannedItemState = "bought" | "toBuy" | "needsReview"

export interface DayState {
  dayIndex: number
  items: { rewardType: string; slotIndex: number; state: PlannedItemState }[]
  /** The chip dot: the most urgent state of the day, `none` when nothing is planned. */
  dot: PlannedItemState | "none"
}

const URGENCY: Record<PlannedItemState, number> = {
  needsReview: 3,
  toBuy: 2,
  bought: 1,
}

const itemState = (entry: ClassifiedEntry): PlannedItemState =>
  entry.state === "done"
    ? "bought"
    : entry.state === "needsReview"
      ? "needsReview"
      : "toBuy"

/** The planned state of every event day (0..dayCount − 1), from the classified cart. */
export function buildDayStates(
  entries: readonly ClassifiedEntry[],
  dayCount: number
): DayState[] {
  return Array.from({ length: dayCount }, (_, dayIndex) => {
    const items = entries
      .filter((entry) => entry.dayIndex === dayIndex)
      .map((entry) => ({
        rewardType: entry.entry.rewardType,
        slotIndex: entry.entry.slotIndex,
        state: itemState(entry),
      }))
    const dot = items.reduce<PlannedItemState | "none">(
      (worst, item) =>
        worst === "none" || URGENCY[item.state] > URGENCY[worst]
          ? item.state
          : worst,
      "none"
    )
    return { dayIndex, items, dot }
  })
}
