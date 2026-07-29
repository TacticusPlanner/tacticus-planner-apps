import { useState } from "react"

import {
  firstProgression,
  progressionIndex,
  type Progression,
} from "@workspace/game-domain"

import type { AscensionFarmingSource } from "@/entities/goal"

/**
 * The Ascension goal's own target-range state — a read-only start progression (always the unit's
 * live synced progression, never user-editable — see `prefillFrom`), the target progression step,
 * and the shard-farming source toggle. Split out of `use-create-goal-form.ts` purely for that
 * file's own max-lines budget.
 */
export function useAscensionFields() {
  const [progressionStart, setProgressionStart] =
    useState<Progression>(firstProgression)
  const [progressionEnd, setProgressionEnd] =
    useState<Progression>(firstProgression)
  const [ascensionFarmingSource, setAscensionFarmingSource] =
    useState<AscensionFarmingSource>("Campaign")

  const reset = () => {
    setProgressionStart(firstProgression)
    setProgressionEnd(firstProgression)
    setAscensionFarmingSource("Campaign")
  }

  // Applies the synced current-progression prefill once per entity selection — called from the
  // parent's single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render.
  // `progressionStart` is never otherwise settable — the "From" field always reflects this synced
  // value.
  const prefillFrom = (progression: Progression) => {
    setProgressionStart(progression)
    setProgressionEnd((current) =>
      progressionIndex(current) > progressionIndex(progression)
        ? current
        : progression
    )
  }

  return {
    state: {
      progressionStart,
      progressionEnd,
      setProgressionEnd,
      ascensionFarmingSource,
      setAscensionFarmingSource,
    },
    reset,
    prefillFrom,
  }
}
