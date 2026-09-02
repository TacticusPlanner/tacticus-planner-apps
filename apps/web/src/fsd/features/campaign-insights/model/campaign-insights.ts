import {
  campaignDescriptor,
  campaignIcon,
  type CampaignDescriptor,
} from "@workspace/game-catalog"
import {
  rarityRank,
  type BattleId,
  type CampaignId,
  type Rarity,
  type UpgradeId,
} from "@workspace/game-domain"

import type { Battle, FarmLocation } from "@/shared/lib"

// Promoted from pages/library (Character Lookup, its original single consumer) once the Goals Insights
// view (plan В§16 phase 7) became a second вЂ” a page can't import another page's internals under this
// repo's FSD rules, and duplicating ~250 lines of scoring logic isn't reasonable the way the small
// `dropRate` helper is elsewhere. It lives in the features layer (rather than shared/lib alongside
// `Battle`/`FarmLocation`) since both consuming pages (goals, lookup) may import from `features/`.

// `TId` defaults to `UpgradeId` (Character Lookup, the original single consumer, never needs to name
// it explicitly) but widens to any resource-id type вЂ” e.g. Goals Insights (plan В§16 phase 7) scores
// farmable character shards through the same engine via `EstimateResourceId`, which a plain `UpgradeId`
// can't represent.
export interface CampaignInsightNeed<TId extends string = UpgradeId> {
  id: TId
  count: number
}

/** The minimal shape `computeCampaignInsights` needs from an upgrade (or other farmable resource)
 *  record вЂ” any richer record type (e.g. the rank-lookup feature's `UpgradeWithFarmLocations`)
 *  satisfies this structurally. */
export interface CampaignInsightUpgrade<TId extends string = UpgradeId> {
  id: TId
  rarity: Rarity
  farmLocations: FarmLocation[]
}

/** One resource+location's contribution to a campaign insight's score, for the expanded breakdown. */
export interface CampaignInsightContribution<TId extends string = UpgradeId> {
  upgradeId: TId
  battleId: BattleId
  campaignGroupId: CampaignId
  type: string
  challenge: boolean
  nodeNumber: number
  count: number
  dropRate: number
  value: number
}

/** An event insight's score, broken down by its "Standard" vs "Extremis" difficulty tier. */
interface CampaignInsightTierScore {
  tier: "standard" | "extremis"
  score: number
}

export interface CampaignInsight<TId extends string = UpgradeId> {
  id: string
  label: string
  icon?: string
  /** Value-per-energy score вЂ” a relative ranking signal, not a meaningful absolute number. */
  score: number
  /** Only set for event insights: the combined score split back into its Standard/Extremis tiers. */
  tierScores?: CampaignInsightTierScore[]
  /** Every resource+location that fed into this score, sorted by contribution value descending. */
  contributions: CampaignInsightContribution<TId>[]
}

/**
 * The chance a single run drops this location's material: 1 for a guaranteed drop, the
 * precomputed `effectiveRate` when present, else the raw `numerator/denominator` fraction, else 0
 * for a location with no rate info at all.
 */
export function dropRate(location: FarmLocation): number {
  if (location.guaranteed) return 1
  if (location.effectiveRate != null) return location.effectiveRate
  if (location.numerator != null && location.denominator) {
    return location.numerator / location.denominator
  }
  return 0
}

// Event types fold into two tiers for scoring purposes: "eventStandard" is "standard",
// "eventExtremis" is "extremis" (the "challenge" flag doesn't split into its own tier).
function eventTier(
  campaignGroupId: CampaignId,
  type: string,
  challenge: boolean
): "standard" | "extremis" | undefined {
  const descriptor = campaignDescriptor(campaignGroupId, type, challenge)
  if (!descriptor) return undefined
  return descriptor.difficultyToken === "eventExtremis"
    ? "extremis"
    : "standard"
}

interface TierAccumulator {
  value: number
  energyByBattle: Map<string, number>
}

interface ChipAccumulator<TId extends string> {
  label: string
  icon?: string
  isEvent: boolean
  value: number
  energyByBattle: Map<string, number>
  contributions: CampaignInsightContribution<TId>[]
  tiers: Map<"standard" | "extremis", TierAccumulator>
}

/**
 * Ranks each campaign a character's still-needed base upgrades can drop from, by a value-per-energy
 * score: `ОЈ(rarityWeight Г— count Г— dropRate)` across every upgrade droppable there, divided by the
 * summed energy cost of the chip's distinct battle nodes (a node's cost counts once even if several
 * needed upgrades drop from it). Regular campaigns are kept one chip per difficulty (Standard and
 * Elite farm different node sets), but event difficulty tiers (Standard/Extremis/Challenge) are
 * merged into one chip per event so the event's total usefulness isn't split across its tiers вЂ”
 * each event insight also carries a `tierScores` breakdown so the Standard and Extremis portions of
 * that combined score stay visible. Regular campaigns and events are ranked and returned separately
 * since events are time-limited and shouldn't compete with standing campaigns.
 *
 * `resolveLabel` translates a chip's `CampaignDescriptor` into display text вЂ” kept as a callback
 * (rather than importing react-i18next here) so this calc function stays pure/i18n-free and
 * testable without a translation setup; callers pass `useCampaignDisplay()`'s bound resolvers.
 */
