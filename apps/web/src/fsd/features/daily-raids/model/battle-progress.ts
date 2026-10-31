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

export type BattleMilestone = NonNullable<BattleProgressOverride["milestone"]>

/** Milestone tiers, lowest first. Earning one also meets the conditions of every lower tier. */
export const MILESTONES: readonly BattleMilestone[] = [
  "Bronze",
  "Silver",
  "Gold",
]

const milestoneRank = (milestone: BattleMilestone | null) =>
  milestone === null ? -1 : MILESTONES.indexOf(milestone)

/** A battle's recorded progress, with the defaults for a battle that has no entry. */
export type BattleProgress = {
  medals: number
  lightningVictory: boolean
  milestone: BattleMilestone | null
}

/**
 * A battle's recorded progress. A battle with no entry counts as 3 medals (raidable), with no
 * Lightning Victory and no milestone recorded.
 */
export function progressOf(
  overrides: readonly BattleProgressOverride[],
  battleId: string
): BattleProgress {
  const entry = overrides.find((candidate) => candidate.battleId === battleId)
  return {
    medals: entry?.medals ?? 3,
    lightningVictory: entry?.lightningVictory === true,
    milestone: entry?.milestone ?? null,
  }
}

/** Medals recorded for a battle; a battle with no entry counts as 3 (raidable). */
export function medalsOf(
  overrides: readonly BattleProgressOverride[],
  battleId: string
): number {
  return progressOf(overrides, battleId).medals
}

/**
 * Updates a battle's progress. An entry at 3 medals with nothing else recorded is dropped, so the
 * saved list only holds what differs from the default.
 */
export function withBattleProgress(
  overrides: readonly BattleProgressOverride[],
  battleId: string,
  patch: Partial<BattleProgress>
): BattleProgressOverride[] {
  const next = { ...progressOf(overrides, battleId), ...patch }
  const others = overrides.filter((entry) => entry.battleId !== battleId)
  const isDefault =
    next.medals === 3 && !next.lightningVictory && next.milestone === null
  return isDefault
    ? others
    : [
        ...others,
        {
          battleId,
          medals: next.medals,
          lightningVictory: next.lightningVictory ? true : null,
          milestone: next.milestone,
        },
      ]
}

/** Sets a battle's medals, keeping its Lightning Victory and milestone. */
export function withMedals(
  overrides: readonly BattleProgressOverride[],
  battleId: string,
  medals: number
): BattleProgressOverride[] {
  return withBattleProgress(overrides, battleId, { medals })
}

/**
 * Records a Gold milestone, which needs a Lightning Victory with no borrowed characters and no
 * deaths, so it also means 3 medals and a Lightning Victory.
 */
export function withGold(
  overrides: readonly BattleProgressOverride[],
  battleId: string
): BattleProgressOverride[] {
  return withBattleProgress(overrides, battleId, {
    medals: 3,
    lightningVictory: true,
    milestone: "Gold",
  })
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
          const rewards = battlesById.get(row.battleId)?.rewards
          const current = progressOf(overrides, row.battleId)
          return rewards
            ? [
                ...unclaimedMedalRewards(rewards.medals, current.medals),
                ...unclaimedMilestoneRewards(
                  rewards.milestones,
                  current.milestone
                ),
              ]
            : []
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
