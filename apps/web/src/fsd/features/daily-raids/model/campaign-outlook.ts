import type { Battle } from "@/shared/lib"

/** The remaining campaign battles against the days the event has left. */
export type CampaignOutlook = {
  battles: number
  daysLeft: number
  /** Battles a day to finish them before the event ends. */
  perDay: number
  /** Energy a day for `perDay` battles at the cheapest nodes; null when they don't fit in a day. */
  perDayEnergy: number | null
  /** The most battles a day the daily energy and the nodes' daily caps allow. */
  maxPerDay: number
  /** Battles that don't fit before the event ends at `maxPerDay` (0 when everything fits). */
  shortfall: number
}

type OutlookNode = Pick<Battle, "energyCost" | "dailyAttempts">

/** Fills `battles` over the nodes cheapest first, within their daily caps and `energy`. */
function fillDay(
  nodes: readonly OutlookNode[],
  battles: number,
  energy: number
): { battles: number; energy: number } {
  let left = battles
  let budget = energy
  let taken = 0
  let spent = 0
  for (const node of nodes) {
    if (left <= 0) break
    const raids = Math.min(
      node.dailyAttempts > 0 ? node.dailyAttempts : left,
      Math.floor(budget / node.energyCost),
      left
    )
    if (raids <= 0) continue
    left -= raids
    taken += raids
    budget -= raids * node.energyCost
    spent += raids * node.energyCost
  }
  return { battles: taken, energy: spent }
}

/**
 * The campaign battles still needed over the event's remaining days: how many a day and their
 * energy at the cheapest nodes, and whatever cannot fit before the end at the daily energy (a daily
 * energy of 0 or less is no limit). Null when no battles are left.
 */
export function campaignOutlook(
  nodes: readonly OutlookNode[],
  dailyEnergy: number,
  battles: number,
  daysLeft: number
): CampaignOutlook | null {
  if (battles <= 0) return null
  const days = Math.max(1, Math.ceil(daysLeft))
  const sorted = [...nodes]
    .filter((node) => node.energyCost > 0)
    .sort((a, b) => a.energyCost - b.energyCost)
  const energy = dailyEnergy > 0 ? dailyEnergy : Infinity
  const perDay = Math.ceil(battles / days)
  const maxPerDay = fillDay(sorted, Infinity, energy).battles
  const day = fillDay(sorted, perDay, energy)
  return {
    battles,
    daysLeft: days,
    perDay,
    perDayEnergy: day.battles === perDay ? day.energy : null,
    maxPerDay,
    shortfall: Math.max(0, battles - maxPerDay * days),
  }
}
