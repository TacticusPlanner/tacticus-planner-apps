import {
  progressionRarity,
  rankIndex,
  rarityRank,
} from "@workspace/game-domain"
import type { Rank, Rarity } from "@workspace/game-domain"

import type { TeamRoster, TeamRosterUnit } from "@/entities/team"
import { anyNameIncludes, normalizeSearchText } from "@/shared/lib"

/** A catalog character, with the fields the picker filters on. */
export interface PickerCatalogCharacter {
  id: string
  faction: string
  alliance: string
  initialRarity: string
  traits: readonly string[]
  meleeDamage: string
  meleeHits: number
  rangedDamage: string | null
  rangedHits: number | null
  rangeDistance: number | null
  movement: number
  activeAbilityDamage: readonly string[]
  passiveAbilityDamage: readonly string[]
}

export interface PickerCatalogMow {
  id: string
  faction: string
  alliance: string
}

/** One unit the picker can list, built once per open (design D6). */
export interface PickerUnit {
  kind: "character" | "mow"
  id: string
  name: string
  /** Every name a search matches: the shown one and the game's other names for it. */
  searchNames: readonly string[]
  faction: string
  alliance: string
  /** The roster's rarity when owned, else the catalog's starting rarity (MoWs: Common). */
  rarity: Rarity
  /** Characters only; undefined when not owned. */
  rank?: Rank
  /** Undefined when the roster has not synced. */
  owned: boolean | undefined
  roster?: TeamRosterUnit
  traits: readonly string[]
  /** Characters only. */
  attack?: {
    meleeHits: number
    rangedHits: number | null
    range: number | null
    movement: number
    damageTypes: readonly string[]
  }
}

const RARITIES = new Set<string>([
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
])
const asRarity = (value: string): Rarity =>
  RARITIES.has(value) ? (value as Rarity) : "Common"

/** Builds the picker's units from the catalog and the synced roster. */
export function buildPickerUnits({
  characters,
  mows,
  roster,
  nameOf,
  searchNamesOf,
}: {
  characters: readonly PickerCatalogCharacter[]
  mows: readonly PickerCatalogMow[]
  roster: TeamRoster | null
  nameOf: (kind: "character" | "mow", id: string) => string
  searchNamesOf: (id: string) => readonly string[]
}): PickerUnit[] {
  const characterUnits = characters.map((character): PickerUnit => {
    const owned = roster?.characters.get(character.id)
    const name = nameOf("character", character.id)
    return {
      kind: "character",
      id: character.id,
      name,
      searchNames: [name, character.id, ...searchNamesOf(character.id)],
      faction: character.faction,
      alliance: character.alliance,
      rarity: owned
        ? progressionRarity(owned.progression)
        : asRarity(character.initialRarity),
      rank: owned?.rank,
      owned: roster ? owned !== undefined : undefined,
      roster: owned,
      traits: character.traits,
      attack: {
        meleeHits: character.meleeHits,
        rangedHits: character.rangedHits,
        range: character.rangeDistance,
        movement: character.movement,
        damageTypes: [
          ...new Set(
            [
              character.meleeDamage,
              character.rangedDamage,
              ...character.activeAbilityDamage,
              ...character.passiveAbilityDamage,
            ].filter((type): type is string => Boolean(type))
          ),
        ],
      },
    }
  })
  const mowUnits = mows.map((mow): PickerUnit => {
    const owned = roster?.mows.get(mow.id)
    const name = nameOf("mow", mow.id)
    return {
      kind: "mow",
      id: mow.id,
      name,
      searchNames: [name, mow.id, ...searchNamesOf(mow.id)],
      faction: mow.faction,
      alliance: mow.alliance,
      rarity: owned ? progressionRarity(owned.progression) : "Common",
      owned: roster ? owned !== undefined : undefined,
      roster: owned,
      traits: [],
    }
  })
  return sortPickerUnits([...characterUnits, ...mowUnits])
}

const rankOf = (unit: PickerUnit) => (unit.rank ? rankIndex(unit.rank) : -1)
const abilityPower = (unit: PickerUnit) => {
  const [first, second] = unit.roster?.abilityLevels ?? [0, 0]
  return first * first + second * second
}
/** The first non-zero comparison, so ties fall through to the next key. */
const firstDifference = (...differences: number[]) =>
  differences.find((difference) => difference !== 0) ?? 0

/** V1's order: rank, then ability levels (sum of squares), then rarity, highest first. */
function sortPickerUnits(units: readonly PickerUnit[]): PickerUnit[] {
  return units.toSorted((a, b) =>
    firstDifference(
      rankOf(b) - rankOf(a),
      abilityPower(b) - abilityPower(a),
      rarityRank(b.rarity) - rarityRank(a.rarity),
      a.name.localeCompare(b.name)
    )
  )
}

export type AttackType = "any" | "melee" | "ranged"

/** The picker's filters; they live as long as the editor is open. */
export interface PickerFilters {
  search: string
  /** The "Locked units" chip, on by default: whether locked units are listed. */
  lockedUnits: boolean
  rankMin: Rank | null
  rankMax: Rank | null
  rarityMin: Rarity | null
  rarityMax: Rarity | null
  faction: string | null
  alliance: string | null
  trait: string | null
  attackType: AttackType
  minHits: number | null
  movement: number | null
  minRange: number | null
  damageType: string | null
}

export const defaultPickerFilters: PickerFilters = {
  search: "",
  lockedUnits: true,
  rankMin: null,
  rankMax: null,
  rarityMin: null,
  rarityMax: null,
  faction: null,
  alliance: null,
  trait: null,
  attackType: "any",
  minHits: null,
  movement: null,
  minRange: null,
  damageType: null,
}

