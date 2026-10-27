import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { CharacterStorageModel } from "@workspace/game-catalog"
import { allianceRank, type Alliance } from "@workspace/game-domain"

import { useCatalogDataset } from "@/shared/local-data"

import { collectionShardSources } from "./collection-query"
import { damageTypesOf, shardSourcesOf } from "./collection-view"

interface CollectionFactionOption {
  id: string
  name: string
  alliance: Alliance
}

/** A trait or damage type with its localized name. */
interface CollectionNamedOption {
  id: string
  name: string
}

/**
 * What the toolbar's filters can offer, all from the catalog: its options and the values their URL
 * parameters are validated against.
 */
export interface CollectionOptions {
  /** In Collection's group order: alliance, then localized name. */
  factions: CollectionFactionOption[]
  /** Hits per melee or ranged attack, ascending. */
  hits: number[]
  movements: number[]
  /** Ranged attack distances, ascending. */
  ranges: number[]
  /** By localized name. */
  damageTypes: CollectionNamedOption[]
  traits: CollectionNamedOption[]
  /** In the game's campaign order, "none" last; only those some character has. */
  shardSources: (typeof collectionShardSources)[number][]
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
 * The Collection toolbar's filter options, `undefined` until both unit datasets are read. The reads
 * share the Collection view's cached queries.
 */
export function useCollectionOptions(): CollectionOptions | undefined {
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
        .sort((a, b) => compare(a.name, b.name))
    return {
      factions: factionOptions([...characters, ...mows], (id) =>
        t(`factions:${id}`, { defaultValue: id })
      ).sort(
        (a, b) =>
          allianceRank(a.alliance) - allianceRank(b.alliance) ||
          compare(a.name, b.name)
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
    [...new Set(values)].sort((a, b) => a - b)
  const sources = new Set(characters.flatMap((c) => [...shardSourcesOf(c)]))
  return {
    hits: ascending(
      characters.flatMap((c) =>
        c.rangedHits ? [c.meleeHits, c.rangedHits] : [c.meleeHits]
      )
    ),
    movements: ascending(characters.map((c) => c.movement)),
    ranges: ascending(
      characters.flatMap((c) => (c.rangeDistance ? [c.rangeDistance] : []))
    ),
    shardSources: collectionShardSources.filter((source) =>
      sources.has(source)
    ),
  }
}

function factionOptions(
  units: readonly { faction: string; alliance: Alliance }[],
  factionName: (id: string) => string
): CollectionFactionOption[] {
  const byId = new Map<string, CollectionFactionOption>()
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
