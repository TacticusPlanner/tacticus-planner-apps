import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import { useMutation } from "@tanstack/react-query"
import { getEquipmentMap } from "@workspace/game-catalog/queries"

import { createGoal } from "@/entities/goal"
import { ApiError } from "@/shared/api"

/**
 * State/handlers for the Equipment (UpgradeEquipment) side of the goal-creation sheet — a new goal
 * kind with no V1 precedent, targeting the `GoalEntityType.Equipment` entity type (an equipment/
 * relic catalog id, not a Character/Mow). Its own hook — mirrors the Unit-flow's
 * `useCreateGoalForm` — because a fundamentally different entity type doesn't fit that hook's
 * Character/Mow-shaped state; `CreateGoalSheet` runs both hooks and switches which one's fields it
 * renders based on the active top-level pill.
 */
export function useCreateEquipmentGoalForm({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const { t } = useTranslation()

  const equipmentById = useLiveQuery(
    () => (open ? getEquipmentMap() : undefined),
    [open]
  )

  const [equipmentId, setEquipmentId] = useState<string | undefined>(undefined)
  const [targetLevel, setTargetLevel] = useState(2)
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedEquipment = equipmentId
    ? equipmentById?.get(equipmentId)
    : undefined
  const maxLevel = selectedEquipment?.levels.length ?? 1

  const handleEquipmentChange = (id: string) => {
    setEquipmentId(id)
    setTargetLevel(2)
  }

  const createEquipmentGoal = useMutation({ mutationFn: createGoal })

  const canSubmit = !!equipmentId && targetLevel > 1 && targetLevel <= maxLevel

  const resetForm = () => {
    setEquipmentId(undefined)
    setTargetLevel(2)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!equipmentId || !canSubmit) return

    setStatus("submitting")
    setErrorMessage(null)

    try {
      await createEquipmentGoal.mutateAsync({
        entityType: "Equipment",
        entityId: equipmentId,
        goalType: "UpgradeEquipment",
        config: { equipment: { targetLevel } },
      })
      resetForm()
      setStatus("idle")
      onOpenChange(false)
      onCreated()
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : t("goals.create.genericError")
      )
    }
  }

  return {
    equipmentById,
    equipmentId,
    handleEquipmentChange,
    targetLevel,
    setTargetLevel,
    maxLevel,
    status,
    errorMessage,
    canSubmit,
    handleSubmit,
  }
}
