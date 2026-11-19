import { useState } from "react"
import type { Progression, Rank, UnitId } from "@workspace/game-domain"
import type { GoalKind } from "@/entities/goal"
import {
  isAtMaxAbility,
  isAtMaxProgression,
  isAtMaxRank,
} from "../shared/goal-validation"

type FieldsWithPrefill<TArgs extends unknown[]> = {
  prefillFrom: (...args: TArgs) => void
}

/**
 * Applies the synced rank/progression/ability prefill once per entity selection: never on a later
 * background refresh, so it can't clobber edits the user has since made to the target fields.
 * Delegates the actual field-level update to each sub-hook's own `prefillFrom`, so this hook only
 * coordinates *when*, not *how*.
 *
 * Returns `resetPrefillGuard`, which the parent calls whenever it resets the target fields (an
 * explicit entity change, a launch prefill, a form reset). It bumps a request counter, so the
 * prefill runs again even when the unit and
 * its synced data are unchanged: re-picking the already-selected unit, or reopening the sheet for
 * it, resets the fields to their defaults (Stone I, no progression, ability 0) and must refill
 * them from the synced unit.
 */
export function useEntityPrefill({
  entityId,
  playerEntity,
  rank,
  rankFields,
  upgradeFields,
  ascensionFields,
  abilityFields,
  setEnabledTypes,
}: {
  entityId: UnitId | undefined
  playerEntity:
    | { progressionIndex: Progression; abilities?: { level: number }[] }
    | undefined
  rank: Rank | undefined
  rankFields: FieldsWithPrefill<[Rank | undefined]>
  upgradeFields: FieldsWithPrefill<[Rank | undefined]>
  ascensionFields: FieldsWithPrefill<[Progression]>
  abilityFields: FieldsWithPrefill<[number, number]>
  setEnabledTypes: (
    updater: (current: ReadonlySet<GoalKind>) => ReadonlySet<GoalKind>
  ) => void
}) {
  // Which unit (and which reset request) the target fields were last filled for.
  const [prefilledFor, setPrefilledFor] = useState<{
    entityId: UnitId
    request: number
  } | null>(null)
  const [prefillRequest, setPrefillRequest] = useState(0)

  // Applied while rendering (React's "adjust state when a prop changes" pattern), not in an effect:
  // every setter is this form's own state, so the fields never paint unfilled for a synced unit.
  if (
    entityId &&
    playerEntity &&
    (prefilledFor?.entityId !== entityId ||
      prefilledFor.request !== prefillRequest)
  ) {
    setPrefilledFor({ entityId, request: prefillRequest })

    // A MoW has no `rank` (plan §16 phase 6): `rank` is `undefined` there, and these no-op.
    rankFields.prefillFrom(rank)
    upgradeFields.prefillFrom(rank)
    ascensionFields.prefillFrom(playerEntity.progressionIndex)
    const activeLevel = playerEntity.abilities?.[0]?.level ?? 1
    const passiveLevel = playerEntity.abilities?.[1]?.level ?? 1
    abilityFields.prefillFrom(activeLevel, passiveLevel)

    // A toggle the user enabled (or a remembered goal type carried over from the previous creation)
    // before this synced data loaded may turn out to be unavailable once it arrives — an owned unit
    // cannot be unlocked, and maxed-out targets have nowhere to go. Strip it rather than leave a
    // checked-but-disabled toggle sitting in the form.
    const rankMaxed = isAtMaxRank(rank)
    const abilityMaxed = isAtMaxAbility(activeLevel, passiveLevel)
    const progressionMaxed = isAtMaxProgression(playerEntity.progressionIndex)
    setEnabledTypes((current) => {
      const next = new Set(current)
      // Reaching this point means the unit is owned, so Unlock is never available.
      next.delete("Unlock")
      if (rankMaxed) {
        next.delete("Rank")
        next.delete("Upgrade")
      }
      if (abilityMaxed) next.delete("Ability")
      if (progressionMaxed) next.delete("Ascension")
      return next
    })
  }

  return {
    resetPrefillGuard: () => setPrefillRequest((count) => count + 1),
  }
}
