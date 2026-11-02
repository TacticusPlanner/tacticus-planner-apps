import type { IncursionProgressOverrides } from "@/entities/player-data-override"

import {
  shardYield,
  type Incursion,
  type IncursionTier,
  type ShardYield,
} from "./incursions.model"

/** Stars a battle can earn; 3 stars lets later runs raid it. */
export const MAX_STARS = 3

/** Stars per battle, keyed by `battleKey`; a battle missing from the map has none. */
export type IncursionProgressDraft = Readonly<Record<string, number>>

/** Battle ids repeat across tiers (and MoWs), so a battle is keyed by all three. */
export const battleKey = (mowId: string, tierIndex: number, battleId: string) =>
  `${mowId}|${tierIndex}|${battleId}`

function parseBattleKey(key: string) {
  const [mowId = "", tierIndex = "0", ...rest] = key.split("|")
  return { mowId, tierIndex: Number(tierIndex), battleId: rest.join("|") }
}

export const toIncursionProgressDraft = (
  saved: IncursionProgressOverrides
): IncursionProgressDraft =>
  Object.fromEntries(
    saved.battles.map((entry) => [
      battleKey(entry.mowId, entry.tierIndex, entry.battleId),
      entry.stars,
    ])
  )

/** The PUT body: every battle with at least one star, on the revision the draft was built on. */
export const toIncursionProgressPayload = (
  draft: IncursionProgressDraft,
  saved: IncursionProgressOverrides
): IncursionProgressOverrides => ({
  battles: Object.entries(draft)
    .filter(([, stars]) => stars > 0)
    .map(([key, stars]) => ({ ...parseBattleKey(key), stars })),
  revision: saved.revision,
})

/** Two drafts are the same progress when every battle has the same stars, a missing one counting as 0. */
export function sameIncursionProgress(
  a: IncursionProgressDraft,
  b: IncursionProgressDraft
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  return [...keys].every((key) => (a[key] ?? 0) === (b[key] ?? 0))
}

/** One MoW's stars by tier index and battle id. */
export type TierStars = (tierIndex: number, battleId: string) => number

export const starsFor =
  (draft: IncursionProgressDraft, mowId: string): TierStars =>
  (tierIndex, battleId) =>
    draft[battleKey(mowId, tierIndex, battleId)] ?? 0

/**
 * Whether a tier has been finished once: a battle on its last battle step has a star. Tiers can be
 * played in any order, so each tier is judged on its own.
 */
export function tierCleared(tier: IncursionTier, stars: TierStars): boolean {
  const battleNodes = tier.nodes.flatMap((node) =>
    node.kind === "battle" && node.battleId
      ? [{ depth: node.depth, battleId: node.battleId }]
      : []
  )
  const lastDepth = Math.max(-1, ...battleNodes.map((node) => node.depth))
  return battleNodes.some(
    (node) => node.depth === lastDepth && stars(tier.index, node.battleId) > 0
  )
}

/** The star rewards a battle still holds: those for the stars not yet earned (paid once each). */
export function unclaimedStarRewards(
  starRewards: readonly string[],
  stars: number
): string[] {
  return starRewards.slice(Math.max(0, Math.min(stars, MAX_STARS)))
}

/** Every one-time star reward the tier still holds, across all its battles and branches. */
export function tierUnclaimedRewards(
  tier: IncursionTier,
  stars: TierStars
): string[] {
  return tier.battles.flatMap((battle) =>
    unclaimedStarRewards(battle.starRewards, stars(tier.index, battle.id))
  )
}

/** What every run of a tier pays again: its chests. Cleared battles pay no one-time rewards twice. */
export function tierChestRewards(tier: IncursionTier): string[] {
  return tier.nodes.flatMap((node) =>
    node.kind === "chest" ? (node.chest?.rewards ?? []) : []
  )
}

/** The MoW shards (and mythic shards) still on offer as one-time star rewards across all tiers. */
export function remainingShards(
  incursion: Incursion,
  stars: TierStars
): ShardYield {
  return shardYield(
    incursion.mowId,
    incursion.tiers.flatMap((tier) => tierUnclaimedRewards(tier, stars))
  )
}

export const clearedTierCount = (incursion: Incursion, stars: TierStars) =>
  incursion.tiers.filter((tier) => tierCleared(tier, stars)).length

/** Each tier in order with its rarity and whether it's cleared, for a per-tier progress strip. */
export const tierClearance = (incursion: Incursion, stars: TierStars) =>
  incursion.tiers.map((tier) => ({
    index: tier.index,
    rarity: tier.rarity,
    cleared: tierCleared(tier, stars),
  }))

/** The tier to open first: the first one not yet cleared, or the last once all are. */
export function nextTierIndex(incursion: Incursion, stars: TierStars): number {
  const open = incursion.tiers.find((tier) => !tierCleared(tier, stars))
  return (open ?? incursion.tiers.at(-1))?.index ?? 0
}

/** Stars earned across every battle of a tier, out of 3 per battle (the game's "38/45" bar). */
export function tierStarCount(
  tier: IncursionTier,
  stars: TierStars
): { earned: number; max: number } {
  return {
    earned: tier.battles.reduce(
      (sum, battle) => sum + Math.min(MAX_STARS, stars(tier.index, battle.id)),
      0
    ),
    max: tier.battles.length * MAX_STARS,
  }
}

/** The draft entries that set every battle of one tier to `stars` (3 marks it fully cleared, 0 resets it). */
export function tierStarsPatch(
  mowId: string,
  tier: IncursionTier,
  stars: number
): IncursionProgressDraft {
  return Object.fromEntries(
    tier.battles.map((battle) => [
      battleKey(mowId, tier.index, battle.id),
      stars,
    ])
  )
}

/** Stars earned across every tier of one MoW's Incursion. */
export function incursionStarCount(
  incursion: Incursion,
  stars: TierStars
): { earned: number; max: number } {
  return incursion.tiers.reduce(
    (sum, tier) => {
      const count = tierStarCount(tier, stars)
      return { earned: sum.earned + count.earned, max: sum.max + count.max }
    },
    { earned: 0, max: 0 }
  )
}

/**
 * What finishing a tier still pays: its chests (paid every run) plus the one-time star rewards not
 * yet earned. A tier with every battle at 3 stars pays only its chests.
 */
export function tierRewards(tier: IncursionTier, stars: TierStars): string[] {
  return [...tierChestRewards(tier), ...tierUnclaimedRewards(tier, stars)]
}
