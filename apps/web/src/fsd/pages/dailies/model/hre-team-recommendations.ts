import type { UnitId } from "@workspace/game-domain"

import type { HreTeamPlan, HreTeamRule } from "@/features/hre-missions"
import { characterDamageTypes } from "@/shared/lib"
import type { UnitPowerContext } from "@/shared/unit-power"

import { mapRosterCharacter } from "./arena-recommendations"
import type { RawRosterCharacter } from "./arena-recommendations.types"
import { combatPowerOf } from "./team-eligibility"
import { buildTeamRecommendations } from "./team-recommendations"
import {
  MIN_TEAM_SIZE,
  type TeamCategory,
  type TeamPoolSpec,
  type TeamRosterCharacter,
} from "./team-recommendations.types"

export const HRE_TEAM_SIZE = 5

const SUPPORT_TRAITS: ReadonlySet<string> = new Set(["Healer", "Mechanic"])
const PSYCHIC = "Psychic"

export type HreTeam =
  | {
      status: "ready"
      rule: HreTeamRule
      team: TeamCategory
      /** Units the rule allowed (the alliance's units for an all-alliance lineup). */
      eligibleCount: number
      /** The alliance the team was drawn from: the featured hero's, or for an Onslaught or Salvage
       * Run track the one with the most eligible units. Null when not restricted. */
      alliance: string | null
      /** Whether a Healer or Mechanic was fielded for the heal objective; null when not asked. */
      support: "included" | "missing" | null
    }
  | { status: "insufficient"; rule: HreTeamRule; eligibleCount: number }
  /** The featured-hero objective while the player has not unlocked the hero. */
  | { status: "locked-hero" }

type HreCatalogUnit = {
  traits?: readonly string[]
  alliance: string
  meleeDamage?: string
  rangedDamage?: string | null
  activeAbilityDamage?: readonly string[]
  passiveAbilityDamage?: readonly string[]
}

export type BuildHreTeamInput = {
  plan: Pick<
    HreTeamPlan,
    "rule" | "mode" | "size" | "support" | "preferPsychic"
  >
  /** The featured hero's alliance; null when the hero does not resolve. */
  alliance: string | null
  featuredCharacterId: string | null
  roster: readonly RawRosterCharacter[]
  catalog: ReadonlyMap<string, HreCatalogUnit>
  summoners: ReadonlySet<UnitId>
  unitPower: UnitPowerContext | null
}

const damageTypesOf = (view: HreCatalogUnit) =>
  characterDamageTypes({
    meleeDamage: view.meleeDamage ?? "",
    rangedDamage: view.rangedDamage ?? null,
    activeAbilityDamage: view.activeAbilityDamage,
    passiveAbilityDamage: view.passiveAbilityDamage,
  })

const pool = (id: string, unitIds: Iterable<UnitId>): TeamPoolSpec => ({
  id,
  unitIds: new Set(unitIds),
  rationaleFor: () => undefined,
})

/**
 * One Power-mode team for an HRE mission (design D8): only the featured hero's alliance for an
 * all-alliance lineup (never filled with other alliances), no summoner for a summon-free win, only
 * ranged units for ranged kills, any units for ability uses, or the featured hero leading for a
 * featured-hero objective. An
 * Onslaught or Salvage Run team keeps to one alliance track. The strongest Healer or Mechanic
 * leads while a heal objective is open, then Psychic damage dealers while a Psychic damage
 * objective is open. Null when the rule cannot be applied (an all-alliance lineup without a
 * resolved alliance).
 */
export function buildHreTeam(input: BuildHreTeamInput): HreTeam | null {
  const { plan } = input
  const all: TeamRosterCharacter[] = input.roster.flatMap((record) => {
    const view = input.catalog.get(record.unitId)
    return view
      ? [
          {
            ...mapRosterCharacter(record),
            traits: view.traits ?? [],
            damageTypes: damageTypesOf(view),
          },
        ]
      : []
  })
  const allianceOf = (character: TeamRosterCharacter) =>
    input.catalog.get(character.unitId)?.alliance
  const featured = input.featuredCharacterId as UnitId | null
  let roster = all
  let alliance: string | null = null
  const pools: TeamPoolSpec[] = []
  if (plan.rule === "alliance") {
    if (!input.alliance) return null
    alliance = input.alliance
    roster = all.filter((character) => allianceOf(character) === alliance)
  } else if (plan.rule === "summonFree") {
    roster = all.filter((character) => !input.summoners.has(character.unitId))
  } else if (plan.rule === "abilities") {
    // Any units: every ability use counts.
  } else if (plan.rule === "ranged") {
    roster = all.filter(
      (character) => !!input.catalog.get(character.unitId)?.rangedDamage
    )
  } else {
    if (!featured || !all.some((character) => character.unitId === featured)) {
      return { status: "locked-hero" }
    }
    pools.push(pool("featured-hero", [featured]))
  }
  if (
    alliance === null &&
    (plan.mode === "onslaught" || plan.mode === "salvageRun")
  ) {
    alliance = largestAlliance(roster, allianceOf, input.alliance)
    roster = roster.filter((character) => allianceOf(character) === alliance)
  }

  if (roster.length < MIN_TEAM_SIZE) {
    return {
      status: "insufficient",
      rule: plan.rule,
      eligibleCount: roster.length,
    }
  }
  let support: "included" | "missing" | null = null
  if (plan.support) {
    const healer = strongest(
      roster.filter((character) =>
        character.traits.some((trait) => SUPPORT_TRAITS.has(trait))
      ),
      input.unitPower
    )
    support = healer ? "included" : "missing"
    if (healer) pools.push(pool("support", [healer.unitId]))
  }
  if (plan.preferPsychic) {
    pools.push(
      pool(
        "psychic",
        roster
          .filter((character) => character.damageTypes.includes(PSYCHIC))
          .map((character) => character.unitId)
      )
    )
  }
  const recommendations = buildTeamRecommendations({
    mode: "power",
    teamSize: plan.size,
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
    rule: plan.rule,
    team: recommendations.categories.find(
      (category) => category.id === "plan"
    )!,
    eligibleCount: roster.length,
    alliance,
    support,
  }
}

/** The alliance with the most of `roster`; a tie goes to `preferred` (the featured hero's). */
function largestAlliance(
  roster: readonly TeamRosterCharacter[],
  allianceOf: (character: TeamRosterCharacter) => string | undefined,
  preferred: string | null
): string | null {
  const counts = new Map<string, number>()
  for (const character of roster) {
    const alliance = allianceOf(character)
    if (alliance) counts.set(alliance, (counts.get(alliance) ?? 0) + 1)
  }
  let best: string | null = null
  for (const [alliance, count] of counts) {
    const bestCount = best === null ? -1 : counts.get(best)!
    if (count > bestCount || (count === bestCount && alliance === preferred)) {
      best = alliance
    }
  }
  return best
}

function strongest(
  characters: readonly TeamRosterCharacter[],
  unitPower: UnitPowerContext | null
): TeamRosterCharacter | undefined {
  let best: TeamRosterCharacter | undefined
  let bestPower = -1
  for (const character of characters) {
    const power = combatPowerOf(character, unitPower)
    if (power > bestPower) {
      best = character
      bestPower = power
    }
  }
  return best
}
