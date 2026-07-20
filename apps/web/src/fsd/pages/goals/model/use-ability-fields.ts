import { useState } from "react"

import { abilityLevelsByRarity } from "./goal-validation"

// The next fixed level above the unit's current tracks — the dropdown's sensible starting
// selection, rather than defaulting to the very first (likely already-passed) fixed level.
function defaultTargetLevel(activeLevel: number, passiveLevel: number): number {
  const current = Math.max(activeLevel, passiveLevel)
  const next = abilityLevelsByRarity.find((entry) => entry.level > current)
  return (
    next?.level ??
    abilityLevelsByRarity[abilityLevelsByRarity.length - 1]!.level
  )
}

/**
 * The Ability goal's own target-range state — read-only active/passive current levels (always the
 * unit's live synced values — see `prefillFrom`) and a single fixed-level Target the goal aims both
 * tracks at (whichever track is already at or past it simply doesn't move — see `abilityActiveEnd`/
 * `abilityPassiveEnd` below). Split out of `use-create-goal-form.ts` purely for that file's own
 * max-lines budget.
 */
export function useAbilityFields() {
  const [abilityActiveStart, setAbilityActiveStart] = useState(0)
  const [abilityPassiveStart, setAbilityPassiveStart] = useState(0)
  const [abilityTargetLevel, setAbilityTargetLevel] = useState(0)

  // Never a regression below either track's own current level — a track already at or past the
  // selected Target simply has nothing left to farm for this goal.
  const abilityActiveEnd = Math.max(abilityActiveStart, abilityTargetLevel)
  const abilityPassiveEnd = Math.max(abilityPassiveStart, abilityTargetLevel)

  const reset = () => {
    setAbilityActiveStart(0)
    setAbilityPassiveStart(0)
    setAbilityTargetLevel(0)
  }

  // Applies the synced current-ability-level prefill once per entity selection — called from the
  // parent's single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render.
  const prefillFrom = (activeLevel: number, passiveLevel: number) => {
    setAbilityActiveStart(activeLevel)
    setAbilityPassiveStart(passiveLevel)
    setAbilityTargetLevel(defaultTargetLevel(activeLevel, passiveLevel))
  }

  return {
    state: {
      abilityActiveStart,
      abilityActiveEnd,
      abilityPassiveStart,
      abilityPassiveEnd,
      abilityTargetLevel,
      setAbilityTargetLevel,
    },
    reset,
    prefillFrom,
  }
}
