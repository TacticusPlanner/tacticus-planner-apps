import type { Progression, Rank } from "@workspace/game-domain"

import type { UnitDiff } from "@/entities/roster-snapshot"

import type { CompareField } from "./compare-view"

/** One change chip on a diff tile or row; the UI localizes it by `kind`. */
export type CompareChip =
  | { kind: "unlocked" }
  | { kind: "progression"; from: Progression; to: Progression }
  | { kind: "rank"; from: Rank; to: Rank }
  | { kind: "upgrades"; count: number }
  | { kind: "xpLevel"; count: number }
  | {
      kind: "ability"
      /** 0 is the active (primary) ability, 1 the passive (secondary). */
      slot: number
      abilityId: string
      from: number
      to: number
    }
  | { kind: "shards"; count: number }
  | { kind: "mythicShards"; count: number }
  | { kind: "equipment"; count: number }
  | { kind: "power"; count: number }

/**
 * The chips for one unit's changed fields, in a fixed order. Progression and rank always show;
 * the rest follow the fields setting (it hides chips, never units). Each changed ability gets its
 * own chip; shards show what was earned.
 */
export function compareChips(
  diff: UnitDiff,
  fields: ReadonlySet<CompareField>
): CompareChip[] {
  const chips: CompareChip[] = []
  if (diff.unlocked) chips.push({ kind: "unlocked" })
  if (diff.progression) {
    chips.push({ kind: "progression", ...diff.progression })
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
  if (fields.has("abilities")) {
    for (const ability of diff.abilities) {
      chips.push({ kind: "ability", ...ability })
    }
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
  | { kind: "progression"; from: Progression; to: Progression }
  | { kind: "upgrades" | "xpLevel" | "power"; from: number; to: number }
  | { kind: "xpGained"; value: number }
  | {
      kind: "ability"
      slot: number
      abilityId: string
      from: number
      to: number
    }
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
    rows.push({ kind: "progression", ...diff.progression })
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
