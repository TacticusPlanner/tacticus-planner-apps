import { useEffect, useRef } from "react"

import type { UnitId, Rank, Progression } from "@workspace/game-domain"
import type { GoalKind } from "@/entities/goal"

import { isAtMaxAbility, isAtMaxRank } from "./goal-validation"

type FieldsWithPrefill<TArgs extends unknown[]> = {
  prefillFrom: (...args: TArgs) => void
}

/**
 * Applies the synced rank/progression/ability prefill once per entity selection, mirroring
 * character-lookup-page.tsx's ref-guard: never on a later background refresh, so it can't clobber
 * edits the user has since made to the target fields. Delegates the actual field-level update to
 * each sub-hook's own `prefillFrom`, so this effect only coordinates *when*, not *how*. Split out
 * of `use-create-goal-form.ts` purely for that file's own max-lines budget — returns the guard ref
 * itself so the parent can also clear it on an explicit entity change / form reset.
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

    // The default toggle set (defaultTypesFor, applied synchronously on selection before this
    // synced data was available) may turn out to already be maxed out once it loads — strip it
    // rather than leave a checked-but-disabled toggle sitting in the form. Always called (a no-op
    // functional updater when nothing's maxed) for the same lint-idiom reason as the setState calls
    // above — a conditionally-called setState inside an effect trips the set-state-in-effect rule.
    const rankMaxed = isAtMaxRank(rank)
    const abilityMaxed = isAtMaxAbility(
      playerEntity.progressionIndex,
      activeLevel,
      passiveLevel
    )
    setEnabledTypes((current) => {
      if (!rankMaxed && !abilityMaxed) return current
      const next = new Set(current)
      if (rankMaxed) next.delete("Rank")
      if (abilityMaxed) next.delete("Ability")
      return next
    })
    // rankFields/ascensionFields/abilityFields/upgradeFields are freshly returned every render (not
    // stable references) — their own state setters are, so depending on entityId/playerEntity/rank
    // alone (as before this hook was split) is correct here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, playerEntity, rank])

  return {
    resetPrefillGuard: () => {
      prefilledEntityIdRef.current = undefined
    },
  }
}
