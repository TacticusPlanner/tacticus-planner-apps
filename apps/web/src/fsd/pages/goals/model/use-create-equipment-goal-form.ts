import { useMemo, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import { useMutation } from "@tanstack/react-query"
import { getEquipmentMap } from "@workspace/game-catalog/queries"
import { getPlayerInventoryItems } from "@workspace/player-data/queries"

import { createGoal } from "@/entities/goal"
import { ApiError } from "@/shared/api"

export type OwnedEquipmentLevel = { level: number; count: number }

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

  // Owned-count-by-level for the selected equipment's info card — grouped client-side from the
  // caller's whole un-equipped inventory (small: equipment stock, not per-character upgrade
  // materials), mirroring the Unit tab's own shard-count summary.
  const inventoryItems = useLiveQuery(() => getPlayerInventoryItems(), [])
  const ownedByLevel = useMemo<OwnedEquipmentLevel[]>(() => {
    if (!equipmentId || !inventoryItems) return []
    const totals = new Map<number, number>()
    for (const item of inventoryItems) {
      if (item.itemId !== equipmentId) continue
      totals.set(item.level, (totals.get(item.level) ?? 0) + item.amount)
    }
    return [...totals.entries()]
      .sort(([a], [b]) => a - b)
      .map(([level, count]) => ({ level, count }))
  }, [inventoryItems, equipmentId])

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
    ownedByLevel,
    status,
    errorMessage,
    canSubmit,
    handleSubmit,
  }
}
