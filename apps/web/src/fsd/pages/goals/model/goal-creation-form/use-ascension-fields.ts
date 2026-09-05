import { useState } from "react"

import {
  firstProgression,
  progressionIndex,
  type Progression,
} from "@workspace/game-domain"

/**
 * The Ascension goal's own target-range state — a read-only start progression (always the unit's
 * live synced progression, never user-editable — see `prefillFrom`) and the target progression
 * step. Split out of `use-create-goal-form.ts` purely for that file's own max-lines budget. The
 * shard-source selection (Campaigns/Onslaught/Shops) lives in `useAcquisitionSourceSelection`
 * instead — it's shared with Unlock, not Ascension-specific.
 */
export function useAscensionFields() {
  const [progressionStart, setProgressionStart] =
    useState<Progression>(firstProgression)
  const [progressionEnd, setProgressionEnd] =
    useState<Progression>(firstProgression)

  const reset = () => {
    setProgressionStart(firstProgression)
    setProgressionEnd(firstProgression)
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
    },
    reset,
    prefillFrom,
  }
}
