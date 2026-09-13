import type { GameCatalogGuildRaidMeta } from "@workspace/game-catalog"
import type { Rank } from "@workspace/game-domain"

import type {
  GuildRaidMetaPresentationResolver,
  GuildRaidMetaSourcePresentation,
  GuildRaidMetaUnitPresentation,
} from "./resolve-guild-raid-meta"
import type { GuildRaidExactReadinessResult } from "./resolve-guild-raid-exact-readiness"

export type GuildRaidExactReadinessInvestment = {
  xpLevel: number
  rank?: Rank
}

export type GuildRaidExactReadinessUnitView = GuildRaidMetaUnitPresentation & {
  /** `undefined` when the player's roster is unavailable — readiness is withheld, not inferred. */
  owned?: boolean
  investment?: GuildRaidExactReadinessInvestment
}

export type GuildRaidExactReadinessRecommendationView = {
  kind: "meta" | "alternate"
  heroes: GuildRaidExactReadinessUnitView[]
  mow: GuildRaidExactReadinessUnitView
  comps: Array<{ id: string; signature: GuildRaidMetaUnitPresentation }>
  /** `undefined` when the player's roster is unavailable. */
  classification?: "ready" | "partial" | "unavailable"
}

export type GuildRaidExactReadinessView =
  | { status: "absentMeta" }
  | { status: "noBossRecommendation" }
  | {
      status: "missingRoster"
      source: GuildRaidMetaSourcePresentation
      updatedOn: string
      recommendations: GuildRaidExactReadinessRecommendationView[]
    }
  | {
      status: "populated"
      source: GuildRaidMetaSourcePresentation
      updatedOn: string
      recommendations: GuildRaidExactReadinessRecommendationView[]
    }

/**
 * Merges the pure readiness classification with the entity's existing id->presentation resolver and
 * synced player investment facts. This is presentation composition only: order and classification are
 * taken as-is from `resolveGuildRaidExactReadiness` and never re-derived, sorted, or scored here.
 */
export function buildGuildRaidExactReadinessView(params: {
  readiness: GuildRaidExactReadinessResult
  presentation: GuildRaidMetaPresentationResolver
  meta: GameCatalogGuildRaidMeta
  investmentByCharacterId: ReadonlyMap<
    string,
    GuildRaidExactReadinessInvestment
  >
  investmentByMowId: ReadonlyMap<string, GuildRaidExactReadinessInvestment>
}): GuildRaidExactReadinessView {
  const {
    readiness,
    presentation,
    meta,
    investmentByCharacterId,
    investmentByMowId,
  } = params

  if (readiness.status === "absentMeta") return { status: "absentMeta" }
  if (readiness.status === "noBossRecommendation") {
    return { status: "noBossRecommendation" }
  }

  const source = presentation.resolveSource(meta.sourceId)

  if (readiness.status === "missingRoster") {
    return {
      status: "missingRoster",
      source,
      updatedOn: meta.updatedOn,
      recommendations: readiness.recommendations.map((recommendation) => {
        const resolved = presentation.resolveRecommendation(recommendation)
        return {
          kind: recommendation.kind,
          heroes: resolved.heroes,
          mow: resolved.mow,
          comps: resolved.comps,
        }
      }),
    }
  }

  return {
    status: "populated",
    source,
    updatedOn: meta.updatedOn,
    recommendations: readiness.recommendations.map((entry) => {
      const resolved = presentation.resolveRecommendation(entry.recommendation)
      const ownedByHeroId = new Map(
        entry.heroes.map((hero) => [hero.id, hero.owned])
      )

      return {
        kind: entry.recommendation.kind,
        heroes: resolved.heroes.map((hero) => ({
          ...hero,
          owned: ownedByHeroId.get(hero.id) ?? false,
          investment: investmentByCharacterId.get(hero.id),
        })),
        mow: {
          ...resolved.mow,
          owned: entry.mowOwned,
          investment: investmentByMowId.get(resolved.mow.id),
        },
        comps: resolved.comps,
        classification: entry.classification,
      }
    }),
  }
}
