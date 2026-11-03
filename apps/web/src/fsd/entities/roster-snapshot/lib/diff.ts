import {
  isRank,
  progressionIndex,
  progressionOrder,
  progressionRarity,
  progressionStarsIndex,
  rankIndex,
  rarityRank,
  startingProgression,
  type Progression,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

type DiffUnitKind = "character" | "mow"

/** One unit's stored state on either side of a diff: a snapshot's or the synced roster's record.
 *  Every field but the id and progression is optional, so a caller with a narrower record (the
 *  Legendary Event roster) can still be compared; a missing field never reads as a change. */
export interface DiffUnit {
  unitId: string
  progressionIndex: Progression
  /** Characters only. A rank the game domain does not know (newer API data) is never a change. */
  rank?: string
  xp?: number
  xpLevel?: number
  shards?: number
  mythicShards?: number
  abilities?: readonly { abilityId: string; level: number }[]
  appliedUpgradeSlots?: readonly number[]
  /** Characters only. */
  equippedItems?: readonly {
    slotId: string
    equipmentId: string
    level: number
  }[]
}

/** One side of a diff: a snapshot body or the current roster. */
export interface DiffRoster {
  characters?: readonly DiffUnit[]
  mows?: readonly DiffUnit[]
  /** The roster was reconstructed rather than synced (a V1 import): total XP, applied upgrades and
   *  MoW XP levels were not recorded, so they are unknown and never produce a change. */
  progressUnknown?: boolean
}

/** The catalog version the API stamps on a roster rebuilt from V1 (v1-roster-snapshot-import). */
export const V1_IMPORT_CATALOG_VERSION = "v1-import"

/** The catalog figures a full diff reads; every member is optional, so a caller that only needs the
 *  progression, rank and ability changes (Legendary Event history) passes none. */
export interface RosterDiffContext {
  /** The rarity a unit unlocks at; without it an unlock adds no spent shards. */
  initialRarity?: (kind: DiffUnitKind, unitId: string) => Rarity | undefined
  /** The shards to unlock a unit of `rarity`. */
  unlockShards?: (rarity: Rarity) => number | undefined
  /** The shards and mythic shards to reach `progression` from the step before it. */
  stepCost?: (
    progression: Progression
  ) => { shards: number; mythicShards: number } | undefined
  /** A unit's power at one side's state; null when it cannot be computed. */
  power?: (kind: DiffUnitKind, unit: DiffUnit) => number | null
}

interface FromTo<T> {
  from: T
  to: T
}

/** Held shards across the diff: `net = to − from`, `spent` on the progression steps (and unlock)
 *  crossed, `earned = net + spent`. */
interface ShardChange {
  from: number
  to: number
  net: number
  spent: number
  earned: number
}

interface AbilityChange extends FromTo<number> {
  /** 0 is the active (primary) ability, 1 the passive (secondary). */
  slot: number
  abilityId: string
}

interface EquipmentChange {
  slotId: string
  from: { equipmentId: string; level: number } | null
  to: { equipmentId: string; level: number }
}

/** Every change on one unit owned in "to" (spec: roster-snapshot-diff). Values that went down are
 *  ignored, except shards. An unlocked unit carries no progression, rank, upgrade, XP or ability
 *  change; its shards and power count from zero. */
export interface UnitDiff {
  unitId: string
  kind: DiffUnitKind
  /** Absent in "from", owned in "to". */
  unlocked: boolean
  changed: boolean
  progression: FromTo<Progression> | null
  rank: FromTo<Rank> | null
  /** Applied upgrade slots at the same rank, when more are applied. */
  upgrades: FromTo<number> | null
  xpLevel: FromTo<number> | null
  /** XP gained, when positive. */
  xpGained: number | null
  shards: ShardChange | null
  mythicShards: ShardChange | null
  abilities: AbilityChange[]
  equipment: EquipmentChange[]
  /** Power at each side; null when either side cannot be computed (or no power was asked for). */
  power: (FromTo<number> & { delta: number }) | null
}

/**
 * One diff entry per unit owned in "to", in "to" order (characters, then MoWs). Units owned only
 * in "from" are omitted. See `UnitDiff` for the per-field rules.
 */
export function diffRosters(
  from: DiffRoster,
  to: DiffRoster,
  context: RosterDiffContext = {}
): UnitDiff[] {
  const before = new Map<string, DiffUnit>(
    [...(from.characters ?? []), ...(from.mows ?? [])].map((unit) => [
      unit.unitId,
      unit,
    ])
  )
  const entries = [
    ...(to.characters ?? []).map((unit) => ["character", unit] as const),
    ...(to.mows ?? []).map((unit) => ["mow", unit] as const),
  ]
  const unknown = from.progressUnknown === true || to.progressUnknown === true
  return entries.map(([kind, unit]) =>
    diffUnit(kind, before.get(unit.unitId), unit, context, unknown)
  )
}

function diffUnit(
  kind: DiffUnitKind,
  before: DiffUnit | undefined,
  after: DiffUnit,
  context: RosterDiffContext,
  progressUnknown: boolean
): UnitDiff {
  const unlocked = before === undefined
  const endIndex = progressionIndex(after.progressionIndex)
  const startIndex = unlocked
    ? unlockIndex(kind, after.unitId, context, endIndex)
    : progressionIndex(before.progressionIndex)
  // A progression missing from the local ladder (a newer catalog) has no step costs or change.
  const knownProgression = startIndex >= 0 && endIndex >= 0
  const unlockCost = unlocked ? unlockShardCost(kind, after, context) : 0
  const stepCosts = knownProgression
    ? progressionStepCosts(startIndex, endIndex, context)
    : { shards: 0, mythicShards: 0 }
  const shards = shardChange(
    before,
    before?.shards,
    after.shards,
    unlockCost + stepCosts.shards
  )
  const mythicShards = shardChange(
    before,
    before?.mythicShards,
    after.mythicShards,
    stepCosts.mythicShards
  )
  const power = powerChange(kind, before, after, context)

  const changes = before
    ? {
        progression: knownProgression
          ? later(
              before.progressionIndex,
              after.progressionIndex,
              progressionIndex
            )
          : null,
        rank:
          before.rank !== undefined &&
          after.rank !== undefined &&
          isRank(before.rank) &&
          isRank(after.rank)
            ? later(before.rank, after.rank, rankIndex)
            : null,
        upgrades: progressUnknown ? null : upgradesChange(before, after),
        xpLevel:
          !(progressUnknown && kind === "mow") &&
          before.xpLevel !== undefined &&
          after.xpLevel !== undefined
            ? later(before.xpLevel, after.xpLevel, (level) => level)
            : null,
        xpGained:
          !progressUnknown &&
          before.xp !== undefined &&
          after.xp !== undefined &&
          after.xp > before.xp
            ? after.xp - before.xp
            : null,
        abilities: abilityChanges(before, after),
        equipment: equipmentChanges(before, after),
      }
    : {
        progression: null,
        rank: null,
        upgrades: null,
        xpLevel: null,
        xpGained: null,
        abilities: [],
        equipment: [],
      }

  const changed =
    unlocked ||
    changes.progression !== null ||
    changes.rank !== null ||
    changes.upgrades !== null ||
    changes.xpLevel !== null ||
    changes.xpGained !== null ||
    (shards !== null && shards.net !== 0) ||
    (mythicShards !== null && mythicShards.net !== 0) ||
    changes.abilities.length > 0 ||
    changes.equipment.length > 0 ||
    (power !== null && power.delta !== 0)

  return {
    unitId: after.unitId,
    kind,
    unlocked,
    changed,
    ...changes,
    shards,
    mythicShards,
    power,
  }
}

function later<T>(
  from: T,
  to: T,
  order: (value: T) => number
): FromTo<T> | null {
  return order(to) > order(from) ? { from, to } : null
}

/** The ladder index a unit unlocks at; `fallback` (no steps counted) when its rarity is unknown. */
function unlockIndex(
  kind: DiffUnitKind,
  unitId: string,
  context: RosterDiffContext,
  fallback: number
): number {
  const rarity = context.initialRarity?.(kind, unitId)
  return rarity ? progressionIndex(startingProgression(rarity)) : fallback
}

function unlockShardCost(
  kind: DiffUnitKind,
  unit: DiffUnit,
  context: RosterDiffContext
): number {
  const rarity = context.initialRarity?.(kind, unit.unitId)
  return (rarity && context.unlockShards?.(rarity)) ?? 0
}

/** The shards and mythic shards of every step after `startIndex` up to and including `endIndex`. */
function progressionStepCosts(
  startIndex: number,
  endIndex: number,
  context: RosterDiffContext
): { shards: number; mythicShards: number } {
  let shards = 0
  let mythicShards = 0
  if (!context.stepCost) return { shards, mythicShards }
  for (const step of progressionOrder.slice(startIndex + 1, endIndex + 1)) {
    const cost = context.stepCost(step)
    shards += cost?.shards ?? 0
    mythicShards += cost?.mythicShards ?? 0
  }
  return { shards, mythicShards }
}

function shardChange(
  before: DiffUnit | undefined,
  from: number | undefined,
  to: number | undefined,
  spent: number
): ShardChange | null {
  // A newly unlocked unit starts from 0; an existing unit without the field has no comparison.
  if (to === undefined || (before !== undefined && from === undefined)) {
    return null
  }
  const held = from ?? 0
  const net = to - held
  return { from: held, to, net, spent, earned: net + spent }
}

function upgradesChange(
  before: DiffUnit,
  after: DiffUnit
): FromTo<number> | null {
  if (
    before.rank === undefined ||
    before.rank !== after.rank ||
    !before.appliedUpgradeSlots ||
    !after.appliedUpgradeSlots
  ) {
    return null
  }
  const from = before.appliedUpgradeSlots.length
  const to = after.appliedUpgradeSlots.length
  return to > from ? { from, to } : null
}

/** Each "to" ability whose level rose, matched by ability id and falling back to its slot. */
function abilityChanges(before: DiffUnit, after: DiffUnit): AbilityChange[] {
  const previousAbilities = before.abilities ?? []
  return (after.abilities ?? []).flatMap((ability, slot) => {
    const previous =
      previousAbilities.find(
        (entry) => entry.abilityId === ability.abilityId
      ) ?? previousAbilities[slot]
    return previous && ability.level > previous.level
      ? [
          {
            slot,
            abilityId: ability.abilityId,
            from: previous.level,
            to: ability.level,
          },
        ]
      : []
  })
}

/** Each "to" equipment slot whose item changed or whose level rose. */
function equipmentChanges(
  before: DiffUnit,
  after: DiffUnit
): EquipmentChange[] {
  if (!before.equippedItems || !after.equippedItems) return []
  const previousBySlot = new Map(
    before.equippedItems.map((item) => [item.slotId, item])
  )
  return after.equippedItems.flatMap((item): EquipmentChange[] => {
    const previous = previousBySlot.get(item.slotId)
    const to = { equipmentId: item.equipmentId, level: item.level }
    if (!previous) return [{ slotId: item.slotId, from: null, to }]
    if (
      previous.equipmentId === item.equipmentId &&
      item.level <= previous.level
    ) {
      return []
    }
    return [
      {
        slotId: item.slotId,
        from: { equipmentId: previous.equipmentId, level: previous.level },
        to,
      },
    ]
  })
}

function powerChange(
  kind: DiffUnitKind,
  before: DiffUnit | undefined,
  after: DiffUnit,
  context: RosterDiffContext
): UnitDiff["power"] {
  if (!context.power) return null
  const to = context.power(kind, after)
  const from = before ? context.power(kind, before) : 0
  if (to === null || from === null) return null
  return { from, to, delta: to - from }
}

/** The summary metrics, in display order. */
export const rosterDiffMetrics = [
  "unlocked",
  "ascensions",
  "promotions",
  "rankUps",
  "abilityLevels",
  "upgradesApplied",
  "shardsEarned",
  "mythicShardsEarned",
  "power",
] as const

export type RosterDiffMetric = (typeof rosterDiffMetrics)[number]

export type RosterDiffSummary = Record<RosterDiffMetric, number>

/** Rarity steps and star steps crossed between two progressions (each ladder step is one or the
 *  other). */
function progressionSteps(change: FromTo<Progression> | null): {
  ascensions: number
  promotions: number
} {
  if (!change) return { ascensions: 0, promotions: 0 }
  const ascensions =
    rarityRank(progressionRarity(change.to)) -
    rarityRank(progressionRarity(change.from))
  const promotions =
    progressionStarsIndex(change.to) - progressionStarsIndex(change.from)
  return {
    ascensions: Math.max(0, ascensions),
    promotions: Math.max(0, promotions),
  }
}

/** One unit's contribution to each summary metric. */
function unitDiffMetrics(diff: UnitDiff): RosterDiffSummary {
  const steps = progressionSteps(diff.progression)
  return {
    unlocked: diff.unlocked ? 1 : 0,
    ascensions: steps.ascensions,
    promotions: steps.promotions,
    rankUps: diff.rank
      ? rankIndex(diff.rank.to) - rankIndex(diff.rank.from)
      : 0,
    abilityLevels: diff.abilities.reduce(
      (sum, ability) => sum + ability.to - ability.from,
      0
    ),
    upgradesApplied: diff.upgrades ? diff.upgrades.to - diff.upgrades.from : 0,
    shardsEarned: Math.max(0, diff.shards?.earned ?? 0),
    mythicShardsEarned: Math.max(0, diff.mythicShards?.earned ?? 0),
    power: diff.power?.delta ?? 0,
  }
}

/** The summary over `diffs` (spec: "The summary is derived from the diff"). */
export function summarizeRosterDiff(
  diffs: readonly UnitDiff[]
): RosterDiffSummary {
  const summary = Object.fromEntries(
    rosterDiffMetrics.map((metric) => [metric, 0])
  ) as RosterDiffSummary
  for (const diff of diffs) {
    const metrics = unitDiffMetrics(diff)
    for (const metric of rosterDiffMetrics) summary[metric] += metrics[metric]
  }
  return summary
}

/** Whether `diff` adds to `metric` (the summary's list narrowing). */
export function contributesTo(
  diff: UnitDiff,
  metric: RosterDiffMetric
): boolean {
  return unitDiffMetrics(diff)[metric] > 0
}
