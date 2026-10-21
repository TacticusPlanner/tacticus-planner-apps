import type { GameCatalogHseTracker } from "@workspace/game-catalog"
import type { Alliance, UnitId } from "@workspace/game-domain"

import type { HreTeamPlan, HreTeamRule } from "@/features/hre-missions"
import { characterDamageTypes } from "@/shared/lib"
import type { UnitPowerContext } from "@/shared/unit-power"

import { mapRosterCharacter } from "./arena-recommendations"
import type { RawRosterCharacter } from "./arena-recommendations.types"
import { hseEventUnitPools } from "./hse-team-recommendations"
import type {
  HseTeamCatalog,
  HseTeamMode,
} from "./hse-team-recommendations.types"
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
/** The running HSE's game mode for each HRE team mode; Guild Raid has none. */
const HSE_MODE: Record<string, HseTeamMode | "Campaign"> = {
  battle: "Campaign",
  arena: "Arena",
  onslaught: "Onslaught",
  salvageRun: "SalvageRun",
}

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
      /** Team members that also score for the running HSE; null when it does not score here. */
      hseUnits: number | null
    }
  | { status: "insufficient"; rule: HreTeamRule; eligibleCount: number }
  /** The featured-hero objective while the player has not unlocked the hero. */
  | { status: "locked-hero" }

type HreCatalogUnit = {
  traits?: readonly string[]
  alliance: string
  faction?: string
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
  /** The running Home Screen Event's point trackers; null when none runs. */
  hseTrackers?: readonly GameCatalogHseTracker[] | null
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
 * all-alliance lineup, alliance ability uses or alliance kills (never filled with other alliances),
 * no summoner for a summon-free win, only ranged units for ranged kills, only units without a
 * ranged attack for melee kills, any units for ability uses and other objectives, or the featured
 * hero leading for a featured-hero objective. An
 * Onslaught or Salvage Run team keeps to one alliance track. The strongest Healer or Mechanic
 * leads while a heal objective is open, then Psychic damage dealers while a Psychic damage
 * objective is open, then units that score for a running HSE in the team's mode (campaign battles,
 * Arena, Onslaught or Salvage Run: its own event units, so both events progress; for a track, the alliance with the most of them). Null when the
 * rule cannot be applied (an all-alliance lineup without a resolved alliance).
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
  } else if (plan.rule === "abilities" || plan.rule === "strongest") {
    // Any units: every ability use, kill, hit or heal counts.
  } else if (plan.rule === "ranged") {
    roster = all.filter(
      (character) => !!input.catalog.get(character.unitId)?.rangedDamage
    )
  } else if (plan.rule === "melee") {
    // Units without a ranged attack always strike in melee.
    roster = all.filter(
      (character) => !input.catalog.get(character.unitId)?.rangedDamage
    )
  } else {
    if (!featured || !all.some((character) => character.unitId === featured)) {
      return { status: "locked-hero" }
    }
    pools.push(pool("featured-hero", [featured]))
  }
  const hsePools = (units: readonly TeamRosterCharacter[]) =>
    hsePoolsFor(input, units)
  if (
    alliance === null &&
    (plan.mode === "onslaught" || plan.mode === "salvageRun")
  ) {
    alliance = largestAlliance(
      roster,
      allianceOf,
      input.alliance,
      hseUnitIds(hsePools(roster))
    )
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
  const hse = hsePools(roster)
  pools.push(...hse)
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
  const team = recommendations.categories.find(
    (category) => category.id === "plan"
  )!
  const hseIds = hseUnitIds(hse)
  return {
    status: "ready",
    rule: plan.rule,
    team,
    eligibleCount: roster.length,
    alliance,
    support,
    hseUnits:
      hse.length > 0
        ? team.members.filter((member) => hseIds.has(member.unitId)).length
        : null,
  }
}

/** The running HSE's event-unit pools among `units` in the plan's mode. */
function hsePoolsFor(
  input: BuildHreTeamInput,
  units: readonly TeamRosterCharacter[]
): TeamPoolSpec[] {
  const mode = HSE_MODE[input.plan.mode]
  if (!mode || !input.hseTrackers?.length) return []
  const catalog = new Map<
    UnitId,
    { traits: readonly string[]; alliance: Alliance; faction: string }
  >()
  for (const unit of units) {
    const view = input.catalog.get(unit.unitId)
    if (!view) continue
    catalog.set(unit.unitId, {
      traits: view.traits ?? [],
      alliance: view.alliance as Alliance,
      faction: view.faction ?? "",
    })
  }
  return hseEventUnitPools(
    input.hseTrackers,
    mode,
    units,
    catalog as HseTeamCatalog,
    input.unitPower
  )
}

/** Units that score for the HSE: a pool's members, but only those its trackers rank when some
 * tracker counts any unit (the pool is then the whole roster). */
function hseUnitIds(pools: readonly TeamPoolSpec[]): Set<UnitId> {
  const ids = new Set<UnitId>()
  for (const spec of pools) {
    for (const id of spec.unitIds) {
      if (!spec.rankOf || spec.rankOf(id) > 0) ids.add(id)
    }
  }
  return ids
}

/** The alliance with the most of `preferredUnits` (the running HSE's units), then the most of
 * `roster`; a tie goes to `preferred` (the featured hero's). */
function largestAlliance(
  roster: readonly TeamRosterCharacter[],
  allianceOf: (character: TeamRosterCharacter) => string | undefined,
  preferred: string | null,
  preferredUnits: ReadonlySet<UnitId>
): string | null {
  // Event units weigh more than the whole roster can, so they decide first.
  const weight = roster.length + 1
  const scores = new Map<string, number>()
  for (const character of roster) {
    const alliance = allianceOf(character)
    if (!alliance) continue
    const score = preferredUnits.has(character.unitId) ? weight + 1 : 1
    scores.set(alliance, (scores.get(alliance) ?? 0) + score)
  }
  let best: string | null = null
  for (const [alliance, score] of scores) {
    const bestScore = best === null ? -1 : scores.get(best)!
    if (score > bestScore || (score === bestScore && alliance === preferred)) {
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
