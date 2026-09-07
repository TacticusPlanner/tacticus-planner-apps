import { useState } from "react"

import { maxAbilityLevel } from "@workspace/game-domain"

// A track's sensible default target: the next level above its own current level, so the goal
// starts out proposing the smallest real advancement for that track (clamped to the ceiling for
// a track already at the maximum).
function defaultTargetLevel(currentLevel: number): number {
  return Math.min(currentLevel + 1, maxAbilityLevel)
}

/**
 * The Ability goal's per-track target state — read-only active/passive current levels (always the
 * unit's live synced values — see `prefillFrom`) and an independent Target level for each track.
 * A single Ability goal may raise one track or both; a track whose Target is at or below its own
 * current level simply doesn't move (see `abilityActiveEnd`/`abilityPassiveEnd` below). Split out
 * of `use-create-goal-form.ts` purely for that file's own max-lines budget.
 */
export function useAbilityFields() {
  const [abilityActiveStart, setAbilityActiveStart] = useState(0)
  const [abilityPassiveStart, setAbilityPassiveStart] = useState(0)
  const [abilityActiveTarget, setAbilityActiveTarget] = useState(0)
  const [abilityPassiveTarget, setAbilityPassiveTarget] = useState(0)

  // Never a regression below either track's own current level — a track whose selected Target is
  // at or below its current level has nothing left to farm for this goal.
  const abilityActiveEnd = Math.max(abilityActiveStart, abilityActiveTarget)
  const abilityPassiveEnd = Math.max(abilityPassiveStart, abilityPassiveTarget)

  const reset = () => {
    setAbilityActiveStart(0)
    setAbilityPassiveStart(0)
    setAbilityActiveTarget(0)
    setAbilityPassiveTarget(0)
  }

  // Applies the synced current-ability-level prefill once per entity selection — called from the
  // parent's single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render.
  // Each track's Target seeds from its own current level so neither is forced onto the other.
  const prefillFrom = (activeLevel: number, passiveLevel: number) => {
    setAbilityActiveStart(activeLevel)
    setAbilityPassiveStart(passiveLevel)
    setAbilityActiveTarget(defaultTargetLevel(activeLevel))
    setAbilityPassiveTarget(defaultTargetLevel(passiveLevel))
  }

  return {
    state: {
      abilityActiveStart,
      abilityActiveEnd,
      abilityActiveTarget,
      setAbilityActiveTarget,
      abilityPassiveStart,
      abilityPassiveEnd,
      abilityPassiveTarget,
      setAbilityPassiveTarget,
    },
    reset,
    prefillFrom,
  }
}
