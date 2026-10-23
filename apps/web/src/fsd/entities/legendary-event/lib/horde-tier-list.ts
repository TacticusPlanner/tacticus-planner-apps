import type {
  LegendaryEventRosterUnit,
  LegendaryEventUnit,
} from "../model/types"

/** The catalog horde-mode tier list (the `horde-mode-tiers` record), as the client reads it. */
export interface HordeModeTierList {
  tiers: readonly { tier: string; multiplier: number }[]
  characters: readonly {
    unitId: string
    tier: string
    multiplier?: number
    /** Recommended teammates (character ids), best first. */
    synergies?: readonly string[]
    /** Relic-conditional multipliers, each applied while that relic is equipped. */
    relics?: readonly HordeRelicRating[]
  }[]
}

/** A relic-conditional rating: the multiplier a character gets while `equipmentId` is equipped. */
export interface HordeRelicRating {
  equipmentId: string
  multiplier: number
}

/** The multiplier an untiered character uses. */
export const UNTIERED_MULTIPLIER = 1

/** A character's resolved entry: its tier (null when the catalog lacks that tier) and its
 *  effective multiplier. */
interface HordeTierEntry {
  tier: string | null
  multiplier: number
}

const lookups = new WeakMap<
  HordeModeTierList,
  ReadonlyMap<string, HordeTierEntry>
>()

/**
 * The one lookup the clear-estimate config and the Tier List both read, so they always agree on
 * malformed data. Rules: the first entry for a `unitId` wins (later duplicates are ignored, even
 * when the first is unusable); the effective multiplier is the character's own `multiplier` when
 * set, else its tier's (the first `tiers` entry of that name). An entry whose tier is not in `tiers`
 * leaves the character untiered: with its own `multiplier` it keeps that value (shown in the
 * Untiered row with it), without one it is absent here and uses 1.0. Cached per dataset object.
 */
function hordeTierLookup(
  tierList: HordeModeTierList
): ReadonlyMap<string, HordeTierEntry> {
  const cached = lookups.get(tierList)
  if (cached) return cached
  const tierMultipliers = new Map<string, number>()
  for (const { tier, multiplier } of tierList.tiers) {
    if (!tierMultipliers.has(tier)) tierMultipliers.set(tier, multiplier)
  }
  const lookup = new Map<string, HordeTierEntry>()
  // Every unitId seen so far, untiered ones too, so a later duplicate never overrides the first.
  const seen = new Set<string>()
  for (const entry of tierList.characters) {
    if (seen.has(entry.unitId)) continue
    seen.add(entry.unitId)
    const tierMultiplier = tierMultipliers.get(entry.tier)
    const multiplier = entry.multiplier ?? tierMultiplier
    if (multiplier === undefined) continue
    lookup.set(entry.unitId, {
      tier: tierMultiplier === undefined ? null : entry.tier,
      multiplier,
    })
  }
  lookups.set(tierList, lookup)
  return lookup
}

/**
 * A character's effective multiplier (see `hordeTierLookup` for the rules); null when it uses the
 * untiered 1.0. The one rule the clear-estimate config and the
 * Tier List share.
 */
export function effectiveHordeMultiplier(
  tierList: HordeModeTierList | null,
  unitId: string
): number | null {
  if (!tierList) return null
  return hordeTierLookup(tierList).get(unitId)?.multiplier ?? null
}

/** A character's tier name (see `hordeTierLookup` for the rules); null when it is untiered,
 *  including when its tier is missing from the record. */
export function hordeTierName(
  tierList: HordeModeTierList | null,
  unitId: string
): string | null {
  if (!tierList) return null
  return hordeTierLookup(tierList).get(unitId)?.tier ?? null
}

/** A character's relic ratings (see `hordeTierLookup`'s first-entry rule); empty without any. */
export function hordeRelics(
  tierList: HordeModeTierList | null,
  unitId: string
): readonly HordeRelicRating[] {
  return (
    tierList?.characters.find((character) => character.unitId === unitId)
      ?.relics ?? []
  )
}

