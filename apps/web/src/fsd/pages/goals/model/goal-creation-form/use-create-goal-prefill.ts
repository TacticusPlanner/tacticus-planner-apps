import { useEffect, useRef } from "react"
import type { Progression, Rank, UnitId } from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import type { EntityType } from ".//use-create-goal-form"
import type { CreateGoalPrefill } from ".//create-goal-launcher-context"

export function useCreateGoalPrefill({
  open,
  prefill,
  entityId,
  playerEntity,
  handleEntityChange,
  setEntityType,
  setEnabledTypes,
  selectProjects,
  targetSetters,
}: {
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
}) {
  const selectionKeyRef = useRef("")
  const targetKeyRef = useRef("")
  const prefillKey = prefill ? JSON.stringify(prefill) : ""

  useEffect(() => {
    if (!open) {
      selectionKeyRef.current = ""
      targetKeyRef.current = ""
      return
    }
    if (!prefill || selectionKeyRef.current === prefillKey) return
    selectionKeyRef.current = prefillKey
    if ("entityId" in prefill) {
      handleEntityChange(prefill.entityId)
      setEntityType(prefill.entityType)
      // A unit-only prefill selects the unit and leaves every goal type unticked.
      setEnabledTypes(new Set("goalType" in prefill ? [prefill.goalType] : []))
    }
    // No `projectIds` means no project context: keep the sheet's own membership fallback.
    if (prefill.projectIds) selectProjects(prefill.projectIds)
    // Render-local coordinators intentionally run once per serialized prefill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillKey])

  useEffect(() => {
    if (
      !open ||
      !prefill ||
      !("entityId" in prefill) ||
      !playerEntity ||
      entityId !== prefill.entityId ||
      targetKeyRef.current === prefillKey
    ) {
      return
    }
    targetKeyRef.current = prefillKey
    if (!("goalType" in prefill)) return
    if (prefill.goalType === "Ascension")
      targetSetters.setProgressionEnd(prefill.requiredProgression)
    if (prefill.goalType === "Rank") targetSetters.setRankEnd(prefill.rankEnd)
    // Unlock has no target field to prefill — selecting the entity/goal type (above) is enough.
    // Field setters are stable and the target applies once per prefill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillKey, playerEntity, entityId])
}
