import { useOutletContext } from "react-router"
import type { NpcStorageModel } from "@workspace/game-catalog"

import type { TierStars } from "../../model/incursion-progress.model"
import type { Incursion, IncursionTier } from "../../model/incursions.model"
import type { IncursionPlans } from "../../model/use-incursion-plans"

export const INCURSIONS_PATH = "/my-game/incursions"

/** A MoW's tier list. */
export const incursionPath = (mowId: string) =>
  `${INCURSIONS_PATH}/${encodeURIComponent(mowId)}`

/** One tier's page, numbered from 1 as the game does ("Tier 13"). */
export const incursionTierPath = (mowId: string, tierIndex: number) =>
  `${incursionPath(mowId)}/${tierIndex + 1}`

/** The player's stars and how to change them; absent while signed out. */
export type IncursionProgress = {
  starsOf: (mowId: string) => TierStars
  setBattleStars: (
    mowId: string,
    tierIndex: number,
    battleId: string,
    stars: number
  ) => void
  /** Sets every battle of the tier at once: 3 marks it fully cleared, 0 resets it. */
  setTierStars: (mowId: string, tier: IncursionTier, stars: number) => void
}

/** What the Incursion section hands its pages: data, estimates and progress, shared across them. */
export type IncursionsOutlet = {
  incursions: readonly Incursion[]
  npcsById: ReadonlyMap<string, NpcStorageModel>
  ownedMowIds: ReadonlySet<string>
  plans: IncursionPlans
  progress?: IncursionProgress
}

export const useIncursionsOutlet = () => useOutletContext<IncursionsOutlet>()

/** The entries either side of `at` in `list`, for prev/next buttons. */
export function neighbours<T>(list: readonly T[], at: number) {
  return {
    previous: at > 0 ? list[at - 1] : undefined,
    next: at >= 0 && at < list.length - 1 ? list[at + 1] : undefined,
  }
}

/** A tier by its 1-based number from the URL. */
export function tierByNumber(
  incursion: Incursion,
  number: string | undefined
): IncursionTier | undefined {
  const index = Number(number) - 1
  return Number.isInteger(index)
    ? incursion.tiers.find((tier) => tier.index === index)
    : undefined
}

/** Tiers grouped by rarity, the hardest group first, as the game lists them. */
export function tierGroups(
  tiers: readonly IncursionTier[]
): { rarity: string; tiers: IncursionTier[] }[] {
  const groups: { rarity: string; tiers: IncursionTier[] }[] = []
  for (const tier of [...tiers].sort((a, b) => b.index - a.index)) {
    const last = groups.at(-1)
    if (last?.rarity === tier.rarity) last.tiers.push(tier)
    else groups.push({ rarity: tier.rarity, tiers: [tier] })
  }
  return groups
}
