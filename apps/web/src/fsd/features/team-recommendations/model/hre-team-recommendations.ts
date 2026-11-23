import type { GameCatalogHseTracker } from "@workspace/game-catalog"
import type { Alliance, UnitId } from "@workspace/game-domain"

import type { HreTeamPlan, HreTeamRule } from "@/entities/hre-mission"
import { characterDamageTypes, required } from "@/shared/lib"
import type { UnitPowerContext } from "@/shared/unit-power"

import { mapRosterCharacter } from "./roster-character"
import type { RawRosterCharacter } from "./roster-character"
import { hseEventUnitPools, hseScoresIn } from "./hse-team-recommendations"
import type { HseTeamMode } from "./hse-team-recommendations.types"
import { combatPowerOf } from "./team-eligibility"
import { buildTeamRecommendations } from "./team-recommendations"
import { MIN_TEAM_SIZE } from "./team-recommendations.types"
import type {
  TeamCategory,
  TeamPoolSpec,
  TeamRosterCharacter,
} from "./team-recommendations.types"

export const HRE_TEAM_SIZE = 5

const HEALER = "Healer"
/** A Mechanic only repairs units with this trait, where a Healer heals any unit (Severyn, 2026-11). */
const MECHANIC = "Mechanic"
const MECHANICAL = "Mechanical"
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

/** Whether an HSE's trackers score in an HRE team's mode (never in Guild Raid). */
export function hseScoresInHreMode(
  trackers: readonly GameCatalogHseTracker[],
  mode: HreTeamPlan["mode"]
): boolean {
  const hseMode = HSE_MODE[mode]
  return !!hseMode && hseScoresIn(trackers, hseMode)
}

/** A curated ability tag (catalog `abilities`). */
type HreCatalogAbility = {
  kind: string
  roles: readonly string[]
  target: string
  attack: string | null
}

type HreCatalogUnit = {
  traits?: readonly string[]
  alliance: string
  faction?: string
  meleeDamage?: string
  rangedDamage?: string | null
  activeAbilityDamage?: readonly string[]
  passiveAbilityDamage?: readonly string[]
  abilities?: readonly HreCatalogAbility[]
}

