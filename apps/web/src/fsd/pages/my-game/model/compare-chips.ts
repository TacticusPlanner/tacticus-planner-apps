import {
  progressionRarity,
  progressionStarsIndex,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

import type { UnitDiff } from "@/entities/roster-snapshot"

import { progressionStarsKey, type ProgressionStarsKey } from "./compare-labels"
import type { CompareField } from "./compare-view"

/** One change chip on a diff tile or row; the UI localizes it by `kind`. */
export type CompareChip =
  | { kind: "unlocked" }
  | { kind: "rarity"; to: Rarity }
  | { kind: "stars"; count: number }
  | { kind: "rank"; from: Rank; to: Rank }
  | { kind: "upgrades"; count: number }
  | { kind: "xpLevel"; count: number }
  | { kind: "abilities"; count: number }
  | { kind: "shards"; count: number }
  | { kind: "mythicShards"; count: number }
  | { kind: "equipment"; count: number }
  | { kind: "power"; count: number }

/**
 * The chips for one unit's changed fields, in a fixed order. Progression and rank always show;
 * the rest follow the fields setting (it hides chips, never units). Shards show what was earned.
 */
export function compareChips(
  diff: UnitDiff,
  fields: ReadonlySet<CompareField>
): CompareChip[] {
  const chips: CompareChip[] = []
  if (diff.unlocked) chips.push({ kind: "unlocked" })
  if (diff.progression) {
    const stars =
      progressionStarsIndex(diff.progression.to) -
      progressionStarsIndex(diff.progression.from)
    const rarity = progressionRarity(diff.progression.to)
    if (rarity !== progressionRarity(diff.progression.from)) {
      chips.push({ kind: "rarity", to: rarity })
    }
    if (stars > 0) chips.push({ kind: "stars", count: stars })
  }
  if (diff.rank) {
    chips.push({ kind: "rank", from: diff.rank.from, to: diff.rank.to })
  }
  if (fields.has("upgrades") && diff.upgrades) {
    chips.push({
      kind: "upgrades",
      count: diff.upgrades.to - diff.upgrades.from,
    })
  }
  if (fields.has("xp") && diff.xpLevel) {
    chips.push({
      kind: "xpLevel",
      count: diff.xpLevel.to - diff.xpLevel.from,
    })
  }
  if (fields.has("abilities") && diff.abilities.length > 0) {
    chips.push({
      kind: "abilities",
      count: diff.abilities.reduce(
        (sum, ability) => sum + ability.to - ability.from,
        0
      ),
    })
  }
  if (fields.has("shards") && diff.shards && diff.shards.earned > 0) {
    chips.push({ kind: "shards", count: diff.shards.earned })
  }
  if (
    fields.has("mythicShards") &&
    diff.mythicShards &&
    diff.mythicShards.earned > 0
  ) {
    chips.push({ kind: "mythicShards", count: diff.mythicShards.earned })
  }
  if (fields.has("equipment") && diff.equipment.length > 0) {
    chips.push({ kind: "equipment", count: diff.equipment.length })
  }
  if (fields.has("power") && diff.power && diff.power.delta !== 0) {
    chips.push({ kind: "power", count: diff.power.delta })
  }
  return chips
}

/** One row of a unit's diff details, before → after; the UI localizes it by `kind`. */
export type DetailRow =
  | { kind: "unlocked" }
  | { kind: "rank"; from: Rank; to: Rank }
  | { kind: "stars"; from: ProgressionStarsKey; to: ProgressionStarsKey }
  | { kind: "upgrades" | "xpLevel" | "power"; from: number; to: number }
  | { kind: "xpGained"; value: number }
  | { kind: "ability"; slot: number; from: number; to: number }
  | {
      kind: "equipment"
      slotId: string
      from: { equipmentId: string; level: number } | null
      to: { equipmentId: string; level: number }
    }
  | {
      kind: "shards" | "mythicShards"
      change: NonNullable<UnitDiff["shards"]>
    }

/** The details rows for one unit, following the fields setting like the chips. */
export function detailRows(
  diff: UnitDiff,
  fields: ReadonlySet<CompareField>
): DetailRow[] {
  const rows: DetailRow[] = []
  if (diff.unlocked) rows.push({ kind: "unlocked" })
  if (diff.rank) rows.push({ kind: "rank", ...diff.rank })
  if (diff.progression) {
    rows.push({
      kind: "stars",
      from: progressionStarsKey(diff.progression.from),
      to: progressionStarsKey(diff.progression.to),
    })
  }
  if (fields.has("upgrades") && diff.upgrades) {
    rows.push({ kind: "upgrades", ...diff.upgrades })
  }
  if (fields.has("xp")) {
    if (diff.xpLevel) rows.push({ kind: "xpLevel", ...diff.xpLevel })
    if (diff.xpGained !== null) {
      rows.push({ kind: "xpGained", value: diff.xpGained })
    }
  }
  if (fields.has("abilities")) {
    for (const ability of diff.abilities) {
      rows.push({ kind: "ability", ...ability })
    }
  }
  if (fields.has("shards") && diff.shards && hasShardChange(diff.shards)) {
    rows.push({ kind: "shards", change: diff.shards })
  }
  if (
    fields.has("mythicShards") &&
    diff.mythicShards &&
    hasShardChange(diff.mythicShards)
  ) {
    rows.push({ kind: "mythicShards", change: diff.mythicShards })
  }
  if (fields.has("equipment")) {
    for (const change of diff.equipment) {
      rows.push({ kind: "equipment", ...change })
    }
  }
  if (fields.has("power") && diff.power && diff.power.delta !== 0) {
    rows.push({ kind: "power", from: diff.power.from, to: diff.power.to })
  }
  return rows
}

const hasShardChange = (change: NonNullable<UnitDiff["shards"]>) =>
  change.net !== 0 || change.spent !== 0
