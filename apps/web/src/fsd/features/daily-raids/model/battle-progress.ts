import type { BattleProgressOverride } from "@/entities/player-data-override"

/** One reached battle of a standing campaign, as the battle progress dialog lists it. */
export type BattleProgressRow = {
  battleId: string
  nodeNumber: number
  /** An event challenge battle, which sits beside the regular node it shares a number with. */
  challenge: boolean
  /** Reached but never beaten: always played manually, so its medals can't be edited. */
  frontier: boolean
}

/**
 * The battles of one standing campaign track the player has reached, in node order: every battle up to
 * and including the frontier (the synced `highestCompletedBattleIndex`). A track with no progress
 * has none.
 */
export function reachedBattleRows(
  battles: readonly {
    id: string
    campaignGroupId: string
    type: string
    nodeNumber: number
    battleIndex: number
    challenge?: boolean
  }[],
  campaignGroupId: string,
  type: string,
  highestCompletedBattleIndex: number | undefined
): BattleProgressRow[] {
  const highest = highestCompletedBattleIndex ?? -1
  return battles
    .filter(
      (battle) =>
        battle.campaignGroupId === campaignGroupId &&
        battle.type === type &&
        battle.battleIndex <= highest
    )
    .toSorted((a, b) => a.battleIndex - b.battleIndex)
    .map((battle) => ({
      battleId: battle.id,
      nodeNumber: battle.nodeNumber,
      challenge: battle.challenge ?? false,
      frontier: battle.battleIndex === highest,
    }))
}

/**
 * The beaten battles of one campaign-event track, in battle order: regular nodes up to the
 * effective completed count and the challenge battles recorded as completed. Event tracks have no
 * frontier row: the next node has never been beaten, so there is nothing to record for it.
 */
export function beatenEventBattleRows(
  battles: readonly {
    id: string
    campaignGroupId: string
    type: string
    challenge: boolean
    nodeNumber: number
    battleIndex: number
  }[],
  campaignGroupId: string,
  type: string,
  progress:
    | {
        completedBattleCount: number
        completedChallengeBattlesIds: readonly string[]
      }
    | undefined
): BattleProgressRow[] {
  if (!progress) return []
  return battles
    .filter(
      (battle) =>
        battle.campaignGroupId === campaignGroupId &&
        battle.type === type &&
        (battle.challenge
          ? progress.completedChallengeBattlesIds.includes(battle.id)
          : battle.nodeNumber <= progress.completedBattleCount)
    )
    .toSorted((a, b) => a.battleIndex - b.battleIndex)
    .map((battle) => ({
      battleId: battle.id,
      nodeNumber: battle.nodeNumber,
      challenge: battle.challenge,
      frontier: false,
    }))
}

/** A milestone tier a battle can award. */
export type BattleMilestone = Exclude<
  NonNullable<BattleProgressOverride["milestone"]>,
  "None"
>

/** Milestone tiers, lowest first. Earning one also meets the conditions of every lower tier. */
export const MILESTONES: readonly BattleMilestone[] = [
  "Bronze",
  "Silver",
  "Gold",
]

const milestoneRank = (milestone: BattleMilestone | null) =>
  milestone === null ? -1 : MILESTONES.indexOf(milestone)

/** What a battle can award beyond medals: a Lightning Victory and, on event battles, milestones. */
export type BattleTraits = {
  lightningVictoryTurns: number | null
  /** The milestone tiers it awards (Extremis: Gold only; none outside campaign events). */
  milestones: readonly BattleMilestone[]
}

/** The traits of a catalog battle; a battle missing from the catalog has none. */
export function battleTraits(
  battle:
    | {
        lightningVictoryTurns?: number | null
        rewards?: { milestones: readonly { milestone: BattleMilestone }[] }
      }
    | undefined
): BattleTraits {
  return {
    lightningVictoryTurns: battle?.lightningVictoryTurns ?? null,
    milestones: (battle?.rewards?.milestones ?? []).map(
      (reward) => reward.milestone
    ),
  }
}

const bestMilestone = (traits: BattleTraits): BattleMilestone | null =>
  MILESTONES.findLast((tier) => traits.milestones.includes(tier)) ?? null

/** A beaten battle's progress. */
export type BattleProgress = {
  medals: number
  lightningVictory: boolean
  milestone: BattleMilestone | null
}

