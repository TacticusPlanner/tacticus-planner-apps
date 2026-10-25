import {
  progressionIndex,
  rankIndex,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import { unitDealtDamageTypes } from "@/entities/legendary-event"
import type { CharacterPowerValues } from "@/shared/unit-power"

import { objectiveTraitId } from "./quest-objectives"
import type { QuestTierCap } from "./quest-tier-cap"

/** The featured hero's health, armour and damage bonus in a quest (wiki). */
const FEATURED_STAT_FACTOR = 1.2

/** A synced character record, as the cap and the power formula read it (`abilities[0]` active). */
export type QuestRosterUnit = {
  unitId: string
  rank: Rank
  progressionIndex: Progression
  appliedUpgradeSlots?: readonly number[]
  abilities?: readonly { level: number }[]
  equippedItems?: readonly { equipmentId: string; level: number }[]
}

/** The catalog character fields eligibility reads. */
export type QuestTeamCharacter = {
  id: string
  faction: string
  traits: readonly string[]
  meleeDamage: string
  meleeHits: number
  rangedDamage: string | null
  rangedHits: number | null
  activeAbilityDamage?: readonly string[]
  passiveAbilityDamage?: readonly string[]
}

type Objective = { type: string; target?: string | null; score: number }

/**
 * A synced unit's state clamped to a tier's rarity cap (design D1): progression and rank, ability
 * levels and item levels. Slots applied are kept only when the rank is not lowered. `atCap` is true
 * when the unit reaches the cap's progression.
 */
export function capUnitState(
  unit: QuestRosterUnit,
  cap: QuestTierCap
): { values: CharacterPowerValues; atCap: boolean } {
  const atCap =
    progressionIndex(unit.progressionIndex) >= progressionIndex(cap.progression)
  const rankLowered = rankIndex(unit.rank) > rankIndex(cap.rank)
  const itemCap = cap.itemLevel ?? Number.POSITIVE_INFINITY
  return {
    atCap,
    values: {
      progression: atCap ? cap.progression : unit.progressionIndex,
      rank: rankLowered ? cap.rank : unit.rank,
      appliedUpgradeSlots: rankLowered ? [] : (unit.appliedUpgradeSlots ?? []),
      activeAbilityLevel: Math.min(
        unit.abilities?.[0]?.level ?? 1,
        cap.abilityLevel
      ),
      passiveAbilityLevel: Math.min(
        unit.abilities?.[1]?.level ?? 1,
        cap.abilityLevel
      ),
      items: (unit.equippedItems ?? []).map((item) => ({
        equipmentId: item.equipmentId,
        level: Math.min(item.level, itemCap),
      })),
    },
  }
}

/** The featured hero's loaner: the cap's progression and rank, abilities at the cap, no items, and
 *  the 1.2 stat factor, whether or not the player owns it. */
export function featuredHeroState(cap: QuestTierCap): CharacterPowerValues {
  return {
    progression: cap.progression,
    rank: cap.rank,
    appliedUpgradeSlots: [],
    activeAbilityLevel: cap.abilityLevel,
    passiveAbilityLevel: cap.abilityLevel,
    items: [],
    statFactor: FEATURED_STAT_FACTOR,
  }
}

const maxHits = (unit: QuestTeamCharacter) =>
  Math.max(unit.meleeHits, unit.rangedHits ?? 0)

function dealsDamageType(unit: QuestTeamCharacter, type: string) {
  return unitDealtDamageTypes({
    ...unit,
    activeAbilityDamage: [...(unit.activeAbilityDamage ?? [])],
    passiveAbilityDamage: [...(unit.passiveAbilityDamage ?? [])],
  }).includes(type)
}

/**
 * Whether a unit passes a restricting objective; null for objectives that filter nobody
 * (`DamageType`, `NoDamageTakenByAnyHero` and unknown types).
 */
export function passesObjective(
  unit: QuestTeamCharacter,
  objective: Objective,
  summoners: ReadonlySet<string>
): boolean | null {
  const target = objective.target ?? ""
  switch (objective.type) {
    case "NotTrait":
      return !unit.traits.includes(objectiveTraitId(target))
    case "NotFaction":
      return unit.faction !== target
    case "NotDamageType":
      return !dealsDamageType(unit, target)
    case "HasRangedAttack":
      return !!unit.rangedDamage
    case "MaxHits":
      return maxHits(unit) <= Number(target)
    case "MinHits":
      return maxHits(unit) >= Number(target)
    case "UseNoSummons":
      return !summoners.has(unit.id)
    case "DoNoHealOrRepair":
      return (
        !unit.traits.includes("Healer") && !unit.traits.includes("Mechanic")
      )
    default:
      return null
  }
}

type QuestTeamMember = {
  unitId: string
  featured: boolean
  /** Null when the unit power data is unavailable. */
  power: number | null
  atCap: boolean
}

export type QuestObjectiveBadge =
  | { kind: "met" }
  | { kind: "notMet" }
  | { kind: "unreachable" }
  | { kind: "noEligible" }
  | { kind: "dependsOnPlay" }
  | { kind: "none" }

export type QuestTeam = {
  members: QuestTeamMember[]
  /** Null when power is unavailable. */
  totalPower: number | null
  eligibleCount: number
  /** Slots for units other than the featured hero. */
  openSlots: number
  badges: QuestObjectiveBadge[]
  /** Per objective, the members that break it (empty when none does). */
  breakers: string[][]
  powerUnavailable: boolean
}

export type QuestTeamCandidate = {
  character: QuestTeamCharacter
  /** Capped power; null when unavailable. */
  power: number | null
  atCap: boolean
  /** Rarity-then-rank order for the fallback when power is unavailable. */
  progression: Progression
  rank: Rank
}

function byStrength(a: QuestTeamCandidate, b: QuestTeamCandidate) {
  if (a.power !== null && b.power !== null && a.power !== b.power) {
    return b.power - a.power
  }
  if (a.power === null || b.power === null) {
    const progression =
      progressionIndex(b.progression) - progressionIndex(a.progression)
    if (progression !== 0) return progression
    const rank = rankIndex(b.rank) - rankIndex(a.rank)
    if (rank !== 0) return rank
  }
  return a.character.id < b.character.id ? -1 : 1
}

/**
 * The suggested team (design D2): the featured hero, then the eligible candidates by capped power
 * (ties by id) up to `deploySlots` − 1, with one swap for a `DamageType` objective nobody meets.
 * A restriction the featured hero fails is unreachable and filters nobody (design D4).
 * `ignoreObjectives` builds the hard-rules team (allowed factions only) and still badges it against
 * the objectives, for the estimate without objectives.
 */
export function selectQuestTeam(input: {
  featured: QuestTeamCharacter
  featuredPower: number | null
  candidates: readonly QuestTeamCandidate[]
  allowedFactionIds: readonly string[]
  objectives: readonly Objective[]
  deploySlots: number
  summoners: ReadonlySet<string>
  ignoreObjectives?: boolean
}): QuestTeam {
  const { featured, objectives, summoners } = input
  const active = input.ignoreObjectives
    ? []
    : objectives.filter(
        (objective) => passesObjective(featured, objective, summoners) === true
      )
  const eligible = [
    ...input.candidates.filter(
      ({ character }) =>
        character.id !== featured.id &&
        input.allowedFactionIds.includes(character.faction) &&
        active.every(
          (objective) =>
            passesObjective(character, objective, summoners) !== false
        )
    ),
  ].sort(byStrength)
  const openSlots = Math.max(0, input.deploySlots - 1)
  const picked = eligible.slice(0, openSlots)

  for (const objective of input.ignoreObjectives ? [] : objectives) {
    if (objective.type !== "DamageType") continue
    const type = objective.target ?? ""
    const dealt = (unit: QuestTeamCharacter) => dealsDamageType(unit, type)
    if (dealt(featured) || picked.some(({ character }) => dealt(character))) {
      continue
    }
    const swap = eligible.find(
      (candidate) => !picked.includes(candidate) && dealt(candidate.character)
    )
    if (swap && picked.length > 0) picked[picked.length - 1] = swap
    else if (swap) picked.push(swap)
  }

  const team = [
    {
      character: featured,
      featured: true,
      power: input.featuredPower,
      atCap: true,
    },
    ...picked.map((candidate) => ({ ...candidate, featured: false })),
  ]
  const powerUnavailable = team.some((member) => member.power === null)
  const badges = objectives.map((objective): QuestObjectiveBadge => {
    if (objective.type === "NoDamageTakenByAnyHero") {
      return { kind: "dependsOnPlay" }
    }
    if (objective.type === "DamageType") {
      const type = objective.target ?? ""
      if (team.some(({ character }) => dealsDamageType(character, type))) {
        return { kind: "met" }
      }
      return eligible.some(({ character }) => dealsDamageType(character, type))
        ? { kind: "notMet" }
        : { kind: "noEligible" }
    }
    const featuredPasses = passesObjective(featured, objective, summoners)
    if (featuredPasses === null) return { kind: "none" }
    if (!featuredPasses) return { kind: "unreachable" }
    return team.every(
      ({ character }) =>
        passesObjective(character, objective, summoners) !== false
    )
      ? { kind: "met" }
      : { kind: "notMet" }
  })

  return {
    members: team.map((member) => ({
      unitId: member.character.id,
      featured: member.featured,
      power: member.power,
      atCap: member.atCap,
    })),
    totalPower: powerUnavailable
      ? null
      : team.reduce((sum, member) => sum + (member.power ?? 0), 0),
    eligibleCount: eligible.length,
    openSlots,
    badges,
    breakers: objectives.map((objective) =>
      team
        .filter(
          ({ character }) =>
            passesObjective(character, objective, summoners) === false
        )
        .map(({ character }) => character.id)
    ),
    powerUnavailable,
  }
}