export function computeCampaignInsights<
  TId extends string = UpgradeId,
  U extends CampaignInsightUpgrade<TId> = CampaignInsightUpgrade<TId>,
>(
  needs: CampaignInsightNeed<TId>[],
  upgradesById: ReadonlyMap<TId, U>,
  battlesById: ReadonlyMap<BattleId, Battle>,
  isEventGroup: (campaignGroupId: CampaignId) => boolean,
  resolveLabel: (descriptor: CampaignDescriptor, isEvent: boolean) => string,
  topN = 3
): {
  campaignInsights: CampaignInsight<TId>[]
  eventInsights: CampaignInsight<TId>[]
} {
  const chips = new Map<string, ChipAccumulator<TId>>()

  for (const need of needs) {
    const upgrade = upgradesById.get(need.id)
    if (!upgrade) continue
    const weight = rarityRank(upgrade.rarity) + 1

    for (const location of upgrade.farmLocations) {
      const battle = battlesById.get(location.battleId)
      if (!battle) continue

      const isEvent = isEventGroup(battle.campaignGroupId)
      const key = isEvent
        ? battle.campaignGroupId
        : `${battle.campaignGroupId}:${battle.type}`
      let chip = chips.get(key)
      if (!chip) {
        const descriptor = campaignDescriptor(
          battle.campaignGroupId,
          battle.type,
          battle.challenge
        )
        if (!descriptor) continue
        chip = {
          label: resolveLabel(descriptor, isEvent),
          icon: campaignIcon(
            battle.campaignGroupId,
            battle.type,
            battle.challenge
          ),
          isEvent,
          value: 0,
          energyByBattle: new Map(),
          contributions: [],
          tiers: new Map(),
        }
        chips.set(key, chip)
      }

      const rate = dropRate(location)
      const value = weight * need.count * rate
      chip.value += value
      chip.energyByBattle.set(location.battleId, battle.energyCost)
      chip.contributions.push({
        upgradeId: upgrade.id,
        battleId: location.battleId,
        campaignGroupId: battle.campaignGroupId,
        type: battle.type,
        challenge: battle.challenge,
        nodeNumber: battle.nodeNumber,
        count: need.count,
        dropRate: rate,
        value,
      })

      if (isEvent) {
        const tier = eventTier(
          battle.campaignGroupId,
          battle.type,
          battle.challenge
        )
        if (tier) {
          let tierAcc = chip.tiers.get(tier)
          if (!tierAcc) {
            tierAcc = { value: 0, energyByBattle: new Map() }
            chip.tiers.set(tier, tierAcc)
          }
          tierAcc.value += value
          tierAcc.energyByBattle.set(location.battleId, battle.energyCost)
        }
      }
    }
  }

  const tierOrder: ("standard" | "extremis")[] = ["standard", "extremis"]
  const scoreOf = (value: number, energyByBattle: Map<string, number>) => {
    const totalEnergy = [...energyByBattle.values()].reduce(
      (sum, cost) => sum + cost,
      0
    )
    return totalEnergy > 0 ? value / totalEnergy : 0
  }

  const scored = [...chips.entries()].map(([id, chip]) => ({
    id,
    label: chip.label,
    icon: chip.icon,
    isEvent: chip.isEvent,
    score: scoreOf(chip.value, chip.energyByBattle),
    tierScores: chip.isEvent
      ? tierOrder
          .filter((tier) => chip.tiers.has(tier))
          .map((tier) => {
            const tierAcc = chip.tiers.get(tier)!
            return {
              tier,
              score: scoreOf(tierAcc.value, tierAcc.energyByBattle),
            }
          })
      : undefined,
    contributions: [...chip.contributions].sort((a, b) => b.value - a.value),
  }))

  const byScoreDesc = (a: { score: number }, b: { score: number }) =>
    b.score - a.score
  const toInsight = ({
    id,
    label,
    icon,
    score,
    tierScores,
    contributions,
  }: (typeof scored)[number]): CampaignInsight<TId> => ({
    id,
    label,
    icon,
    score,
    tierScores,
    contributions,
  })

  return {
    campaignInsights: scored
      .filter((c) => !c.isEvent)
      .sort(byScoreDesc)
      .slice(0, topN)
      .map(toInsight),
    eventInsights: scored
      .filter((c) => c.isEvent)
      .sort(byScoreDesc)
      .slice(0, topN)
      .map(toInsight),
  }
}
