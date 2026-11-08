import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"

import { useCreateGoalLauncher } from "@/entities/goal"
import { useAnalyticsActions } from "@/shared/analytics"

import { unitCreateGoalPrefill, type UnitEntityType } from "./unit-create-goal"
import type { UnitOwnership } from "./unit-ownership"

/**
 * The unit header's Create goal: opens the app's goal-creation sheet with this unit prefilled.
 * Signed-in only (the sheet exists only for a signed-in player); disabled while the player's data
 * is read, so a locked unit doesn't open without its Unlock prefill.
 */
export function UnitCreateGoalButton({
  entityType,
  unitId,
  name,
  ownership,
  isMobile,
}: {
  entityType: UnitEntityType
  unitId: UnitId
  name: string
  ownership: UnitOwnership
  isMobile: boolean
}) {
  const { t } = useTranslation("library")
  const launchCreateGoal = useCreateGoalLauncher()
  const { captureEvent } = useAnalyticsActions()

  return (
    <Button
      variant="outline"
      size="sm"
      className={isMobile ? "h-[38px]" : undefined}
      disabled={ownership === "loading"}
      aria-label={t("unit.createGoalFor", { name })}
      data-testid="unit-create-goal"
      onClick={() => {
        const prefill = unitCreateGoalPrefill(entityType, unitId, ownership)
        captureEvent({
          type: "library_unit_create_goal_opened",
          entityType,
          goalType: "goalType" in prefill ? "Unlock" : null,
        })
        launchCreateGoal(prefill)
      }}
    >
      <Plus aria-hidden />
      {t("unit.createGoal")}
    </Button>
  )
}
