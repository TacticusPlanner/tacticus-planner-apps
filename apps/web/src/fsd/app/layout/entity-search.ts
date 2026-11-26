import { matchTier } from "./match-tier"

/** The kinds of game entity navigation search finds, in the order their groups are listed. */
const ENTITY_KINDS = [
  "characters",
  "mows",
  "npcs",
  "raidBosses",
  "legendaryEvents",
] as const

export type EntityKind = (typeof ENTITY_KINDS)[number]

/** One game entity navigation search can open: a unit, NPC, raid boss or Legendary Event. */
export interface SearchEntity {
  kind: EntityKind
  id: string
  /** The localized display name. */
  name: string
  /** Other names players use for it (nicknames, old names), matched like keywords. */
  searchNames: readonly string[]
  /** The entity's page. */
  to: string
  iconSrc?: string
}

/** At most this many entities are listed per kind. */
const ENTITIES_PER_KIND = 5

/** Entities match only from this many characters, so one letter doesn't list every unit. */
const ENTITY_QUERY_MIN_LENGTH = 2

export interface RankedEntities {
  kind: EntityKind
  entries: { entity: SearchEntity; tier: number }[]
}

/**
 * The entities matching a normalized query, by kind: each kind's best matches first (equal
 * matches by name), at most `ENTITIES_PER_KIND`, kinds with no match left out. Uses the page ranking
 * (`matchTier`) with the name as the label and the other names as keywords.
 */
export function rankEntities(
  entities: readonly SearchEntity[],
  query: string
): RankedEntities[] {
  if (query.length < ENTITY_QUERY_MIN_LENGTH) return []
  return ENTITY_KINDS.flatMap((kind): RankedEntities[] => {
    const entries = entities
      .filter((entity) => entity.kind === kind)
      .flatMap((entity) => {
        const tier = matchTier(query, {
          label: entity.name,
          description: "",
          keywords: entity.searchNames,
          context: [],
        })
        return tier === undefined ? [] : [{ entity, tier }]
      })
      .toSorted((a, b) =>
        a.tier === b.tier
          ? a.entity.name.localeCompare(b.entity.name)
          : a.tier - b.tier
      )
      .slice(0, ENTITIES_PER_KIND)
    return entries.length > 0 ? [{ kind, entries }] : []
  })
}

/** A unit (character or Machine of War) can be the target of a new goal. */
export function isGoalUnit(entity: SearchEntity): boolean {
  return entity.kind === "characters" || entity.kind === "mows"
}

/** The unit whose Library page `pathname` is, if any. */
export function unitOfPath(
  entities: readonly SearchEntity[],
  pathname: string
): SearchEntity | undefined {
  return entities.find((entity) => isGoalUnit(entity) && entity.to === pathname)
}