export type HordeTierAlliance = "all" | "Imperial" | "Chaos" | "Xenos"

export interface HordeTierListFilters {
  /** Localized name contains it, case-insensitively; blank keeps all. */
  query: string
  /** Ignored while the roster is unknown. */
  onlyOwned: boolean
  alliance: HordeTierAlliance
}

interface HordeTierTile {
  unitId: string
  multiplier: number
  /** The character's own multiplier differs from its tier's. */
  overridden: boolean
  /** Undefined when the roster could not be read. */
  owned: boolean | undefined
  /** Its relic ratings (details and the relic mark); the tile's multiplier stays the base one. */
  relics: readonly HordeRelicRating[]
}

interface HordeTierRow {
  tier: string
  multiplier: number
  /** Effective multiplier descending, then localized name. */
  units: HordeTierTile[]
}

export interface HordeTierList {
  /** One row per catalog tier, in catalog order, even when the filters leave it empty. */
  rows: HordeTierRow[]
  /** Every other catalog character, by localized name: 1.0, or its own multiplier when its entry
   *  names a tier the catalog lacks (`overridden` then). */
  untiered: HordeTierTile[]
}

/**
 * The Tier List (spec: the Tier List page shows the horde-mode tier list): tiles per tier with the
 * effective multiplier and an override mark, then the untiered catalog characters, all filtered by
 * name, ownership and alliance. Null when the dataset is absent.
 */
export function buildHordeTierList(
  tierList: HordeModeTierList | null,
  characters: readonly Pick<LegendaryEventUnit, "id" | "alliance">[],
  roster: readonly Pick<LegendaryEventRosterUnit, "unitId">[] | undefined,
  filters: HordeTierListFilters,
  nameOf: (unitId: string) => string,
  locale?: string
): HordeTierList | null {
  if (!tierList) return null
  const owned = roster
    ? new Set(roster.map((unit) => unit.unitId as string))
    : undefined
  const needle = filters.query.trim().toLocaleLowerCase(locale)
  const keep = (character: Pick<LegendaryEventUnit, "id" | "alliance">) =>
    (filters.alliance === "all" || character.alliance === filters.alliance) &&
    (!filters.onlyOwned || !owned || owned.has(character.id)) &&
    (!needle || nameOf(character.id).toLocaleLowerCase(locale).includes(needle))
  const byName = (a: { unitId: string }, b: { unitId: string }) =>
    nameOf(a.unitId).localeCompare(nameOf(b.unitId), locale)
  const ownedOf = (unitId: string) => (owned ? owned.has(unitId) : undefined)

  const tierOf = hordeTierLookup(tierList)
  const rows = tierList.tiers.map((tier): HordeTierRow => ({
    tier: tier.tier,
    multiplier: tier.multiplier,
    units: characters
      .filter(
        (character) =>
          tierOf.get(character.id)?.tier === tier.tier && keep(character)
      )
      .map((character) => {
        const multiplier =
          tierOf.get(character.id)?.multiplier ?? tier.multiplier
        return {
          unitId: character.id,
          multiplier,
          overridden: multiplier !== tier.multiplier,
          owned: ownedOf(character.id),
          relics: hordeRelics(tierList, character.id),
        }
      })
      .sort((a, b) => b.multiplier - a.multiplier || byName(a, b)),
  }))
  const untiered = characters
    .filter((character) => !tierOf.get(character.id)?.tier && keep(character))
    .map((character): HordeTierTile => {
      const multiplier =
        tierOf.get(character.id)?.multiplier ?? UNTIERED_MULTIPLIER
      return {
        unitId: character.id,
        multiplier,
        overridden: multiplier !== UNTIERED_MULTIPLIER,
        owned: ownedOf(character.id),
        relics: [],
      }
    })
    .sort(byName)
  return { rows, untiered }
}
