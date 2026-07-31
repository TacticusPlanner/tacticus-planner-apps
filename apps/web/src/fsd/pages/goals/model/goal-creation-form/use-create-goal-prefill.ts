import { useEffect, useRef } from "react"
import type { Progression, UnitId } from "@workspace/game-domain"

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
  setLevelEnd,
  setProgressionEnd,
}: {
  open: boolean
  prefill?: CreateGoalPrefill
  entityId: UnitId | undefined
  playerEntity: unknown
  handleEntityChange: (entityId: UnitId) => void
  setEntityType: (entityType: EntityType) => void
  setEnabledTypes: (types: ReadonlySet<GoalKind>) => void
  selectProjects: (projectIds: string[]) => void
  setLevelEnd: (level: number) => void
  setProgressionEnd: (progression: Progression) => void
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
    handleEntityChange(prefill.entityId)
    setEntityType(prefill.entityType)
    setEnabledTypes(new Set([prefill.goalType]))
    selectProjects(prefill.projectIds)
    // Render-local coordinators intentionally run once per serialized prefill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillKey])

  useEffect(() => {
    if (
      !open ||
      !prefill ||
      !playerEntity ||
      entityId !== prefill.entityId ||
      targetKeyRef.current === prefillKey
    ) {
      return
    }
    targetKeyRef.current = prefillKey
    if (prefill.goalType === "Level") setLevelEnd(prefill.requiredLevel)
    else setProgressionEnd(prefill.requiredProgression)
    // Field setters are stable and the target applies once per prefill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillKey, playerEntity, entityId])
}
