import { useMemo, useState } from "react"

import {
  firstProgression,
  progressionIndex,
  progressionOrder,
  type Progression,
} from "@workspace/game-domain"

import type { AscensionFarmingSource } from "@/entities/goal"

/**
 * The Ascension goal's own target-range state — start/end progression step, the shard-farming
 * source toggle, and the start-option list (bounded below by the unit's actual current
 * progression). Split out of `use-create-goal-form.ts` purely for that file's own max-lines
 * budget. `currentProgression` is the unit's live synced progression (`playerEntity?.
 * progressionIndex`) — undefined for an unowned/locked unit.
 */
export function useAscensionFields(
  currentProgression: Progression | undefined
) {
  const [progressionStart, setProgressionStart] =
    useState<Progression>(firstProgression)
  const [progressionEnd, setProgressionEnd] =
    useState<Progression>(firstProgression)
  const [ascensionFarmingSource, setAscensionFarmingSource] =
    useState<AscensionFarmingSource>("Campaign")

  const progressionStartOptions = useMemo(
    () =>
      progressionOrder.filter(
        (progression) =>
          progressionIndex(progression) >=
          progressionIndex(currentProgression ?? progressionStart)
      ),
    [currentProgression, progressionStart]
  )

  const reset = () => {
    setProgressionStart(firstProgression)
    setProgressionEnd(firstProgression)
    setAscensionFarmingSource("Campaign")
  }

  // Applies the synced current-progression prefill once per entity selection — called from the
  // parent's single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render.
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
      setProgressionStart,
      progressionEnd,
      setProgressionEnd,
      progressionStartOptions,
      ascensionFarmingSource,
      setAscensionFarmingSource,
    },
    reset,
    prefillFrom,
  }
}