/**
 * A beaten battle's progress. Whatever has no entry is the best result: 3 medals, a Lightning
 * Victory where the battle has one and its best milestone. An entry records only what fell short.
 */
export function progressOf(
  overrides: readonly BattleProgressOverride[],
  battleId: string,
  traits: BattleTraits
): BattleProgress {
  const entry = overrides.find((candidate) => candidate.battleId === battleId)
  const milestone = entry?.milestone ?? null
  return {
    medals: entry?.medals ?? 3,
    lightningVictory:
      entry?.lightningVictory ?? traits.lightningVictoryTurns !== null,
    milestone:
      milestone === null
        ? bestMilestone(traits)
        : milestone === "None"
          ? null
          : milestone,
  }
}

/** Medals recorded for a battle; a battle with no entry counts as 3 (raidable). */
export function medalsOf(
  overrides: readonly BattleProgressOverride[],
  battleId: string
): number {
  return overrides.find((entry) => entry.battleId === battleId)?.medals ?? 3
}

/** Whether a battle's progress is the best it allows, which needs no entry. */
export function isBestProgress(progress: BattleProgress, traits: BattleTraits) {
  return (
    progress.medals === 3 &&
    progress.lightningVictory === (traits.lightningVictoryTurns !== null) &&
    progress.milestone === bestMilestone(traits)
  )
}

/**
 * Updates a battle's progress. Only what falls short of the best result is stored (null means
 * best), and an entry with nothing short is dropped.
 */
export function withBattleProgress(
  overrides: readonly BattleProgressOverride[],
  battleId: string,
  traits: BattleTraits,
  patch: Partial<BattleProgress>
): BattleProgressOverride[] {
  const next = { ...progressOf(overrides, battleId, traits), ...patch }
  const others = overrides.filter((entry) => entry.battleId !== battleId)
  if (isBestProgress(next, traits)) return others
  const hasLightning = traits.lightningVictoryTurns !== null
  return [
    ...others,
    {
      battleId,
      medals: next.medals,
      lightningVictory:
        next.lightningVictory === hasLightning ? null : next.lightningVictory,
      milestone:
        next.milestone === bestMilestone(traits)
          ? null
          : (next.milestone ?? "None"),
    },
  ]
}

/** Sets a battle's medals, keeping its Lightning Victory and milestone. */
export function withMedals(
  overrides: readonly BattleProgressOverride[],
  battleId: string,
  traits: BattleTraits,
  medals: number
): BattleProgressOverride[] {
  return withBattleProgress(overrides, battleId, traits, { medals })
}

/** Resets a battle to the best result: 3 medals, Lightning Victory and its best milestone. */
export function withBest(
  overrides: readonly BattleProgressOverride[],
  battleId: string
): BattleProgressOverride[] {
  return overrides.filter((entry) => entry.battleId !== battleId)
}

/** A one-time reward amount: a fixed amount when `min === max`, else a range. */
export type OneTimeReward = { id: string; min: number; max: number }

/** The one-time medal rewards a battle still holds: those for more medals than were earned. */
export function unclaimedMedalRewards<
  TReward extends OneTimeReward & { medals: number },
>(rewards: readonly TReward[], medals: number): TReward[] {
  return rewards.filter((reward) => reward.medals > medals)
}

/** The one-time milestone rewards a battle still holds: the tiers above the one recorded. */
export function unclaimedMilestoneRewards<
  TReward extends OneTimeReward & { milestone: BattleMilestone },
>(rewards: readonly TReward[], milestone: BattleMilestone | null): TReward[] {
  return rewards.filter(
    (reward) => milestoneRank(reward.milestone) > milestoneRank(milestone)
  )
}

/** The medal and milestone rewards a beaten battle still holds, given its progress. */
export function unclaimedRewardsOf(
  rewards:
    | {
        medals: readonly (OneTimeReward & { medals: number })[]
        milestones: readonly (OneTimeReward & { milestone: BattleMilestone })[]
      }
    | undefined,
  progress: BattleProgress
): OneTimeReward[] {
  if (!rewards) return []
  return [
    ...unclaimedMedalRewards(rewards.medals, progress.medals),
    ...unclaimedMilestoneRewards(rewards.milestones, progress.milestone),
  ]
}

