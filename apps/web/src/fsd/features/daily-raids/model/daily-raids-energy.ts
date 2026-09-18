import type { BattleId, CampaignId } from "@workspace/game-domain"

import type { Battle } from "@/shared/lib"

export type RealBattleAttempt = {
  tacticusCampaignId: CampaignId
  // Standard/Mirror/Elite/EliteMirror for a standing campaign, Standard/Extremis for a campaign
  // event. Needed alongside battleIndex: a campaign event's two tiers share tacticusCampaignId and
  // an independent, colliding battleIndex sequence, so type is what keeps them apart.
  type: string
  battleIndex: number
  attemptsLeft: number
  attemptsUsed: number
}

function battleAttemptKey(
  campaignGroupId: string,
  type: string,
  battleIndex: number
) {
  return `${campaignGroupId}:${type}:${battleIndex}`
}

/**
 * Maps `{campaignGroupId, type, battleIndex}` to a `BattleId`, covering every campaign — standing and
 * event alike — now that both the served battle catalog and synced battle-attempt records carry a
 * real `battleIndex`/`type` pair instead of only `nodeNumber` (which can't disambiguate an event
 * campaign's challenge node from the regular node it shares a node number with, or its Standard tier
 * from its Extremis tier).
 */
export function buildBattleAttemptIndex(
  battlesById: ReadonlyMap<BattleId, Battle>
): ReadonlyMap<string, BattleId> {
  const index = new Map<string, BattleId>()
  for (const [battleId, battle] of battlesById) {
    index.set(
      battleAttemptKey(battle.campaignGroupId, battle.type, battle.battleIndex),
      battleId
    )
  }
  return index
}

/**
 * Real, account-wide energy spent today: sums `attemptsUsed * energyCost` across every synced
 * attempt — standing or event-campaign — independent of the current project's simulated plan and
 * uncapped by `dailyEnergy`.
 */
export function calculateRealEnergyUsedToday(
  battleAttempts: readonly RealBattleAttempt[],
  battleAttemptIndex: ReadonlyMap<string, BattleId>,
  battlesById: ReadonlyMap<BattleId, Battle>
): number {
  let total = 0
  for (const attempt of battleAttempts) {
    if (attempt.attemptsUsed <= 0) continue
    const battleId = battleAttemptIndex.get(
      battleAttemptKey(
        attempt.tacticusCampaignId,
        attempt.type,
        attempt.battleIndex
      )
    )
    if (!battleId) continue
    const battle = battlesById.get(battleId)
    if (!battle) continue
    total += attempt.attemptsUsed * battle.energyCost
  }
  return total
}

/**
 * Real, per-node attempts remaining today, keyed by `BattleId` — the ground truth for whether a
 * location is actually fully raided (`attemptsLeft === 0`), independent of any simulated plan. Covers
 * every campaign, standing and event alike.
 */
export function buildAttemptsLeftByBattle(
  battleAttempts: readonly RealBattleAttempt[],
  battleAttemptIndex: ReadonlyMap<string, BattleId>
): ReadonlyMap<BattleId, number> {
  const result = new Map<BattleId, number>()
  for (const attempt of battleAttempts) {
    const battleId = battleAttemptIndex.get(
      battleAttemptKey(
        attempt.tacticusCampaignId,
        attempt.type,
        attempt.battleIndex
      )
    )
    if (!battleId) continue
    result.set(battleId, attempt.attemptsLeft)
  }
  return result
}

export type TodaysAttempt = {
  battleId: BattleId
  attemptsUsed: number
  attemptsLeft: number
}

/**
 * Every node the player has actually raided today, account-wide — standing or event-campaign alike —
 * not scoped to the current project's schedule. Backs the "Today's Attempts" section, which lists
 * everything attempted today regardless of relevance, and is the same real signal `ResourceCard` uses
 * to de-dupe an exhausted location out of its normal schedule listing (`attemptsLeft === 0`).
 */
export function buildTodaysAttempts(
  battleAttempts: readonly RealBattleAttempt[],
  battleAttemptIndex: ReadonlyMap<string, BattleId>
): TodaysAttempt[] {
  const result: TodaysAttempt[] = []
  for (const attempt of battleAttempts) {
    if (attempt.attemptsUsed <= 0) continue
    const battleId = battleAttemptIndex.get(
      battleAttemptKey(
        attempt.tacticusCampaignId,
        attempt.type,
        attempt.battleIndex
      )
    )
    if (!battleId) continue
    result.push({
      battleId,
      attemptsUsed: attempt.attemptsUsed,
      attemptsLeft: attempt.attemptsLeft,
    })
  }
  return result
}
