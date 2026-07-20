import { useMemo, useState } from "react"

import { MAX_CHARACTER_LEVEL } from "./goal-validation"

/**
 * The Level goal's own target-range state — a read-only current level (always the unit's live
 * synced `xpLevel`, set only via `prefillFrom` — never user-editable) and the target level.
 * Uncosted (no estimate-engine involvement), unlike Rank/Ascension. Split out of
 * `use-create-goal-form.ts` purely for that file's own max-lines budget.
 */
export function useLevelFields() {
  const [levelStart, setLevelStart] = useState(1)
  const [levelEnd, setLevelEnd] = useState(2)

  const levelEndOptions = useMemo(() => {
    const options: number[] = []
    for (let level = levelStart + 1; level <= MAX_CHARACTER_LEVEL; level++) {
      options.push(level)
    }
    return options.length > 0 ? options : [levelStart]
  }, [levelStart])

  const reset = () => {
    setLevelStart(1)
    setLevelEnd(2)
  }

  // Applies the synced current-level prefill once per entity selection — called from the parent's
  // single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render. Uses
  // functional no-op updaters when `xpLevel` is undefined (e.g. a MoW, which doesn't offer a Level
  // goal) so the caller can call this unconditionally, matching that effect's own
  // set-state-in-effect lint idiom. `levelStart` is never otherwise settable — the "Current" field
  // always reflects this synced value.
  const prefillFrom = (xpLevel: number | undefined) => {
    setLevelStart((current) => xpLevel ?? current)
    setLevelEnd((current) => {
      if (xpLevel === undefined) return current
      return current > xpLevel
        ? current
        : Math.min(xpLevel + 1, MAX_CHARACTER_LEVEL)
    })
  }

  return {
    state: {
      levelStart,
      levelEnd,
      setLevelEnd,
      levelEndOptions,
    },
    reset,
    prefillFrom,
  }
}
