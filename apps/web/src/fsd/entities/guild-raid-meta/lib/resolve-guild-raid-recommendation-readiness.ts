import type { GameCatalogGuildRaidMetaRecommendation } from "@workspace/game-catalog"

import {
  matchGuildRaidCandidates,
  type GuildRaidMatcherAssignment,
} from "./match-guild-raid-candidates"
import {
  resolveGuildRaidHeroReadiness,
  resolveGuildRaidMowReadiness,
  type GuildRaidInvestmentFacts,
} from "./resolve-guild-raid-investment-readiness"
import {
  resolveGuildRaidSlotCandidates,
  type GuildRaidSlotCandidate,
} from "./resolve-guild-raid-slot-candidates"
import { resolveGuildRaidTeamReadiness } from "./resolve-guild-raid-team-readiness"
import type { GuildRaidInvestmentThreshold } from "./resolve-guild-raid-investment-threshold"

export type GuildRaidHeroSlotReadiness = {
  heroId: string
  roleId: string
  essential: boolean
  assignment: GuildRaidMatcherAssignment | null
  readiness: number
  candidates: GuildRaidSlotCandidate[]
}

export type GuildRaidMowReadiness = {
  mowId: string
  owned: boolean
  readiness: number
}

export type GuildRaidRecommendationReadiness = {
  recommendation: GameCatalogGuildRaidMetaRecommendation
  teamReadiness: number
  heroSlots: GuildRaidHeroSlotReadiness[]
  mow: GuildRaidMowReadiness
}

export type GuildRaidReadinessRoster = {
  ownedCharacterIds: ReadonlySet<string>
  ownedMowIds: ReadonlySet<string>
  investmentByCharacterId: ReadonlyMap<string, GuildRaidInvestmentFacts>
  investmentByMowId: ReadonlyMap<string, GuildRaidInvestmentFacts>
}

/**
 * Computes one recommendation's full investment-readiness picture: the matcher's slot assignments, each
 * slot's readiness and full owned-candidate comparison list, the Machine of War's readiness, and the
 * combined weighted team percentage. Every sub-calculation (matching, scoring, candidate listing) reads
 * `recommendation.heroSlots`/`mowId` directly and never reorders them.
 */
export function resolveGuildRaidRecommendationReadiness(params: {
  recommendation: GameCatalogGuildRaidMetaRecommendation
  threshold: GuildRaidInvestmentThreshold
  roster: GuildRaidReadinessRoster
}): GuildRaidRecommendationReadiness {
  const { recommendation, threshold, roster } = params

  const readinessOfCharacter = (characterId: string) =>
    resolveGuildRaidHeroReadiness({
      owned: roster.ownedCharacterIds.has(characterId),
      investment: roster.investmentByCharacterId.get(characterId),
      threshold,
    })

  const matcherResult = matchGuildRaidCandidates({
    slots: recommendation.heroSlots,
    ownedCharacterIds: roster.ownedCharacterIds,
    readinessOf: readinessOfCharacter,
  })

  const heroSlots: GuildRaidHeroSlotReadiness[] = recommendation.heroSlots.map(
    (slot, index) => {
      const assignment = matcherResult.assignments[index] ?? null
      return {
        heroId: slot.heroId,
        roleId: slot.roleId,
        essential: slot.essential,
        assignment,
        readiness: assignment
          ? readinessOfCharacter(assignment.characterId)
          : 0,
        candidates: resolveGuildRaidSlotCandidates({
          slot,
          ownedCharacterIds: roster.ownedCharacterIds,
          readinessOf: readinessOfCharacter,
          selectedCharacterId: assignment?.characterId ?? null,
        }),
      }
    }
  )

  const mowOwned = roster.ownedMowIds.has(recommendation.mowId)
  const mowReadiness = resolveGuildRaidMowReadiness({
    owned: mowOwned,
    progression: roster.investmentByMowId.get(recommendation.mowId)
      ?.progression,
    threshold,
  })

  const teamReadiness = resolveGuildRaidTeamReadiness(
    heroSlots.map((slot) => ({
      readiness: slot.readiness,
      essential: slot.essential,
    })),
    mowReadiness
  )

  return {
    recommendation,
    teamReadiness,
    heroSlots,
    mow: {
      mowId: recommendation.mowId,
      owned: mowOwned,
      readiness: mowReadiness,
    },
  }
}

/**
 * Maps `resolveGuildRaidRecommendationReadiness` over a boss's (or prime's) recommendations, preserving
 * authored order — this entity never ranks or reorders curated recommendations by their resulting
 * readiness.
 */
export function resolveGuildRaidRecommendationsReadiness(params: {
  recommendations: readonly GameCatalogGuildRaidMetaRecommendation[]
  threshold: GuildRaidInvestmentThreshold
  roster: GuildRaidReadinessRoster
}): GuildRaidRecommendationReadiness[] {
  return params.recommendations.map((recommendation) =>
    resolveGuildRaidRecommendationReadiness({
      recommendation,
      threshold: params.threshold,
      roster: params.roster,
    })
  )
}
