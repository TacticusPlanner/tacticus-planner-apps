import { progressionOrder, type Progression } from "@workspace/game-domain"

import type { QuestScore } from "./quest-score"

/** Shards per medal without the Quest Bundle; the bundle adds 2 per medal (wiki). */
const SHARDS_PER_MEDAL = 1
const BUNDLE_MULTIPLIER = 3
const MEDALS_PER_QUEST = 51

export type QuestCrateView<TCrate> = {
  crate: TCrate
  opened: boolean
  /** The next crate to open, with the points it still needs. */
  next: boolean
  pointsToGo: number
}

export type QuestShards = {
  earned: number
  max: number
  reachable: number
}

/** The crate track against the score: opened, the next one and the points it needs. */
export function crateTrack<TCrate extends { number: number; points: number }>(
  crates: readonly TCrate[],
  score: Pick<QuestScore, "total" | "nextCrate">
): QuestCrateView<TCrate>[] {
  return [...crates]
    .sort((a, b) => a.number - b.number)
    .map((crate) => ({
      crate,
      opened: crate.points <= score.total,
      next: score.nextCrate?.number === crate.number,
      pointsToGo: Math.max(0, crate.points - score.total),
    }))
}

/** Featured-hero shards from medals: earned, the quest maximum and what is still reachable. */
export function questShards(
  medals: readonly number[],
  bundle: boolean
): QuestShards {
  const multiplier = SHARDS_PER_MEDAL * (bundle ? BUNDLE_MULTIPLIER : 1)
  const earned = medals.reduce((sum, count) => sum + count, 0) * multiplier
  const max = MEDALS_PER_QUEST * multiplier
  return { earned, max, reachable: Math.max(0, max - earned) }
}

export type ShardMeaning =
  | {
      kind: "unlock"
      cost: number
      /** Shards held plus the quest maximum, against the unlock cost (negative: short). */
      spare: number
      /** Whether the shards held plus those earned so far already unlock the hero. */
      reachedSoFar: boolean
    }
  | {
      kind: "ascend"
      /** The progression steps the shards held plus the maximum cover, in order. */
      steps: Progression[]
      /** How many of `steps` the shards held plus those earned so far cover. */
      reachedSoFar: number
      /** Shards left over past the last covered step. */
      spare: number
    }
  | { kind: "unknown" }

/**
 * What the quest's shards mean for the featured hero (design D2), over the goal cost tables: for a
 * hero not owned, the unlock cost of its starting rarity; for an owned hero, the walk over
 * `ascension-costs` from its current progression that the shards cover. A step that needs mythic
 * shards ends the walk, since the quest pays regular shards. Orbs are not counted.
 */
export function shardMeaning(params: {
  shards: QuestShards
  owned: { progression: Progression; shards: number } | null
  notOwnedShards: number | null
  initialRarity: string | undefined
  unlockCostByRarity: ReadonlyMap<string, { shards: number }> | undefined
  ascensionCostByProgression:
    ReadonlyMap<string, { shards: number; mythicShards: number }> | undefined
}): ShardMeaning {
  const { shards, owned } = params
  if (!owned) {
    const cost =
      params.initialRarity !== undefined
        ? params.unlockCostByRarity?.get(params.initialRarity)?.shards
        : undefined
    if (cost === undefined || params.notOwnedShards === null) {
      return { kind: "unknown" }
    }
    return {
      kind: "unlock",
      cost,
      spare: params.notOwnedShards + shards.max - cost,
      reachedSoFar: params.notOwnedShards + shards.earned >= cost,
    }
  }
  const costs = params.ascensionCostByProgression
  if (!costs) return { kind: "unknown" }
  const walk = (available: number) => {
    const steps: Progression[] = []
    let left = available
    for (
      let index = progressionOrder.indexOf(owned.progression) + 1;
      index < progressionOrder.length;
      index++
    ) {
      const step = progressionOrder[index]!
      const cost = costs.get(step)
      if (!cost || cost.mythicShards > 0 || cost.shards > left) break
      left -= cost.shards
      steps.push(step)
    }
    return { steps, left }
  }
  const full = walk(owned.shards + shards.max)
  return {
    kind: "ascend",
    steps: full.steps,
    reachedSoFar: walk(owned.shards + shards.earned).steps.length,
    spare: full.left,
  }
}
