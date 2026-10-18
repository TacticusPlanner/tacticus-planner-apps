import {
  progressionIndex,
  progressionOrder,
  progressionRarity,
  rankIndex,
  type Progression,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

import type { LegendaryEventRosterUnit } from "../model/types"

/** One Active goal behind a preview, as the badge and the preview marker name it. */
export interface LegendaryEventGoalRef {
  goalId: string
  kind: "Unlock" | "Ascension" | "Rank" | "Ability"
  /** The goal's end target, absent for Unlock. */
  progressionEnd?: Progression
  rankEnd?: Rank
  appliedUpgradesEnd?: number
  activeEnd?: number
  passiveEnd?: number
}

/**
 * Every Active Unlock / Ascension / Rank / Ability goal of one character (spec: goal targets map onto
 * a previewed unit). A plain entity shape so this entity never imports `entities/goal`.
 */
export interface LegendaryEventGoalTarget {
  unitId: string
  goals: readonly LegendaryEventGoalRef[]
}

/** The first progression step of a rarity (`Common:None`, `Rare:FourStars`, …). */
function baseProgression(rarity: Rarity | undefined): Progression {
  return (
    progressionOrder.find((step) => progressionRarity(step) === rarity) ??
    progressionOrder[0]
  )
}

/** A freshly unlocked unit: its initial rarity's first step, Stone1, no upgrades, abilities 1/1. */
export function unlockedBaseUnit(
  unitId: string,
  initialRarity: Rarity | undefined
): LegendaryEventRosterUnit {
  return {
    unitId: unitId as LegendaryEventRosterUnit["unitId"],
    rank: "Stone1",
    progressionIndex: baseProgression(initialRarity),
    appliedUpgradeSlots: [],
  }
}

function withAbilityLevels(
  unit: LegendaryEventRosterUnit,
  active: number,
  passive: number
): LegendaryEventRosterUnit["abilities"] {
  const current = unit.abilities ?? []
  const levels = [active, passive]
  const next = levels.map((level, index) => ({
    ...current[index],
    abilityId:
      current[index]?.abilityId ?? (index === 0 ? "active" : "passive"),
    level,
  }))
  return [...next, ...current.slice(2)] as LegendaryEventRosterUnit["abilities"]
}

/** One unit at its goal targets; never lowers a value (design D3). */
export function previewUnit(
  rosterUnit: LegendaryEventRosterUnit | undefined,
  target: LegendaryEventGoalTarget,
  initialRarity: Rarity | undefined
): LegendaryEventRosterUnit {
  let unit = rosterUnit ?? unlockedBaseUnit(target.unitId, initialRarity)

  for (const goal of target.goals) {
    if (
      goal.kind === "Ascension" &&
      goal.progressionEnd &&
      progressionIndex(goal.progressionEnd) >
        progressionIndex(unit.progressionIndex)
    ) {
      unit = { ...unit, progressionIndex: goal.progressionEnd }
    }
  }

  for (const goal of target.goals) {
    if (goal.kind !== "Rank" || !goal.rankEnd) continue
    const end = rankIndex(goal.rankEnd)
    const current = rankIndex(unit.rank)
    const endApplied = goal.appliedUpgradesEnd ?? 0
    const currentApplied = new Set(unit.appliedUpgradeSlots ?? []).size
    if (end > current) {
      unit = {
        ...unit,
        rank: goal.rankEnd,
        appliedUpgradeSlots: slots(endApplied),
      }
    } else if (end === current && endApplied > currentApplied) {
      unit = {
        ...unit,
        appliedUpgradeSlots: fillSlots(unit.appliedUpgradeSlots, endApplied),
      }
    }
  }

  let active = unit.abilities?.[0]?.level ?? 1
  let passive = unit.abilities?.[1]?.level ?? 1
  let abilitiesChanged = false
  for (const goal of target.goals) {
    if (goal.kind !== "Ability") continue
    if ((goal.activeEnd ?? 0) > active) {
      active = goal.activeEnd ?? active
      abilitiesChanged = true
    }
    if ((goal.passiveEnd ?? 0) > passive) {
      passive = goal.passiveEnd ?? passive
      abilitiesChanged = true
    }
  }
  if (abilitiesChanged) {
    unit = { ...unit, abilities: withAbilityLevels(unit, active, passive) }
  }
  return unit
}

function slots(count: number): number[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => index)
}

/** Keeps the applied slots (each adds its own stat increase) and fills the lowest missing indices up
 *  to `count`. */
function fillSlots(
  applied: readonly number[] | undefined,
  count: number
): number[] {
  const filled = new Set(applied ?? [])
  for (let index = 0; filled.size < count; index++) filled.add(index)
  return [...filled].toSorted((a, b) => a - b)
}

export interface PreviewRoster {
  /** The roster with every targeted unit at its preview state. */
  roster: LegendaryEventRosterUnit[]
  /** Units whose preview differs from their synced state. */
  previewed: ReadonlySet<string>
}

/** The roster as if every Active goal target were reached (spec: goal targets map onto a previewed
 *  unit). `roster` undefined (not synced) stays undefined: ownership is unknown. */
export function previewRoster(
  roster: readonly LegendaryEventRosterUnit[] | undefined,
  targets: readonly LegendaryEventGoalTarget[],
  initialRarityOf: (unitId: string) => Rarity | undefined
): PreviewRoster | undefined {
  if (!roster) return undefined
  const byId = new Map(roster.map((unit) => [unit.unitId as string, unit]))
  const previewed = new Set<string>()
  for (const target of targets) {
    if (target.goals.length === 0) continue
    const current = byId.get(target.unitId)
    const next = previewUnit(current, target, initialRarityOf(target.unitId))
    if (!current || !sameState(current, next)) {
      byId.set(target.unitId, next)
      previewed.add(target.unitId)
    }
  }
  return { roster: [...byId.values()], previewed }
}

function sameState(a: LegendaryEventRosterUnit, b: LegendaryEventRosterUnit) {
  return (
    a.rank === b.rank &&
    a.progressionIndex === b.progressionIndex &&
    new Set(a.appliedUpgradeSlots ?? []).size ===
      new Set(b.appliedUpgradeSlots ?? []).size &&
    (a.abilities?.[0]?.level ?? 1) === (b.abilities?.[0]?.level ?? 1) &&
    (a.abilities?.[1]?.level ?? 1) === (b.abilities?.[1]?.level ?? 1)
  )
}
