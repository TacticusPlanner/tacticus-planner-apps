import type { BattleId, CampaignId } from "@workspace/game-domain"

import type { Battle } from "@/shared/lib"

export type RealBattleAttempt = {
  tacticusCampaignId: CampaignId
  battleIndex: number
  attemptsUsed: number
  attemptsLeft: number
}

/**
 * Maps `{campaignGroupId, battleIndex}` to a `BattleId`, scoped to standing (non-event) campaigns
 * only — for these, `nodeNumber = battleIndex + 1` always holds (one type per campaign group, no
 * interleaved challenge nodes), so the mapping is a direct lookup. Event campaigns are excluded on
 * purpose: Tacticus reports their Standard/Extremis tiers as two independent `battleIndex`
 * sequences sharing one campaign id, and the synced attempt data doesn't retain which tier an
 * attempt belongs to, so the same `{campaignId, battleIndex}` key can genuinely collide with two
 * different real battles once both tiers are unlocked.
 */
export function buildStandingBattleIndex(
  battlesById: ReadonlyMap<BattleId, Battle>,
  eventCampaignIds: ReadonlySet<string>
): ReadonlyMap<string, BattleId> {
  const index = new Map<string, BattleId>()
  for (const [battleId, battle] of battlesById) {
    if (eventCampaignIds.has(battle.campaignGroupId)) continue
    index.set(`${battle.campaignGroupId}:${battle.nodeNumber - 1}`, battleId)
  }
  return index
}

/**
 * Real, account-wide energy spent today: sums `attemptsUsed * energyCost` across every synced
 * attempt at a standing campaign node, independent of the current project's simulated plan and
 * uncapped by `dailyEnergy`. Event-campaign attempts are skipped — see `buildStandingBattleIndex`.
 */
export function calculateRealEnergyUsedToday(
  battleAttempts: readonly RealBattleAttempt[],
  eventCampaignIds: ReadonlySet<string>,
  standingBattleIndex: ReadonlyMap<string, BattleId>,
  battlesById: ReadonlyMap<BattleId, Battle>
): number {
  let total = 0
  for (const attempt of battleAttempts) {
    if (eventCampaignIds.has(attempt.tacticusCampaignId)) continue
    if (attempt.attemptsUsed <= 0) continue
    const battleId = standingBattleIndex.get(
      `${attempt.tacticusCampaignId}:${attempt.battleIndex}`
    )
    if (!battleId) continue
    const battle = battlesById.get(battleId)
    if (!battle) continue
    total += attempt.attemptsUsed * battle.energyCost
  }
  return total
}

/**
 * Real, per-node attempts remaining today for standing campaigns, keyed by `BattleId` — the ground
 * truth for whether a location is actually fully raided (`attemptsLeft === 0`), independent of any
 * simulated plan. Event-campaign nodes are skipped — see `buildStandingBattleIndex`.
 */
export function buildAttemptsLeftByBattle(
  battleAttempts: readonly RealBattleAttempt[],
  eventCampaignIds: ReadonlySet<string>,
  standingBattleIndex: ReadonlyMap<string, BattleId>
): ReadonlyMap<BattleId, number> {
  const result = new Map<BattleId, number>()
  for (const attempt of battleAttempts) {
    if (eventCampaignIds.has(attempt.tacticusCampaignId)) continue
    const battleId = standingBattleIndex.get(
      `${attempt.tacticusCampaignId}:${attempt.battleIndex}`
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
 * Every standing-campaign node the player has actually raided today, account-wide — not scoped to
 * the current project's schedule. Backs the "Today's Attempts" section, which lists everything
 * attempted today regardless of relevance, and is the same real signal `ResourceCard` uses to
 * de-dupe an exhausted location out of its normal schedule listing (`attemptsLeft === 0`).
 * Event-campaign attempts are skipped — see `buildStandingBattleIndex`.
 */
export function buildTodaysAttempts(
  battleAttempts: readonly RealBattleAttempt[],
  eventCampaignIds: ReadonlySet<string>,
  standingBattleIndex: ReadonlyMap<string, BattleId>
): TodaysAttempt[] {
  const result: TodaysAttempt[] = []
  for (const attempt of battleAttempts) {
    if (eventCampaignIds.has(attempt.tacticusCampaignId)) continue
    if (attempt.attemptsUsed <= 0) continue
    const battleId = standingBattleIndex.get(
      `${attempt.tacticusCampaignId}:${attempt.battleIndex}`
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
