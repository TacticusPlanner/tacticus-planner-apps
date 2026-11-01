import type { IncursionProgressOverrides } from "@/entities/player-data-override"

import {
  bestPathShards,
  type Incursion,
  type ShardYield,
} from "./incursions.model"

/** Tiers cleared per MoW id; a MoW missing from the map has cleared none. */
export type IncursionProgressDraft = Readonly<Record<string, number>>

export const toIncursionProgressDraft = (
  saved: IncursionProgressOverrides
): IncursionProgressDraft =>
  Object.fromEntries(
    saved.progress.map((entry) => [entry.mowId, entry.tiersCleared])
  )

/** The PUT body: every MoW with at least one cleared tier, on the revision the draft was built on. */
export const toIncursionProgressPayload = (
  draft: IncursionProgressDraft,
  saved: IncursionProgressOverrides
): IncursionProgressOverrides => ({
  progress: Object.entries(draft)
    .filter(([, tiersCleared]) => tiersCleared > 0)
    .map(([mowId, tiersCleared]) => ({ mowId, tiersCleared })),
  revision: saved.revision,
})

/** Two drafts are the same progress when every MoW has the same count, a missing MoW counting as 0. */
export function sameIncursionProgress(
  a: IncursionProgressDraft,
  b: IncursionProgressDraft
): boolean {
  const ids = new Set([...Object.keys(a), ...Object.keys(b)])
  return [...ids].every((id) => (a[id] ?? 0) === (b[id] ?? 0))
}

/** The MoW shards still on offer: the best path of every tier after the first `tiersCleared`. */
export function remainingShards(
  incursion: Incursion,
  tiersCleared: number
): ShardYield {
  return incursion.tiers
    .slice(tiersCleared)
    .map((tier) => bestPathShards(incursion.mowId, tier))
    .reduce(
      (total, value) => ({
        shards: total.shards + value.shards,
        mythicShards: total.mythicShards + value.mythicShards,
      }),
      { shards: 0, mythicShards: 0 }
    )
}

/** The index of the tier to open first: the next one to play, or the last once all are cleared. */
export const nextTierIndex = (incursion: Incursion, tiersCleared: number) =>
  incursion.tiers[Math.min(tiersCleared, incursion.tiers.length - 1)]?.index ??
  0
