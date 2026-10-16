import type {
  LegendaryEventRosterUnit,
  LegendaryEventUnit,
} from "../model/types"

/** The catalog horde-mode tier list (the `horde-mode-tiers` record), as the client reads it. */
export interface HordeModeTierList {
  tiers: readonly { tier: string; multiplier: number }[]
  characters: readonly { unitId: string; tier: string; multiplier?: number }[]
}

/** The multiplier an untiered character uses. */
export const UNTIERED_MULTIPLIER = 1

/**
 * A tiered character's effective multiplier: its own `multiplier` when set, else its tier's; null
 * when the character is untiered (or its tier is unknown). The one rule the clear-estimate config
 * and the Tier List share.
 */
export function effectiveHordeMultiplier(
  tierList: HordeModeTierList | null,
  unitId: string
): number | null {
  const entry = tierList?.characters.find(
    (character) => character.unitId === unitId
  )
  if (!entry) return null
  return (
    entry.multiplier ??
    tierList?.tiers.find((tier) => tier.tier === entry.tier)?.multiplier ??
    null
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

export interface HordeTierTile {
  unitId: string
  multiplier: number
  /** The character's own multiplier differs from its tier's. */
  overridden: boolean
  /** Undefined when the roster could not be read. */
  owned: boolean | undefined
}

export interface HordeTierRow {
  tier: string
  multiplier: number
  /** Effective multiplier descending, then localized name. */
  units: HordeTierTile[]
}

export interface HordeTierList {
  /** One row per catalog tier, in catalog order, even when the filters leave it empty. */
  rows: HordeTierRow[]
  /** Every other catalog character (1.0), by localized name. */
  untiered: Omit<HordeTierTile, "multiplier" | "overridden">[]
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

  const tierOf = new Map(
    tierList.characters
      .filter((entry) =>
        tierList.tiers.some((tier) => tier.tier === entry.tier)
      )
      .map((entry) => [entry.unitId, entry])
  )
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
          effectiveHordeMultiplier(tierList, character.id) ?? tier.multiplier
        return {
          unitId: character.id,
          multiplier,
          overridden: multiplier !== tier.multiplier,
          owned: ownedOf(character.id),
        }
      })
      .sort((a, b) => b.multiplier - a.multiplier || byName(a, b)),
  }))
  const untiered = characters
    .filter((character) => !tierOf.has(character.id) && keep(character))
    .map((character) => ({
      unitId: character.id,
      owned: ownedOf(character.id),
    }))
    .sort(byName)
  return { rows, untiered }
}