export type BuildHreTeamInput = {
  plan: Pick<
    HreTeamPlan,
    "rule" | "mode" | "size" | "support" | "preferPsychic"
  > &
    Partial<Pick<HreTeamPlan, "wholeTrack" | "abilityFocus">> & {
      /** Only units of these factions: the allied factions a campaign lets you deploy. */
      factions?: readonly string[]
    }
  /** The featured hero's alliance; null when the hero does not resolve. */
  alliance: string | null
  featuredCharacterId: string | null
  roster: readonly RawRosterCharacter[]
  catalog: ReadonlyMap<string, HreCatalogUnit>
  /** Units a summon-free team leaves out: those that summon on their own (a passive summon). */
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
 * leads while a heal objective is open (a Mechanic when most of the team is mechanical, a Healer otherwise), then Psychic damage dealers while a Psychic damage
 * objective is open, then units that score for a running HSE in the team's mode (campaign battles,
 * Arena, Onslaught or Salvage Run: its own event units, so both events progress; for a track, the alliance with the most of them). A
 * whole-track plan (Onslaught ability uses) fields every unit of the track, weakest first, so each
 * uses its ability before it falls and the next one deploys. Null when the rule cannot be applied
 * (an all-alliance lineup without a resolved alliance).
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
  const factions = plan.factions
  const deployable = factions
    ? all.filter((character) =>
        factions.includes(input.catalog.get(character.unitId)?.faction ?? "")
      )
    : all
  let roster = deployable
  let alliance: string | null = null
  const pools: TeamPoolSpec[] = []
  if (plan.rule === "alliance") {
    if (!input.alliance) return null
    alliance = input.alliance
    roster = deployable.filter(
      (character) => allianceOf(character) === alliance
    )
  } else if (plan.rule === "summonFree") {
    roster = deployable.filter(
      (character) => !input.summoners.has(character.unitId)
    )
  } else if (plan.rule === "abilities" || plan.rule === "strongest") {
    // Any units: every ability use, kill, hit or heal counts.
  } else if (plan.rule === "ranged" || plan.rule === "melee") {
    const attack = plan.rule
    roster = deployable.filter((character) =>
      strikesWith(input.catalog.get(character.unitId), attack)
    )
  } else {
    if (
      !featured ||
      all.every((character) => !(character.unitId === featured))
    ) {
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
  roster = abilityDealers(input, roster)
  let support: "included" | "missing" | null = null
  // The featured hero leads, then the support pick, then the preference pools below.
  const preferences: TeamPoolSpec[] = []
  if (plan.preferPsychic) {
    preferences.push(
      pool(
        "psychic",
        roster
          .filter((character) => character.damageTypes.includes(PSYCHIC))
          .map((character) => character.unitId)
      )
    )
  }
  const abilityPool = abilityFocusPool(input, roster)
  if (abilityPool) preferences.push(abilityPool)
  const hse = hsePools(roster)
  preferences.push(...hse)
  const teamWith = (specs: readonly TeamPoolSpec[]) =>
    required(
      buildTeamRecommendations({
        mode: "power",
        teamSize: plan.wholeTrack ? roster.length : plan.size,
        roster,
        pools: [...specs],
        preferences: {},
        lockedRandomUnitIds: [],
        randomSeed: 0,
        leadWithPools: specs.length > 0,
        unitPower: input.unitPower,
      }).categories.find((category) => category.id === "plan"),
      "the plan team"
    )
  if (plan.support) {
    const healer = supportPick(
      roster,
      teamWith([...pools, ...preferences]).members,
      input.unitPower
    )
    support = healer ? "included" : "missing"
    if (healer) pools.push(pool("support", [healer.unitId]))
  }
  pools.push(...preferences)
  const planTeam = teamWith(pools)
  const hseIds = hseUnitIds(hse)
  const team = plan.wholeTrack
    ? {
        ...planTeam,
        members: wholeTrackOrder(
          planTeam.members,
          hseIds,
          roster,
          input.unitPower
        ),
      }
    : planTeam
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

const dealsDamage = (ability: HreCatalogAbility) =>
  ability.roles.includes("damage")
/** A character's active, or a Machine of War's primary: the ability the player uses. */
const isActive = (ability: HreCatalogAbility) =>
  ability.kind === "active" || ability.kind === "primary"

const abilitiesOf = (
  input: BuildHreTeamInput,
  character: TeamRosterCharacter
): readonly HreCatalogAbility[] =>
  input.catalog.get(character.unitId)?.abilities ?? []

/**
 * Whether a unit can kill with `attack`: ranged with a ranged attack, melee without one (it always
 * strikes in melee), or either with an active that is itself that attack (a melee unit's ranged
 * active, a ranged unit's melee one).
 */
function strikesWith(
  view: HreCatalogUnit | undefined,
  attack: "melee" | "ranged"
): boolean {
  const ranged = !!view?.rangedDamage
  if (attack === "ranged" ? ranged : !ranged) return true
  return (view?.abilities ?? []).some(
    (ability) => isActive(ability) && ability.attack === attack
  )
}

/** Ability damage counts only abilities that deal damage (never Bellator's or Incisus's): the units
 * with one, unless too few of them leave a full team. Every unit for another focus. */
function abilityDealers(
  input: BuildHreTeamInput,
  roster: TeamRosterCharacter[]
): TeamRosterCharacter[] {
  if (input.plan.abilityFocus !== "damage") return roster
  const dealers = roster.filter((character) =>
    abilitiesOf(input, character).some(dealsDamage)
  )
  return dealers.length >= MIN_TEAM_SIZE ? dealers : roster
}

/**
 * The units an ability objective puts first, after the heal and Psychic picks: AoE damage abilities
 * for ability damage; for ability uses, an active with no target or one target, quick to use and
 * never clearing the enemies the rest of the team needs for their own abilities as an AoE active can.
 */
function abilityFocusPool(
  input: BuildHreTeamInput,
  roster: readonly TeamRosterCharacter[]
): TeamPoolSpec | null {
  switch (input.plan.abilityFocus) {
    case "damage":
      return pool(
        "ability-aoe-damage",
        unitIdsWith(
          input,
          roster,
          (ability) => dealsDamage(ability) && ability.target === "aoe"
        )
      )
    case "uses":
      return pool(
        "ability-quick-use",
        unitIdsWith(
          input,
          roster,
          (ability) => isActive(ability) && ability.target !== "aoe"
        )
      )
    default:
      return null
  }
}

function unitIdsWith(
  input: BuildHreTeamInput,
  units: readonly TeamRosterCharacter[],
  matches: (ability: HreCatalogAbility) => boolean
): UnitId[] {
  return units
    .filter((character) => abilitiesOf(input, character).some(matches))
    .map((character) => character.unitId)
}

/** The running HSE's event-unit pools among `units` in the plan's mode. */
function hsePoolsFor(
  input: BuildHreTeamInput,
  units: readonly TeamRosterCharacter[]
): TeamPoolSpec[] {
  const mode = HSE_MODE[input.plan.mode]
  if (!mode || !input.hseTrackers || input.hseTrackers.length === 0) return []
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
    catalog,
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
  let bestScore = -1
  for (const [alliance, score] of scores) {
    if (score > bestScore || (score === bestScore && alliance === preferred)) {
      best = alliance
      bestScore = score
    }
  }
  return best
}

/**
 * A whole track deploys every unit: the units that score for the running HSE first, then the rest,
 * each group weakest first by power. The engine's order also weighs how many HSE trackers a unit
 * matches, so it is not a power order to reverse; reversing it only breaks power ties.
 */
function wholeTrackOrder<Member extends { unitId: UnitId }>(
  members: readonly Member[],
  hseIds: ReadonlySet<UnitId>,
  roster: readonly TeamRosterCharacter[],
  unitPower: UnitPowerContext | null
): Member[] {
  const power = new Map(
    roster.map((character) => [
      character.unitId,
      combatPowerOf(character, unitPower),
    ])
  )
  const powerOf = (member: Member) => power.get(member.unitId) ?? 0
  const group = (member: Member) => (hseIds.has(member.unitId) ? 0 : 1)
  return members
    .toReversed()
    .toSorted((a, b) =>
      group(a) === group(b) ? powerOf(a) - powerOf(b) : group(a) - group(b)
    )
}

/** The heal objective's support unit, read off the team picked without one (`team`): the strongest
 * Mechanic when most of that team is mechanical, since a Mechanic repairs only mechanical units, and
 * the strongest Healer otherwise; the other kind when none of the first is owned. */
function supportPick(
  roster: readonly TeamRosterCharacter[],
  team: readonly { unitId: UnitId }[],
  unitPower: UnitPowerContext | null
): TeamRosterCharacter | undefined {
  const traitsOf = new Map(
    roster.map((character) => [character.unitId, character.traits])
  )
  const mechanical = team.filter((member) =>
    traitsOf.get(member.unitId)?.includes(MECHANICAL)
  ).length
  const order =
    mechanical * 2 > team.length ? [MECHANIC, HEALER] : [HEALER, MECHANIC]
  for (const trait of order) {
    const pick = strongest(
      roster.filter((character) => character.traits.includes(trait)),
      unitPower
    )
    if (pick) return pick
  }
  return undefined
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
