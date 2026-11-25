import { progressionIndex, rankIndex } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import {
  isUnitFilterAbilityAttack,
  isUnitFilterAbilityRole,
  isUnitFilterAbilityTarget,
  isUnitFilterAlliance,
  isUnitFilterAttackType,
  isUnitFilterKind,
  isUnitFilterProgression,
  isUnitFilterRank,
  isUnitFilterRarity,
  isUnitFilterSummons,
} from "./unit-filters"
import type {
  UnitFilterScope,
  UnitFilterShardSource,
  UnitFilters,
} from "./unit-filters"
import type { UnitFilterOptions } from "./use-unit-filter-options"

/** The query parameter each filter lives in; the same on every page, so a filtered link works on
 *  Collection and in the Library alike. */
export const UNIT_FILTER_PARAMS = {
  alliance: "alliance",
  factions: "faction",
  rarities: "rarity",
  rankMin: "rankMin",
  rankMax: "rankMax",
  starsMin: "starsMin",
  starsMax: "starsMax",
  kind: "kind",
  summons: "summons",
  abilityRole: "abilityRole",
  abilityTarget: "abilityTarget",
  abilityAttack: "abilityAttack",
  attack: "attack",
  hitsMin: "hitsMin",
  hitsMax: "hitsMax",
  movement: "move",
  rangeMin: "rangeMin",
  rangeMax: "rangeMax",
  damageTypes: "damage",
  traits: "trait",
  shardSources: "source",
} as const satisfies Record<keyof UnitFilters, string>

/** Each parameter to rewrite (`null` removes it) to bring the URL in line with the query read. */
export type ParamFixes = Partial<Record<string, string | null>>

const list = (raw: string) => raw.split(",")

/**
 * A reader of single parameters that records in `fixes` how to correct the URL: an invalid value is
 * removed and a list keeps only its valid items.
 */
export function paramReader(params: URLSearchParams, fixes: ParamFixes) {
  const one = <T extends string>(
    param: string,
    isValid: (value: string) => value is T
  ): T | null => {
    const raw = params.get(param)
    if (raw === null) return null
    if (isValid(raw)) return raw
    fixes[param] = null
    return null
  }
  const many = <T extends string>(
    param: string,
    isItem: ((value: string) => value is T) | undefined
  ): T[] => {
    const raw = params.get(param)
    if (raw === null || !isItem) return []
    const items = list(raw)
    const valid = items.filter(isItem)
    if (valid.length !== items.length) {
      fixes[param] = valid.length > 0 ? valid.join(",") : null
    }
    return valid
  }
  /** A number the catalog offers (`values`); `undefined` while it cannot be checked yet. */
  const amount = (
    param: string,
    values: readonly number[] | undefined
  ): number | null => {
    const raw = params.get(param)
    if (raw === null || !values) return null
    const value = Number(raw)
    if (values.includes(value)) return value
    fixes[param] = null
    return null
  }
  /** Swaps a pair read backwards, here and in the URL. */
  const ordered = <T>(
    [minParam, maxParam]: [string, string],
    [min, max]: [T | null, T | null],
    position: (value: T) => number
  ): [T | null, T | null] => {
    if (min === null || max === null || position(min) <= position(max))
      return [min, max]
    fixes[minParam] = String(max)
    fixes[maxParam] = String(min)
    return [max, min]
  }
  return { one, many, amount, ordered }
}

const identity = (value: number) => value

const among =
  (ids: readonly { id: string }[] | undefined) =>
  (value: string): value is string =>
    ids !== undefined && ids.some((item) => item.id === value)

/**
 * The unit filters the URL holds, read in one pass; the corrections the URL needs go into `fixes`
 * (a range set backwards is swapped too). The values only the catalog can check (factions, the
 * combat filters' numbers, damage types, traits and shard sources) are kept as they are and not
 * applied while `options` is `undefined`. Catalog scope does not read the roster filters.
 */
export function readUnitFilters(
  params: URLSearchParams,
  options: UnitFilterOptions | undefined,
  fixes: ParamFixes,
  scope: UnitFilterScope = "roster"
): UnitFilters {
  const { one, many, amount, ordered } = paramReader(params, fixes)
  const P = UNIT_FILTER_PARAMS
  const roster = scope === "roster"
  const [rankMin, rankMax] = roster
    ? ordered(
        [P.rankMin, P.rankMax],
        [one(P.rankMin, isUnitFilterRank), one(P.rankMax, isUnitFilterRank)],
        rankIndex
      )
    : [null, null]
  const [starsMin, starsMax] = roster
    ? ordered(
        [P.starsMin, P.starsMax],
        [
          one(P.starsMin, isUnitFilterProgression),
          one(P.starsMax, isUnitFilterProgression),
        ],
        progressionIndex
      )
    : [null, null]
  const [hitsMin, hitsMax] = ordered(
    [P.hitsMin, P.hitsMax],
    [amount(P.hitsMin, options?.hits), amount(P.hitsMax, options?.hits)],
    identity
  )
  const [rangeMin, rangeMax] = ordered(
    [P.rangeMin, P.rangeMax],
    [amount(P.rangeMin, options?.ranges), amount(P.rangeMax, options?.ranges)],
    identity
  )
  const ready = <T>(check: T) => (options ? check : undefined)
  return {
    alliance: one(P.alliance, isUnitFilterAlliance),
    factions: many(P.factions, ready(among(options?.factions))),
    rarities: many<Rarity>(P.rarities, isUnitFilterRarity),
    rankMin,
    rankMax,
    starsMin,
    starsMax,
    kind: one(P.kind, isUnitFilterKind),
    summons: one(P.summons, isUnitFilterSummons),
    abilityRole: one(P.abilityRole, isUnitFilterAbilityRole),
    abilityTarget: one(P.abilityTarget, isUnitFilterAbilityTarget),
    abilityAttack: one(P.abilityAttack, isUnitFilterAbilityAttack),
    attack: one(P.attack, isUnitFilterAttackType),
    hitsMin,
    hitsMax,
    movement: amount(P.movement, options?.movements),
    rangeMin,
    rangeMax,
    damageTypes: many(P.damageTypes, ready(among(options?.damageTypes))),
    traits: many(P.traits, ready(among(options?.traits))),
    shardSources: many(
      P.shardSources,
      ready(
        (value: string): value is UnitFilterShardSource =>
          (options?.shardSources as readonly string[] | undefined)?.includes(
            value
          ) ?? false
      )
    ),
  }
}

/** A filter's URL value; `null` removes the parameter (the filter is unset). */
export function serializeUnitFilter(
  value: UnitFilters[keyof UnitFilters]
): string | null {
  if (Array.isArray(value)) return value.length > 0 ? value.join(",") : null
  if (typeof value === "number") return String(value)
  return (value as string | null) ?? null
}

/** Applies `fixes` to `params` in place: one replacement for every fix, so fixes to several
 *  parameters cannot overwrite each other. */
export function applyParamFixes(
  params: URLSearchParams,
  fixes: ParamFixes
): URLSearchParams {
  for (const [param, value] of Object.entries(fixes)) {
    if (value == null) params.delete(param)
    else params.set(param, value)
  }
  return params
}
