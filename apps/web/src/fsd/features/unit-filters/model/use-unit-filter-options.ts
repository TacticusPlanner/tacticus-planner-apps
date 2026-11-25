import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { CharacterStorageModel } from "@workspace/game-catalog"
import { allianceRank } from "@workspace/game-domain"
import type { Alliance } from "@workspace/game-domain"

import { firstDifference } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"

import { damageTypesOf, shardSourcesOf } from "./unit-filter-match"
import { unitFilterShardSources } from "./unit-filters"

interface UnitFilterFactionOption {
  id: string
  name: string
  alliance: Alliance
}

/** A trait or damage type with its localized name. */
interface UnitFilterNamedOption {
  id: string
  name: string
}

/**
 * What the unit filters can offer, all from the catalog: its options and the values their URL
 * parameters are validated against.
 */
export interface UnitFilterOptions {
  /** In Collection's faction group order: alliance, then localized name. */
  factions: UnitFilterFactionOption[]
  /** Hits per melee or ranged attack, ascending. */
  hits: number[]
  movements: number[]
  /** Ranged attack distances, ascending. */
  ranges: number[]
  /** By localized name. */
  damageTypes: UnitFilterNamedOption[]
  traits: UnitFilterNamedOption[]
  /** In the game's campaign order, "none" last; only those some character has. */
  shardSources: (typeof unitFilterShardSources)[number][]
}

type OptionCharacter = Pick<
  CharacterStorageModel,
  | "meleeHits"
  | "meleeDamage"
  | "rangedHits"
  | "rangedDamage"
  | "rangeDistance"
  | "movement"
  | "traits"
  | "activeAbilityDamage"
  | "passiveAbilityDamage"
  | "shardLocations"
>

/**
 * The unit filters' options, `undefined` until both unit datasets are read. The reads share the
 * unit lists' cached queries.
 */
export function useUnitFilterOptions(): UnitFilterOptions | undefined {
  const { t, i18n } = useTranslation(["factions", "traits", "damageTypes"])
  const charactersRead = useCatalogDataset("characters")
  const mowsRead = useCatalogDataset("mows")
  const characters =
    charactersRead.status === "ready" ? charactersRead.data : undefined
  const mows = mowsRead.status === "ready" ? mowsRead.data : undefined

  return useMemo(() => {
    if (!characters || !mows) return undefined
    const compare = (a: string, b: string) => a.localeCompare(b, i18n.language)
    const named = (ns: string, ids: Iterable<string>) =>
      [...new Set(ids)]
        .map((id) => ({ id, name: t(`${ns}:${id}`, { defaultValue: id }) }))
        .toSorted((a, b) => compare(a.name, b.name))
    return {
      factions: factionOptions([...characters, ...mows], (id) =>
        t(`factions:${id}`, { defaultValue: id })
      ).toSorted((a, b) =>
        firstDifference(
          allianceRank(a.alliance) - allianceRank(b.alliance),
          compare(a.name, b.name)
        )
      ),
      ...combatOptions(characters),
      damageTypes: named("damageTypes", characters.flatMap(damageTypesOf)),
      traits: named(
        "traits",
        characters.flatMap((character) => character.traits)
      ),
    }
  }, [characters, mows, t, i18n.language])
}

function combatOptions(characters: readonly OptionCharacter[]) {
  const ascending = (values: Iterable<number>) =>
    [...new Set(values)].toSorted((a, b) => a - b)
  const sources = new Set(characters.flatMap((c) => [...shardSourcesOf(c)]))
  return {
    hits: ascending(
      characters.flatMap((c) =>
        c.rangedHits !== null && c.rangedHits > 0
          ? [c.meleeHits, c.rangedHits]
          : [c.meleeHits]
      )
    ),
    movements: ascending(characters.map((c) => c.movement)),
    ranges: ascending(
      characters.flatMap((c) =>
        c.rangeDistance !== null && c.rangeDistance > 0 ? [c.rangeDistance] : []
      )
    ),
    shardSources: unitFilterShardSources.filter((source) =>
      sources.has(source)
    ),
  }
}

function factionOptions(
  units: readonly { faction: string; alliance: Alliance }[],
  factionName: (id: string) => string
): UnitFilterFactionOption[] {
  const byId = new Map<string, UnitFilterFactionOption>()
  for (const unit of units) {
    if (!byId.has(unit.faction)) {
      byId.set(unit.faction, {
        id: unit.faction,
        name: factionName(unit.faction),
        alliance: unit.alliance,
      })
    }
  }
  return [...byId.values()]
}
