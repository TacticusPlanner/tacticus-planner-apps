import { useEffect, useRef, useState } from "react"
import type { Progression, Rank, UnitId } from "@workspace/game-domain"
import type { GoalKind } from "@/entities/goal"
import {
  isAtMaxAbility,
  isAtMaxProgression,
  isAtMaxRank,
} from "@/features/goal-planning"

type FieldsWithPrefill<TArgs extends unknown[]> = {
  prefillFrom: (...args: TArgs) => void
}

/**
 * Applies the synced rank/progression/ability prefill once per entity selection, mirroring
 * character-lookup-page.tsx's ref-guard: never on a later background refresh, so it can't clobber
 * edits the user has since made to the target fields. Delegates the actual field-level update to
 * each sub-hook's own `prefillFrom`, so this effect only coordinates *when*, not *how*.
 *
 * Returns `resetPrefillGuard`, which the parent calls whenever it resets the target fields (an
 * explicit entity change, a launch prefill, a form reset). Clearing the guard also bumps a
 * request counter in the effect's dependencies, so the prefill runs again even when the unit and
 * its synced data are unchanged: re-picking the already-selected unit, or reopening the sheet for
 * it, resets the fields to their defaults (Stone I, no progression, ability 0) and must refill
 * them from the synced unit.
 */
export function useEntityPrefillEffect({
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
  const prefilledEntityIdRef = useRef<UnitId | undefined>(undefined)
  const [prefillRequest, setPrefillRequest] = useState(0)

  useEffect(() => {
    if (
      !entityId ||
      !playerEntity ||
      prefilledEntityIdRef.current === entityId
    ) {
      return
    }
    prefilledEntityIdRef.current = entityId

    // A MoW has no `rank` (plan §16 phase 6) — `rank` is `undefined` there, so these no-op via
    // their functional updaters instead of being wrapped in an `if`, which the set-state-in-effect
    // lint rule can't recognize as the safe "sync on selection change" idiom.
    rankFields.prefillFrom(rank)
    upgradeFields.prefillFrom(rank)
    ascensionFields.prefillFrom(playerEntity.progressionIndex)
    const activeLevel = playerEntity.abilities?.[0]?.level ?? 1
    const passiveLevel = playerEntity.abilities?.[1]?.level ?? 1
    abilityFields.prefillFrom(activeLevel, passiveLevel)

    // A toggle the user enabled (or a remembered goal type carried over from the previous creation)
    // before this synced data loaded may turn out to be unavailable once it arrives — an owned unit
    // cannot be unlocked, and maxed-out targets have nowhere to go. Strip it rather than leave a
    // checked-but-disabled toggle sitting in the form. Always called (a no-op functional updater when nothing's maxed) for the same lint-idiom
    // reason as the setState calls above — a conditionally-called setState inside an effect trips
    // the set-state-in-effect rule.
    const rankMaxed = isAtMaxRank(rank)
    const abilityMaxed = isAtMaxAbility(activeLevel, passiveLevel)
    const progressionMaxed = isAtMaxProgression(playerEntity.progressionIndex)
    setEnabledTypes((current) => {
      const next = new Set(current)
      // Reaching this effect means the unit is owned, so Unlock is never available.
      next.delete("Unlock")
      if (rankMaxed) {
        next.delete("Rank")
        next.delete("Upgrade")
      }
      if (abilityMaxed) next.delete("Ability")
      if (progressionMaxed) next.delete("Ascension")
      return next
    })
    // rankFields/ascensionFields/abilityFields/upgradeFields are freshly returned every render (not
    // stable references) — their own state setters are, so depending on entityId/playerEntity/rank
    // (plus the reset counter) is correct here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, playerEntity, rank, prefillRequest])

  return {
    resetPrefillGuard: () => {
      prefilledEntityIdRef.current = undefined
      setPrefillRequest((count) => count + 1)
    },
  }
}
