import {
  campaignIcon,
  campaignLabel,
  campaignShortLabel,
  rarityRank,
} from "@workspace/game-catalog"

import type { BaseUpgradeNeed, UpgradeLike } from "./rank-lookup-calc.types"

export interface FarmLocationLike {
  battleId: string
  guaranteed: boolean
  effectiveRate: number | null
  numerator: number | null
  denominator: number | null
}

export interface BattleLike {
  campaignGroupId: string
  difficulty: string
  nodeNumber: number
  energyCost: number
}

export interface UpgradeWithFarmLocations extends UpgradeLike {
  farmLocations: FarmLocationLike[]
}

/** One upgrade+location's contribution to a campaign insight's score, for the expanded breakdown. */
export interface CampaignInsightContribution {
  upgradeId: string
  battleId: string
  campaignGroupId: string
  difficulty: string
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

export interface CampaignInsight {
  id: string
  label: string
  icon?: string
  /** Value-per-energy score — a relative ranking signal, not a meaningful absolute number. */
  score: number
  /** Only set for event insights: the combined score split back into its Standard/Extremis tiers. */
  tierScores?: CampaignInsightTierScore[]
  /** Every upgrade+location that fed into this score, sorted by contribution value descending. */
  contributions: CampaignInsightContribution[]
}

/**
 * The chance a single run drops this location's material: 1 for a guaranteed drop, the
 * precomputed `effectiveRate` when present, else the raw `numerator/denominator` fraction, else 0
 * for a location with no rate info at all.
 */
export function dropRate(location: FarmLocationLike): number {
  if (location.guaranteed) return 1
  if (location.effectiveRate != null) return location.effectiveRate
  if (location.numerator != null && location.denominator) {
    return location.numerator / location.denominator
  }
  return 0
}

// Event difficulties fold into two tiers for scoring purposes: "eventStandard"/"eventStandardChallenge"
// are "standard", "eventExtremis"/"eventExtremisChallenge" are "extremis" — the same split
// `campaignShortLabel` already uses for its "S"/"Ext" short codes.
function eventTier(
  campaignGroupId: string,
  difficulty: string
): "standard" | "extremis" | undefined {
  const short = campaignShortLabel(campaignGroupId, difficulty)
  if (!short) return undefined
  return short.code === "Ext" ? "extremis" : "standard"
}

interface TierAccumulator {
  value: number
  energyByBattle: Map<string, number>
}

interface ChipAccumulator {
  label: string
  icon?: string
  isEvent: boolean
  value: number
  energyByBattle: Map<string, number>
  contributions: CampaignInsightContribution[]
  tiers: Map<"standard" | "extremis", TierAccumulator>
}

/**
 * Ranks each campaign a character's still-needed base upgrades can drop from, by a value-per-energy
 * score: `Σ(rarityWeight × count × dropRate)` across every upgrade droppable there, divided by the
 * summed energy cost of the chip's distinct battle nodes (a node's cost counts once even if several
 * needed upgrades drop from it). Regular campaigns are kept one chip per difficulty (Standard and
 * Elite farm different node sets), but event difficulty tiers (Standard/Extremis/Challenge) are
 * merged into one chip per event so the event's total usefulness isn't split across its tiers —
 * each event insight also carries a `tierScores` breakdown so the Standard and Extremis portions of
 * that combined score stay visible. Regular campaigns and events are ranked and returned separately
 * since events are time-limited and shouldn't compete with standing campaigns.
 */
export function computeCampaignInsights(
  needs: BaseUpgradeNeed[],
  upgradesById: ReadonlyMap<string, UpgradeWithFarmLocations>,
  battlesById: ReadonlyMap<string, BattleLike>,
  isEventGroup: (campaignGroupId: string) => boolean,
  topN = 3
): { campaignInsights: CampaignInsight[]; eventInsights: CampaignInsight[] } {
  const chips = new Map<string, ChipAccumulator>()

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
        : `${battle.campaignGroupId}:${battle.difficulty}`
      let chip = chips.get(key)
      if (!chip) {
        const label = isEvent
          ? campaignShortLabel(battle.campaignGroupId, battle.difficulty)?.name
          : campaignLabel(battle.campaignGroupId, battle.difficulty)
        if (!label) continue
        chip = {
          label,
          icon: campaignIcon(battle.campaignGroupId, battle.difficulty),
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
        difficulty: battle.difficulty,
        nodeNumber: battle.nodeNumber,
        count: need.count,
        dropRate: rate,
        value,
      })

      if (isEvent) {
        const tier = eventTier(battle.campaignGroupId, battle.difficulty)
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
  }: (typeof scored)[number]): CampaignInsight => ({
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