/** How many filters behind the Filters button are set, for its badge (search and the chip are
 *  outside it). */
export function activeFilterCount(filters: PickerFilters): number {
  return [
    filters.rankMin !== null || filters.rankMax !== null,
    filters.rarityMin !== null || filters.rarityMax !== null,
    filters.faction !== null,
    filters.alliance !== null,
    filters.trait !== null,
    filters.attackType !== "any",
    filters.minHits !== null,
    filters.movement !== null,
    filters.minRange !== null,
    filters.damageType !== null,
  ].filter(Boolean).length
}

function passesRank(unit: PickerUnit, filters: PickerFilters) {
  if (filters.rankMin === null && filters.rankMax === null) return true
  // An unowned character has no rank; it counts as below every rank (V1: Locked).
  const rank = unit.rank ? rankIndex(unit.rank) : -1
  if (filters.rankMin !== null && rank < rankIndex(filters.rankMin))
    return false
  return filters.rankMax === null || rank <= rankIndex(filters.rankMax)
}

function passesRarity(unit: PickerUnit, filters: PickerFilters) {
  const rarity = rarityRank(unit.rarity)
  if (filters.rarityMin !== null && rarity < rarityRank(filters.rarityMin)) {
    return false
  }
  return filters.rarityMax === null || rarity <= rarityRank(filters.rarityMax)
}

/** The hit counts a minimum-hits filter compares, by the chosen attack type. */
function hitsFor(attack: NonNullable<PickerUnit["attack"]>, type: AttackType) {
  if (type === "ranged") return [attack.rangedHits ?? 0]
  if (type === "melee") return [attack.meleeHits]
  return [attack.meleeHits, attack.rangedHits ?? 0]
}

function passesAttackType(
  attack: NonNullable<PickerUnit["attack"]>,
  filters: PickerFilters
) {
  const ranged = (attack.rangedHits ?? 0) > 0
  if (filters.attackType === "melee" && ranged) return false
  if (filters.attackType === "ranged" && !ranged) return false
  const minHits = filters.minHits
  return (
    minHits === null ||
    hitsFor(attack, filters.attackType).some((hits) => hits >= minHits)
  )
}

/** The character-only filters (trait, attack type, hits, movement, range, damage type). */
function passesAttack(unit: PickerUnit, filters: PickerFilters) {
  const attack = unit.attack
  if (!attack) return true
  return (
    (filters.trait === null || unit.traits.includes(filters.trait)) &&
    passesAttackType(attack, filters) &&
    (filters.movement === null || attack.movement === filters.movement) &&
    (filters.minRange === null || (attack.range ?? 0) >= filters.minRange) &&
    (filters.damageType === null ||
      attack.damageTypes.includes(filters.damageType))
  )
}

/** Whether any character-only filter is set, so MoWs (which have none of them) are left out. */
function characterOnlyFilterSet(filters: PickerFilters) {
  return (
    filters.rankMin !== null ||
    filters.rankMax !== null ||
    filters.trait !== null ||
    filters.attackType !== "any" ||
    filters.minHits !== null ||
    filters.movement !== null ||
    filters.minRange !== null ||
    filters.damageType !== null
  )
}

/**
 * The units the picker lists. Characters honour every filter; MoWs honour name, rarity, faction
 * and alliance, and are left out while a character-only filter is set. `allowedFactions` limits
 * characters to a campaign's or the Incursions' factions; `mows` false hides MoWs.
 */
export function filterPickerUnits(
  units: readonly PickerUnit[],
  filters: PickerFilters,
  {
    allowedFactions,
    mows,
    locale,
  }: {
    allowedFactions?: ReadonlySet<string>
    mows: boolean
    locale?: string
  }
): PickerUnit[] {
  const needle = normalizeSearchText(filters.search, locale)
  const characterOnly = characterOnlyFilterSet(filters)
  return units.filter((unit) => {
    if (unit.kind === "mow" && (!mows || characterOnly)) return false
    if (
      unit.kind === "character" &&
      allowedFactions &&
      !allowedFactions.has(unit.faction)
    ) {
      return false
    }
    if (!filters.lockedUnits && unit.owned === false) return false
    if (needle && !anyNameIncludes(unit.searchNames, needle, locale)) {
      return false
    }
    if (filters.faction !== null && unit.faction !== filters.faction)
      return false
    if (filters.alliance !== null && unit.alliance !== filters.alliance) {
      return false
    }
    return (
      passesRarity(unit, filters) &&
      (unit.kind === "mow" ||
        (passesRank(unit, filters) && passesAttack(unit, filters)))
    )
  })
}

const uniqueSorted = <T>(
  values: Iterable<T>,
  compare?: (a: T, b: T) => number
) => [...new Set(values)].toSorted(compare)
const byNumber = (a: number, b: number) => a - b

/** The values each filter offers, from the units themselves. */
export function pickerFilterOptions(units: readonly PickerUnit[]) {
  const characters = units.filter((unit) => unit.attack !== undefined)
  return {
    factions: uniqueSorted(units.map((unit) => unit.faction)),
    alliances: uniqueSorted(units.map((unit) => unit.alliance)),
    traits: uniqueSorted(characters.flatMap((unit) => unit.traits)),
    movements: uniqueSorted(
      characters.map((unit) => unit.attack?.movement ?? 0),
      byNumber
    ),
    ranges: uniqueSorted(
      characters
        .map((unit) => unit.attack?.range ?? 0)
        .filter((range) => range > 0),
      byNumber
    ),
    damageTypes: uniqueSorted(
      characters.flatMap((unit) => unit.attack?.damageTypes ?? [])
    ),
  }
}
