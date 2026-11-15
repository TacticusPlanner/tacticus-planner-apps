import { progressionOrder, type Progression } from "@workspace/game-domain"

import { MAX_MEDALS, type QuestScore } from "./quest-score"

/**
 * A battle pays the featured hero's shards once, for its first medal (datamine `linearHeroEvent`
 * `loot.star1`, x1 in game); the second and third medals pay XP and an ability badge instead.
 */
const SHARDS_PER_WON_BATTLE = 1
/** The Quest Bundle adds 2 shards for every medal (datamine `offerBundleBonus.rewardsPerStar`). */
const BUNDLE_SHARDS_PER_MEDAL = 2
const BATTLES_PER_QUEST = 17
const MEDALS_PER_QUEST = BATTLES_PER_QUEST * MAX_MEDALS

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
  /** Medals not yet won across the quest's battles. */
  medalsLeft: number
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

/**
 * Featured-hero shards from medals (one entry per battle): earned, the quest maximum and what is
 * still reachable. 1 shard per won battle, plus 2 per medal with the Quest Bundle (17 or 119 max).
 */
export function questShards(
  medals: readonly number[],
  bundle: boolean
): QuestShards {
  const bundlePerMedal = bundle ? BUNDLE_SHARDS_PER_MEDAL : 0
  const won = medals.filter((count) => count > 0).length
  const medalsWon = medals.reduce(
    (sum, count) => sum + Math.min(Math.max(count, 0), MAX_MEDALS),
    0
  )
  const earned = won * SHARDS_PER_WON_BATTLE + medalsWon * bundlePerMedal
  const max =
    BATTLES_PER_QUEST * SHARDS_PER_WON_BATTLE +
    MEDALS_PER_QUEST * bundlePerMedal
  return {
    earned,
    max,
    reachable: Math.max(0, max - earned),
    medalsLeft: Math.max(0, MEDALS_PER_QUEST - medalsWon),
  }
}

type CrateRewardLike = {
  type: string
  min: number
  max: number
  rarity?: string | null
  maxRarity?: string | null
}

export type QuestRewardsLeft<TReward extends CrateRewardLike> = {
  /** Medals not yet won across the quest's battles. */
  medals: number
  /** The featured hero's shards still reachable. */
  shards: number
  /** Crates not opened yet. */
  crates: number
  /** What the unopened crates hold, summed by reward type and rarity, in first-seen order. */
  rewards: TReward[]
}

/**
 * The one-time rewards still to earn: the shards of the medals not won yet and the contents of the
 * crates not opened yet, summed so the whole remainder reads at a glance.
 */
export function questRewardsLeft<TReward extends CrateRewardLike>(
  shards: QuestShards,
  crates: readonly QuestCrateView<{ rewards: readonly TReward[] }>[] | null
): QuestRewardsLeft<TReward> {
  const unopened = (crates ?? []).filter((view) => !view.opened)
  const summed = new Map<string, TReward>()
  for (const { crate } of unopened) {
    for (const reward of crate.rewards) {
      const key = `${reward.type}:${reward.rarity ?? ""}:${reward.maxRarity ?? ""}`
      const seen = summed.get(key)
      summed.set(
        key,
        seen
          ? { ...seen, min: seen.min + reward.min, max: seen.max + reward.max }
          : { ...reward }
      )
    }
  }
  return {
    medals: shards.medalsLeft,
    shards: shards.reachable,
    crates: unopened.length,
    rewards: [...summed.values()],
  }
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
