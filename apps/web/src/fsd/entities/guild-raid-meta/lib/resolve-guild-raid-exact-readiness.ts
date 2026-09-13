import type {
  GameCatalogGuildRaidMeta,
  GameCatalogGuildRaidMetaRecommendation,
} from "@workspace/game-catalog"

export type GuildRaidExactReadinessClassification =
  "ready" | "partial" | "unavailable"

type GuildRaidExactReadinessHero = {
  id: string
  owned: boolean
}

type GuildRaidExactReadinessRecommendationResult = {
  recommendation: GameCatalogGuildRaidMetaRecommendation
  heroes: GuildRaidExactReadinessHero[]
  mowOwned: boolean
  classification: GuildRaidExactReadinessClassification
}

export type GuildRaidExactReadinessRoster = {
  ownedCharacterIds: ReadonlySet<string>
  ownedMowIds: ReadonlySet<string>
}

export type GuildRaidExactReadinessResult =
  | { status: "absentMeta" }
  | { status: "noBossRecommendation" }
  | {
      status: "missingRoster"
      recommendations: GameCatalogGuildRaidMetaRecommendation[]
    }
  | {
      status: "populated"
      recommendations: GuildRaidExactReadinessRecommendationResult[]
    }

function classify(ownedCount: number): GuildRaidExactReadinessClassification {
  if (ownedCount === 5) return "ready"
  if (ownedCount === 0) return "unavailable"
  return "partial"
}

/**
 * Pure five-slot membership comparison against the owned roster — deliberately not a configuration of
 * the generic Dailies team engine, which ranks/pools candidates instead of checking exact membership.
 * Comp ids are never consulted here: Comp membership is attribution only and must never substitute for
 * a missing exact hero or influence the classification.
 */
export function resolveGuildRaidExactReadiness(params: {
  bossUnitSetId: string
  meta: GameCatalogGuildRaidMeta | null
  roster: GuildRaidExactReadinessRoster | undefined
}): GuildRaidExactReadinessResult {
  const { bossUnitSetId, meta, roster } = params

  if (!meta) return { status: "absentMeta" }

  const boss = meta.bosses.find(
    (candidate) => candidate.bossUnitSetId === bossUnitSetId
  )
  if (!boss || boss.recommendations.length === 0) {
    return { status: "noBossRecommendation" }
  }

  if (!roster) {
    return { status: "missingRoster", recommendations: boss.recommendations }
  }

  const recommendations = boss.recommendations.map(
    (recommendation): GuildRaidExactReadinessRecommendationResult => {
      const heroes = recommendation.heroIds.map((id) => ({
        id,
        owned: roster.ownedCharacterIds.has(id),
      }))
      const ownedCount = heroes.filter((hero) => hero.owned).length

      return {
        recommendation,
        heroes,
        mowOwned: roster.ownedMowIds.has(recommendation.mowId),
        classification: classify(ownedCount),
      }
    }
  )

  return { status: "populated", recommendations }
}
