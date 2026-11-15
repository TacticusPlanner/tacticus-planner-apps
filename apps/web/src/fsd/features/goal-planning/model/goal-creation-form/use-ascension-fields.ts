import { useMemo, useState } from "react"
import {
  firstProgression,
  progressionIndex,
  type Progression,
} from "@workspace/game-domain"

import { progressionEndOptionsFor } from "../target-edit/goal-target-edit"
import { firstFreeTarget } from "./first-free-target"

const NO_TAKEN_TARGETS: ReadonlySet<string> = new Set()

/**
 * The Ascension goal's own target-range state — a read-only start progression (the unit's live
 * synced progression, or an unowned unit's starting rarity until one arrives; never user-editable —
 * see `prefillFrom`) and the target progression
 * step. Until the user picks a target above the start it follows `firstFreeTarget` — the next step,
 * skipping in-flight targets in `taken` — so it never defaults to the current progression. The
 * shard-source selection (Campaigns/Onslaught/Shops) lives in `useAcquisitionSourceSelection`
 * instead — it's shared with Unlock, not Ascension-specific.
 */
export function useAscensionFields(
  taken: ReadonlySet<string> = NO_TAKEN_TARGETS,
  /** Where an unowned unit starts once unlocked (its starting rarity's first step), when known. */
  unownedStart?: Progression
) {
  const [syncedStart, setSyncedStart] = useState<Progression | null>(null)
  const [picked, setPicked] = useState<Progression | null>(null)
  const progressionStart = syncedStart ?? unownedStart ?? firstProgression

  const progressionEnd =
    picked && progressionIndex(picked) > progressionIndex(progressionStart)
      ? picked
      : firstFreeTarget("Ascension", progressionStart, taken)
  const progressionEndOptions = useMemo(
    () => progressionEndOptionsFor(progressionStart),
    [progressionStart]
  )

  const reset = () => {
    setSyncedStart(null)
    setPicked(null)
  }

  // Applies the synced current-progression prefill once per entity selection — called from the
  // parent's single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render.
  // `progressionStart` is never otherwise settable — the "From" field always reflects this synced
  // value. A target picked (or prefilled) before it arrived stays while it is above the start.
  const prefillFrom = (progression: Progression) => {
    setSyncedStart(progression)
  }

  return {
    state: {
      progressionStart,
      progressionEnd,
      progressionEndOptions,
      setProgressionEnd: (value: Progression) => setPicked(value),
    },
    reset,
    prefillFrom,
  }
}
