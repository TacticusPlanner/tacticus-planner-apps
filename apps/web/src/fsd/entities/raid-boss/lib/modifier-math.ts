import type { RaidBossEncounterModifier } from "../model/types"

// Ported from V1 `4-entities/guild_boss/guild-boss-modifiers.ts` — the pure adjustment math, minus
// V1's icon/portrait resolution. In V2 each encounter modifier already carries its definition inline
// (`{ hpLost, modifierId, type, target, subtarget?, amount }`), so there is no separate lookup table.

/** `subtarget` is a comma-separated list of the ability variables / unit ids a modifier acts on. */
export function parseSubtargets(modifier: RaidBossEncounterModifier): string[] {
  return modifier.subtarget ? modifier.subtarget.split(",") : []
}

/** Ascending by `hpLost` — the order modifiers activate in as the unit loses HP. */
export function sortModifiersByHpLost(
  modifiers: RaidBossEncounterModifier[]
): RaidBossEncounterModifier[] {
  return [...modifiers].sort((a, b) => a.hpLost - b.hpLost)
}

/**
 * Rescales an encounter's authored `hpLost` thresholds to the currently displayed total HP. Every
 * encounter's raw `hpLost` values are an exact `i/N` fraction of the HP baseline they were authored
 * against (`N = modifiers.length`); the displayed total HP varies with the selected progression step,
 * so rescale to keep the schedule proportional, with the last entry landing exactly at `currentTotalHp`.
 */
export function scaleModifierHpLost(
  modifiers: RaidBossEncounterModifier[],
  currentTotalHp: number
): RaidBossEncounterModifier[] {
  const n = modifiers.length
  return modifiers.map((modifier, index) => {
    const position = index + 1
    const hpLost =
      position === n
        ? currentTotalHp
        : Math.round((currentTotalHp * position) / n)
    return { ...modifier, hpLost }
  })
}

/** The HP-lost selector's option list: 0 (full HP) plus every threshold in the sorted list. */
export function buildModifierHpLostOptions(
  sortedModifiers: RaidBossEncounterModifier[]
): number[] {
  return [0, ...sortedModifiers.map((m) => m.hpLost)]
}

/** The modifiers active at or below the given HP-loss threshold. */
export function getActiveModifiers(
  modifiers: RaidBossEncounterModifier[],
  selectedHpLost: number
): RaidBossEncounterModifier[] {
  return modifiers.filter((m) => m.hpLost <= selectedHpLost)
}

export interface StatAdjustments {
  /** Signed percentage points per stat target, e.g. `{ dmg: -45 }`. */
  pctByStat: Record<string, number>
  /** Signed flat delta per stat target, e.g. `{ movement: -1 }`. */
  flatByStat: Record<string, number>
}

/** Sums `bossStatDecrease` / `bossStatPctDecrease` modifiers additively per stat target. */
export function computeStatAdjustments(
  active: RaidBossEncounterModifier[]
): StatAdjustments {
  const pctByStat: Record<string, number> = {}
  const flatByStat: Record<string, number> = {}
  for (const modifier of active) {
    if (modifier.type === "bossStatPctDecrease") {
      pctByStat[modifier.target] =
        (pctByStat[modifier.target] ?? 0) - modifier.amount
    } else if (modifier.type === "bossStatDecrease") {
      flatByStat[modifier.target] =
        (flatByStat[modifier.target] ?? 0) - modifier.amount
    }
  }
  return { pctByStat, flatByStat }
}

/** Applies the cumulative adjustment for `statKey` to `base`, clamped at 0. */
export function applyStatAdjustment(
  base: number,
  statKey: string,
  adjustments: StatAdjustments
): number {
  const pct = adjustments.pctByStat[statKey] ?? 0
  const flat = adjustments.flatByStat[statKey] ?? 0
  return Math.max(0, Math.round(base * (1 + pct / 100) + flat))
}

