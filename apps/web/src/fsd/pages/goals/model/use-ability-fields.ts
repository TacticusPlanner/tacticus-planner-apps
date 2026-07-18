import { useState } from "react"

/**
 * The Ability goal's own target-range state — active/passive start+end levels and which track
 * ("first"/"second", i.e. active/primary vs passive/secondary) the review/submit logic should
 * treat as the one actually changing. Split out of `use-create-goal-form.ts` purely for that
 * file's own max-lines budget.
 */
export function useAbilityFields() {
  const [abilityActiveStart, setAbilityActiveStart] = useState(0)
  const [abilityActiveEnd, setAbilityActiveEnd] = useState(0)
  const [abilityPassiveStart, setAbilityPassiveStart] = useState(0)
  const [abilityPassiveEnd, setAbilityPassiveEnd] = useState(0)
  const [abilityTrack, setAbilityTrack] = useState<"first" | "second">("first")

  const reset = () => {
    setAbilityActiveStart(0)
    setAbilityActiveEnd(0)
    setAbilityPassiveStart(0)
    setAbilityPassiveEnd(0)
    setAbilityTrack("first")
  }

  // Applies the synced current-ability-level prefill once per entity selection — called from the
  // parent's single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render.
  const prefillFrom = (activeLevel: number, passiveLevel: number) => {
    setAbilityActiveStart(activeLevel)
    setAbilityActiveEnd(activeLevel + 1)
    setAbilityPassiveStart(passiveLevel)
    setAbilityPassiveEnd(passiveLevel + 1)
  }

  return {
    state: {
      abilityActiveStart,
      setAbilityActiveStart,
      abilityActiveEnd,
      setAbilityActiveEnd,
      abilityPassiveStart,
      setAbilityPassiveStart,
      abilityPassiveEnd,
      setAbilityPassiveEnd,
      abilityTrack,
      setAbilityTrack,
    },
    reset,
    prefillFrom,
  }
}
