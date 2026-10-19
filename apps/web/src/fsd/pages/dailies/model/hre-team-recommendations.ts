import type { UnitId } from "@workspace/game-domain"

import type { HreTeamRule } from "@/features/hre-missions"
import type { UnitPowerContext } from "@/shared/unit-power"

import { mapRosterCharacter } from "./arena-recommendations"
import type { RawRosterCharacter } from "./arena-recommendations.types"
import { buildTeamRecommendations } from "./team-recommendations"
import {
  MIN_TEAM_SIZE,
  type TeamCategory,
  type TeamPoolSpec,
  type TeamRosterCharacter,
} from "./team-recommendations.types"

export const HRE_TEAM_SIZE = 5

export type HreTeam =
  | {
      status: "ready"
      rule: HreTeamRule
      team: TeamCategory
      /** Units the rule allowed (the alliance's units for an all-alliance lineup). */
      eligibleCount: number
    }
  | { status: "insufficient"; rule: HreTeamRule; eligibleCount: number }
  /** The featured-hero objective while the player has not unlocked the hero. */
  | { status: "locked-hero" }

export type BuildHreTeamInput = {
  rule: HreTeamRule
  /** The featured hero's alliance; null when the hero does not resolve. */
  alliance: string | null
  featuredCharacterId: string | null
  roster: readonly RawRosterCharacter[]
  catalog: ReadonlyMap<string, { traits?: readonly string[]; alliance: string }>
  summoners: ReadonlySet<UnitId>
  unitPower: UnitPowerContext | null
}

/**
 * One Power-mode team of five for an HRE lineup objective (design D8): only the featured hero's
 * alliance for an all-alliance lineup (never filled with other alliances), no summoner for a
 * summon-free win, or the featured hero leading for a featured-hero objective. Null when the rule
 * cannot be applied (an all-alliance lineup without a resolved alliance).
 */
export function buildHreTeam(input: BuildHreTeamInput): HreTeam | null {
  const all: TeamRosterCharacter[] = input.roster.flatMap((record) => {
    const view = input.catalog.get(record.unitId)
    return view
      ? [
          {
            ...mapRosterCharacter(record),
            traits: view.traits ?? [],
            damageTypes: [],
          },
        ]
      : []
  })
  const featured = input.featuredCharacterId as UnitId | null
  let roster = all
  let pools: TeamPoolSpec[] = []
  if (input.rule === "alliance") {
    if (!input.alliance) return null
    roster = all.filter(
      (character) =>
        input.catalog.get(character.unitId)?.alliance === input.alliance
    )
  } else if (input.rule === "summonFree") {
    roster = all.filter((character) => !input.summoners.has(character.unitId))
  } else {
    if (!featured || !all.some((character) => character.unitId === featured)) {
      return { status: "locked-hero" }
    }
    pools = [
      {
        id: "featured-hero",
        unitIds: new Set([featured]),
        rationaleFor: () => undefined,
      },
    ]
  }

  if (roster.length < MIN_TEAM_SIZE) {
    return {
      status: "insufficient",
      rule: input.rule,
      eligibleCount: roster.length,
    }
  }
  const recommendations = buildTeamRecommendations({
    mode: "power",
    teamSize: HRE_TEAM_SIZE,
    roster,
    pools,
    preferences: {},
    lockedRandomUnitIds: [],
    randomSeed: 0,
    leadWithPools: pools.length > 0,
    unitPower: input.unitPower,
  })
  return {
    status: "ready",
    rule: input.rule,
    team: recommendations.categories.find(
      (category) => category.id === "plan"
    )!,
    eligibleCount: roster.length,
  }
}
