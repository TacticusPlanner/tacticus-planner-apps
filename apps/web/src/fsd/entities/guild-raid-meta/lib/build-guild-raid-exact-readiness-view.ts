import type { GameCatalogGuildRaidMeta } from "@workspace/game-catalog"
import type { Progression, Rank } from "@workspace/game-domain"

import type {
  GuildRaidMetaPresentationResolver,
  GuildRaidMetaSourcePresentation,
  GuildRaidMetaUnitPresentation,
} from "./resolve-guild-raid-meta"
import type { GuildRaidExactReadinessResult } from "./resolve-guild-raid-exact-readiness"

// A superset of `GuildRaidInvestmentFacts` (adds `xpLevel`, for display) — deliberately using the same
// field name `progression` for the same `Progression` value, not the roster schema's own confusingly-
// named `progressionIndex` field (which holds a `Progression` string, not a numeric index — see
// `GuildRaidRosterUnit` below), so this type is directly usable as investment-readiness input with no
// adapter.
export type GuildRaidExactReadinessInvestment = {
  xpLevel: number
  rank?: Rank
  progression: Progression
  activeAbilityLevel: number
  passiveAbilityLevel: number
}

/** The synced-roster fields this entity actually reads, independent of whether the caller is a
 * character or a Machine of War record (MoWs simply have no `rank`). Field name `progressionIndex`
 * matches the roster schema's own (confusingly-named — it holds a `Progression` string, not a numeric
 * index) field verbatim. */
type GuildRaidRosterUnit = {
  unitId: string
  xpLevel: number
  rank?: Rank
  progressionIndex: Progression
  abilities: { level: number }[]
}

/**
 * Maps the synced owned roster into the two shapes this entity's readiness calculators need: the
 * plain owned-id sets `resolveGuildRaidExactReadiness` compares against, and the per-unit investment
 * facts `resolveGuildRaidHeroReadiness`/`resolveGuildRaidMowReadiness` compare against the boss's
 * threshold. `abilities[0]` is a unit's active-ability record and `abilities[1]` its passive, mirroring
 * the same ordering convention already used by the Dailies team engine (`arena-recommendations.ts`);
 * a unit missing either defaults to level 1 rather than 0, matching that same convention.
 */
export function buildGuildRaidRosterInvestment(roster: {
  characters: readonly GuildRaidRosterUnit[]
  mows: readonly GuildRaidRosterUnit[]
}): {
  ownedCharacterIds: ReadonlySet<string>
  ownedMowIds: ReadonlySet<string>
  investmentByCharacterId: ReadonlyMap<
    string,
    GuildRaidExactReadinessInvestment
  >
  investmentByMowId: ReadonlyMap<string, GuildRaidExactReadinessInvestment>
} {
  const toInvestment = (
    unit: GuildRaidRosterUnit
  ): GuildRaidExactReadinessInvestment => ({
    xpLevel: unit.xpLevel,
    rank: unit.rank,
    progression: unit.progressionIndex,
    activeAbilityLevel: unit.abilities[0]?.level ?? 1,
    passiveAbilityLevel: unit.abilities[1]?.level ?? 1,
  })

  return {
    ownedCharacterIds: new Set(roster.characters.map((unit) => unit.unitId)),
    ownedMowIds: new Set(roster.mows.map((unit) => unit.unitId)),
    investmentByCharacterId: new Map(
      roster.characters.map((unit) => [unit.unitId, toInvestment(unit)])
    ),
    investmentByMowId: new Map(
      roster.mows.map((unit) => [unit.unitId, toInvestment(unit)])
    ),
  }
}

export type GuildRaidExactReadinessUnitView = GuildRaidMetaUnitPresentation & {
  /** `undefined` when the player's roster is unavailable — readiness is withheld, not inferred. */
  owned?: boolean
  investment?: GuildRaidExactReadinessInvestment
}

export type GuildRaidExactReadinessRecommendationView = {
  id: string
  kind: string
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
          id: recommendation.id,
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
        id: entry.recommendation.id,
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
