import { anyNameIncludes, normalizeSearchText } from "@/shared/lib"

/** The catalog enemy NPC tier list (the `npc-tiers` record), as the client reads it. */
export interface NpcTierListRecord {
  tiers: readonly { tier: string; multiplier: number }[]
  npcs: readonly { npcId: string; tier: string; multiplier?: number }[]
}

/** The multiplier an untiered NPC uses: its power counts as is. */
const UNTIERED_NPC_MULTIPLIER = 1

interface NpcTierEntry {
  /** Null when the record lacks the entry's tier (its own multiplier still applies). */
  tier: string | null
  multiplier: number
}

const lookups = new WeakMap<
  NpcTierListRecord,
  ReadonlyMap<string, NpcTierEntry>
>()

/**
 * The one lookup the clear-estimate config and the NPC Tier List both read, with the character tier
 * list's rules: the first entry for an `npcId` wins; the effective multiplier is the NPC's own
 * `multiplier` when set, else its tier's (the first `tiers` entry of that name); an entry naming a
 * tier the record lacks is untiered, keeping its own multiplier when it has one. Cached per record.
 */
function npcTierLookup(
  record: NpcTierListRecord
): ReadonlyMap<string, NpcTierEntry> {
  const cached = lookups.get(record)
  if (cached) return cached
  const tierMultipliers = new Map<string, number>()
  for (const { tier, multiplier } of record.tiers) {
    if (!tierMultipliers.has(tier)) tierMultipliers.set(tier, multiplier)
  }
  const lookup = new Map<string, NpcTierEntry>()
  const seen = new Set<string>()
  for (const entry of record.npcs) {
    if (seen.has(entry.npcId)) continue
    seen.add(entry.npcId)
    const tierMultiplier = tierMultipliers.get(entry.tier)
    const multiplier = entry.multiplier ?? tierMultiplier
    if (multiplier === undefined) continue
    lookup.set(entry.npcId, {
      tier: tierMultiplier === undefined ? null : entry.tier,
      multiplier,
    })
  }
  lookups.set(record, lookup)
  return lookup
}

/** Each tiered NPC's effective multiplier; an NPC absent here uses 1.0. Empty without a record. */
export function npcTierMultipliers(
  record: NpcTierListRecord | null
): ReadonlyMap<string, number> {
  if (!record) return new Map()
  return new Map(
    [...npcTierLookup(record)].map(([npcId, entry]) => [
      npcId,
      entry.multiplier,
    ])
  )
}

/** A wave enemy as the catalog serves it. */
interface BattleEnemy {
  id: string
  ladderIndex: number
  count: number
}

/** The battle fields the NPC adjustment reads. */
export interface NpcTieredBattle {
  power: number
  /** Absent in hand-built battles: the catalog power is then used as is. */
  waves?: readonly { enemies: readonly BattleEnemy[] }[]
}

/**
 * A battle's power with each enemy's power scaled by its NPC multiplier: the catalog `power` × the
 * power-weighted mean multiplier of its enemies. `enemyPower` gives one enemy's estimated power at
 * its ladder row; when any enemy's power is unknown the mean is weighted by enemy count instead.
 * Exactly the catalog power when every enemy uses 1.0 (the seed), so the estimate is unchanged until
 * the tier list says otherwise.
 */
export function npcAdjustedBattlePower(
  battle: NpcTieredBattle,
  multipliers: ReadonlyMap<string, number>,
  enemyPower: (npcId: string, ladderIndex: number) => number | null
): number {
  if (multipliers.size === 0) return battle.power
  const enemies = (battle.waves ?? []).flatMap((wave) => wave.enemies)
  const multiplierOf = (npcId: string) =>
    multipliers.get(npcId) ?? UNTIERED_NPC_MULTIPLIER
  if (enemies.every((enemy) => multiplierOf(enemy.id) === 1)) {
    return battle.power
  }
  const powers = enemies.map((enemy) => enemyPower(enemy.id, enemy.ladderIndex))
  const byPower = powers.every((power) => power !== null && power > 0)
  let weighted = 0
  let total = 0
  enemies.forEach((enemy, index) => {
    const weight = enemy.count * (byPower ? powers[index]! : 1)
    weighted += weight * multiplierOf(enemy.id)
    total += weight
  })
  return total === 0 ? battle.power : (battle.power * weighted) / total
}