export interface AbilityAdjustments {
  /** Percentage points applying to every variable of the ability (`bossAbilityAllStatsPctDecrease`). */
  pctAll: number
  pctByVariable: Record<string, number>
  flatByVariable: Record<string, number>
}

/** Sums the modifiers targeting a specific ability's variables, additively. */
export function computeAbilityAdjustments(
  active: RaidBossEncounterModifier[],
  abilityId: string
): AbilityAdjustments {
  const result: AbilityAdjustments = {
    pctAll: 0,
    pctByVariable: {},
    flatByVariable: {},
  }
  for (const modifier of active.filter((m) => m.target === abilityId)) {
    const subs = parseSubtargets(modifier)
    const sign = modifier.type.includes("Increase") ? 1 : -1
    if (modifier.type === "bossAbilityAllStatsPctDecrease") {
      result.pctAll -= modifier.amount
    } else if (modifier.type.includes("Pct")) {
      for (const s of subs) {
        result.pctByVariable[s] =
          (result.pctByVariable[s] ?? 0) + sign * modifier.amount
      }
    } else {
      for (const s of subs) {
        result.flatByVariable[s] =
          (result.flatByVariable[s] ?? 0) + sign * modifier.amount
      }
    }
  }
  return result
}

function adjustValue(
  raw: string | number,
  pct: number,
  flat: number
): string | number {
  if (pct === 0 && flat === 0) return raw
  const n = Number(raw)
  return Number.isNaN(n)
    ? raw
    : Math.max(0, Math.round(n * (1 + pct / 100) + flat))
}

/** Applies ability-variable adjustments to every entry of each affected per-level array, clamped at 0. */
export function applyAbilityVariableAdjustments(
  variables: Record<string, (string | number)[]>,
  adjustments: AbilityAdjustments
): Record<string, (string | number)[]> {
  const out: Record<string, (string | number)[]> = {}
  for (const [key, values] of Object.entries(variables)) {
    const pct = adjustments.pctAll + (adjustments.pctByVariable[key] ?? 0)
    const flat = adjustments.flatByVariable[key] ?? 0
    out[key] =
      pct === 0 && flat === 0
        ? values
        : values.map((v) => adjustValue(v, pct, flat))
  }
  return out
}

/** Same adjustment math for ability constants (single scalar values, not per-level arrays). */
export function applyAbilityConstantAdjustments(
  constants: Record<string, string>,
  adjustments: AbilityAdjustments
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(constants)) {
    const pct = adjustments.pctAll + (adjustments.pctByVariable[key] ?? 0)
    const flat = adjustments.flatByVariable[key] ?? 0
    out[key] = String(adjustValue(value, pct, flat))
  }
  return out
}

/** Sums `unitAmountDecrease` modifiers into a removal count per targeted unit-set id. */
export function computeUnitRemovals(
  active: RaidBossEncounterModifier[]
): Record<string, number> {
  const removals: Record<string, number> = {}
  for (const modifier of active) {
    if (modifier.type !== "unitAmountDecrease") continue
    const unitSetId = parseSubtargets(modifier)[0]
    if (!unitSetId) continue
    removals[unitSetId] = (removals[unitSetId] ?? 0) + modifier.amount
  }
  return removals
}

/** Removes up to `removals[id]` copies of each matching field npc (progression suffix ignored). */
export function applyUnitRemovals(
  enemyIds: string[],
  removals: Record<string, number>
): { ids: string[]; removed: { unitSetId: string; count: number }[] } {
  const remaining = { ...removals }
  const removedCounts: Record<string, number> = {}
  const ids = enemyIds.filter((rawId) => {
    const unitSetId = rawId.replace(/:\d+$/, "")
    if ((remaining[unitSetId] ?? 0) > 0) {
      remaining[unitSetId] -= 1
      removedCounts[unitSetId] = (removedCounts[unitSetId] ?? 0) + 1
      return false
    }
    return true
  })
  const removed = Object.entries(removedCounts).map(([unitSetId, count]) => ({
    unitSetId,
    count,
  }))
  return { ids, removed }
}
