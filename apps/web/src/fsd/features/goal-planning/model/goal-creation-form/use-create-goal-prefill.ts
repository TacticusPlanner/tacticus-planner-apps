import { useState } from "react"
import type {
  Progression,
  Rank,
  UnitId,
  UpgradeId,
} from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import type { EntityType } from "./use-create-goal-form"
import type { CreateGoalPrefill } from "./create-goal-launcher-context"

type PrefillParams = {
  open: boolean
  prefill?: CreateGoalPrefill
  entityId: UnitId | undefined
  playerEntity: unknown
  handleEntityChange: (entityId: UnitId) => void
  setEntityType: (entityType: EntityType) => void
  setEnabledTypes: (types: ReadonlySet<GoalKind>) => void
  selectProjects: (projectIds: string[]) => void
  /** The ascension and rank fields' setters for the prefilled target. */
  targetSetters: {
    setProgressionEnd: (progression: Progression) => void
    setRankEnd: (rank: Rank) => void
  }
  /** An Upgrade prefill's material, added with its own quantity, else how many the unit's remaining
   *  ladder still needs (undefined until the catalog has loaded, which holds the prefill back). */
  upgradeFields: {
    state: {
      addUpgradeTarget: (upgradeId: UpgradeId, quantity: number) => void
      remainingLadderQuantities: ReadonlyMap<UpgradeId, number> | undefined
    }
  }
}

/**
 * Applies a launch prefill (`CreateGoalPrefill`) to the open sheet once per serialized prefill: first
 * the unit, goal type and projects, then — once that unit is selected and synced — its target. Both
 * steps clear when the sheet closes, so the same launch applies again on the next open. They run
 * while rendering (React's "adjust state when a prop changes" pattern) rather than in an effect: the
 * setters are this form's own state, and the sheet never paints the unprefilled form.
 */
export function useCreateGoalPrefill(params: PrefillParams) {
  const prefillKey = params.prefill ? JSON.stringify(params.prefill) : ""
  const selectionPending = usePrefillSelection(params, prefillKey)
  usePrefillTarget(params, prefillKey, selectionPending)
}

/** The prefill's unit, goal type and projects; true while they are still being applied. */
function usePrefillSelection(
  {
    open,
    prefill,
    handleEntityChange,
    setEntityType,
    setEnabledTypes,
    selectProjects,
  }: PrefillParams,
  prefillKey: string
): boolean {
  const [appliedKey, setAppliedKey] = useState("")
  if (!open) {
    if (appliedKey !== "") setAppliedKey("")
    return false
  }
  if (!prefill || appliedKey === prefillKey) return false
  setAppliedKey(prefillKey)
  if ("entityId" in prefill) {
    handleEntityChange(prefill.entityId)
    setEntityType(prefill.entityType)
    // A unit-only prefill selects the unit and leaves every goal type unticked.
    setEnabledTypes(new Set("goalType" in prefill ? [prefill.goalType] : []))
  }
  // No `projectIds` means no project context: keep the sheet's own membership fallback.
  if (prefill.projectIds) selectProjects(prefill.projectIds)
  return true
}

/**
 * The prefill's target, once its unit is selected with synced data (the entity prefill fills the
 * fields from it first) and, for an Upgrade, the catalog's remaining ladder quantities have loaded.
 */
function usePrefillTarget(
  {
    open,
    prefill,
    entityId,
    playerEntity,
    targetSetters,
    upgradeFields,
  }: PrefillParams,
  prefillKey: string,
  selectionPending: boolean
) {
  const [appliedKey, setAppliedKey] = useState("")
  if (!open) {
    if (appliedKey !== "") setAppliedKey("")
    return
  }
  if (
    selectionPending ||
    !prefill ||
    appliedKey === prefillKey ||
    !("entityId" in prefill) ||
    playerEntity === undefined ||
    playerEntity === null ||
    entityId !== prefill.entityId
  ) {
    return
  }
  const { addUpgradeTarget, remainingLadderQuantities } = upgradeFields.state
  const isUpgrade = "goalType" in prefill && prefill.goalType === "Upgrade"
  if (isUpgrade && !remainingLadderQuantities) return
  setAppliedKey(prefillKey)
  if (!("goalType" in prefill)) return
  if (prefill.goalType === "Ascension")
    targetSetters.setProgressionEnd(prefill.requiredProgression)
  if (prefill.goalType === "Rank") targetSetters.setRankEnd(prefill.rankEnd)
  if (prefill.goalType === "Upgrade") {
    addUpgradeTarget(
      prefill.upgradeId,
      prefill.quantity ?? remainingLadderQuantities?.get(prefill.upgradeId) ?? 1
    )
  }
  // Unlock has no target field to prefill — selecting the entity/goal type (above) is enough.
}