/** The events (by id) each NPC fights in as a wave enemy, from those events' catalog battles. */
export function npcEventIds(
  battles: readonly {
    lreId: string
    waves: readonly { enemies: readonly { id: string }[] }[]
  }[],
  eventIds: ReadonlySet<string>
): ReadonlyMap<string, readonly string[]> {
  const byNpc = new Map<string, Set<string>>()
  for (const battle of battles) {
    if (!eventIds.has(battle.lreId)) continue
    for (const wave of battle.waves) {
      for (const enemy of wave.enemies) {
        const events = byNpc.get(enemy.id) ?? new Set<string>()
        events.add(battle.lreId)
        byNpc.set(enemy.id, events)
      }
    }
  }
  return new Map([...byNpc].map(([npcId, events]) => [npcId, [...events]]))
}

export interface NpcTierTile {
  npcId: string
  multiplier: number
  /** The NPC's own multiplier differs from its tier's. */
  overridden: boolean
}

interface NpcTierRow {
  tier: string
  multiplier: number
  /** Effective multiplier descending, then localized name. */
  npcs: NpcTierTile[]
}

interface NpcTierList {
  /** One row per catalog tier, in catalog order, even when the filters leave it empty. */
  rows: NpcTierRow[]
  /** The listed NPCs the record does not tier, by localized name. */
  untiered: NpcTierTile[]
}

interface NpcTierListFilters {
  /** Localized name contains it, case-insensitively; blank keeps all. */
  query: string
  /** An event id, or "all" for every listed event. */
  eventId: string
}

/**
 * The NPC Tier List: the NPCs of the listed events (`npcEvents`: NPC id → its event ids), one row per
 * catalog tier with each NPC's effective multiplier, then the untiered ones, filtered by event and
 * name. Every NPC is untiered when the record is absent.
 */
export function buildNpcTierList(
  record: NpcTierListRecord | null,
  npcEvents: ReadonlyMap<string, readonly string[]>,
  filters: NpcTierListFilters,
  nameOf: (npcId: string) => string,
  locale?: string
): NpcTierList {
  const needle = normalizeSearchText(filters.query, locale)
  const npcIds = [...npcEvents]
    .filter(
      ([npcId, events]) =>
        (filters.eventId === "all" || events.includes(filters.eventId)) &&
        (!needle || anyNameIncludes([nameOf(npcId)], needle, locale))
    )
    .map(([npcId]) => npcId)
  const byName = (a: NpcTierTile, b: NpcTierTile) =>
    nameOf(a.npcId).localeCompare(nameOf(b.npcId), locale)
  const tierOf = record
    ? npcTierLookup(record)
    : new Map<string, NpcTierEntry>()
  const rows = (record?.tiers ?? []).map((tier): NpcTierRow => ({
    tier: tier.tier,
    multiplier: tier.multiplier,
    npcs: npcIds
      .filter((npcId) => tierOf.get(npcId)?.tier === tier.tier)
      .map((npcId) => {
        const multiplier = tierOf.get(npcId)?.multiplier ?? tier.multiplier
        return {
          npcId,
          multiplier,
          overridden: multiplier !== tier.multiplier,
        }
      })
      .sort((a, b) => b.multiplier - a.multiplier || byName(a, b)),
  }))
  const untiered = npcIds
    .filter((npcId) => !tierOf.get(npcId)?.tier)
    .map((npcId) => {
      const multiplier = tierOf.get(npcId)?.multiplier
      return {
        npcId,
        multiplier: multiplier ?? UNTIERED_NPC_MULTIPLIER,
        overridden: multiplier !== undefined,
      }
    })
    .sort(byName)
  return { rows, untiered }
}