/** Sums rewards by id, keeping the first-seen order. */
export function sumRewards(rewards: readonly OneTimeReward[]): OneTimeReward[] {
  const byId = new Map<string, OneTimeReward>()
  for (const reward of rewards) {
    const current = byId.get(reward.id)
    byId.set(
      reward.id,
      current
        ? {
            id: reward.id,
            min: current.min + reward.min,
            max: current.max + reward.max,
          }
        : { id: reward.id, min: reward.min, max: reward.max }
    )
  }
  return [...byId.values()]
}

type EventTrackProgress = Parameters<typeof beatenEventBattleRows>[3]

/** One campaign-event track's unclaimed one-time rewards, summed over its beaten battles. */
export type UnclaimedEventRewardTrack<TGroupId extends string = string> = {
  groupId: TGroupId
  type: string
  /** Beaten battles still holding a medal or milestone reward. */
  battleCount: number
  rewards: OneTimeReward[]
}

/**
 * Per campaign-event track the player has beaten battles on, the medal and milestone rewards those
 * battles still hold. Tracks with nothing left to claim are left out.
 */
export function unclaimedEventRewardTracks<TGroupId extends string>(
  definitions: readonly {
    groupId: TGroupId
    releaseType: string
    types: readonly string[]
  }[],
  battles: readonly (Parameters<typeof beatenEventBattleRows>[0][number] & {
    lightningVictoryTurns: number | null
    rewards: {
      medals: readonly (OneTimeReward & { medals: number })[]
      milestones: readonly (OneTimeReward & { milestone: BattleMilestone })[]
    }
  })[],
  trackProgress: (groupId: string, type: string) => EventTrackProgress,
  overrides: readonly BattleProgressOverride[]
): UnclaimedEventRewardTrack<TGroupId>[] {
  const battlesById = new Map<string, (typeof battles)[number]>(
    battles.map((battle) => [battle.id, battle])
  )
  return definitions
    .filter((definition) => definition.releaseType === "event")
    .flatMap((definition) =>
      definition.types.map((type) => {
        const perBattle = beatenEventBattleRows(
          battles,
          definition.groupId,
          type,
          trackProgress(definition.groupId, type)
        ).map((row) => {
          const battle = battlesById.get(row.battleId)
          return unclaimedRewardsOf(
            battle?.rewards,
            progressOf(overrides, row.battleId, battleTraits(battle))
          )
        })
        return {
          groupId: definition.groupId,
          type,
          battleCount: perBattle.filter((rewards) => rewards.length > 0).length,
          rewards: sumRewards(perBattle.flat()),
        }
      })
    )
    .filter((track) => track.battleCount > 0)
}

/** Medals and Lightning Victories earned on one campaign track, against what it offers. */
export type TrackMedalStats = {
  medals: number
  maxMedals: number
  lightningVictories: number
  maxLightningVictories: number
}

/**
 * Medal and Lightning Victory completion of one standing campaign track: every beaten battle (below
 * the frontier) counts its recorded progress, which defaults to the best; the frontier and unreached
 * battles count nothing.
 */
export function trackMedalStats(
  battles: readonly {
    id: string
    battleIndex: number
    lightningVictoryTurns: number | null
  }[],
  highestCompletedBattleIndex: number | undefined,
  overrides: readonly BattleProgressOverride[]
): TrackMedalStats {
  const highest = highestCompletedBattleIndex ?? -1
  const stats: TrackMedalStats = {
    medals: 0,
    maxMedals: battles.length * 3,
    lightningVictories: 0,
    maxLightningVictories: battles.filter(
      (battle) => battle.lightningVictoryTurns !== null
    ).length,
  }
  for (const battle of battles) {
    if (battle.battleIndex >= highest) continue
    const progress = progressOf(overrides, battle.id, battleTraits(battle))
    stats.medals += progress.medals
    if (progress.lightningVictory) stats.lightningVictories += 1
  }
  return stats
}

/** Completion counted in medals and Lightning Victories: each earned one against all on offer. */
export function medalCompletion(stats: TrackMedalStats): {
  done: number
  total: number
} {
  return {
    done: stats.medals + stats.lightningVictories,
    total: stats.maxMedals + stats.maxLightningVictories,
  }
}
