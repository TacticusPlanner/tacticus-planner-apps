import { useContext } from "react"
import { useTranslation } from "react-i18next"
import type { UnitId, UpgradeId } from "@workspace/game-domain"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"

import { CreateGoalLauncherContext } from "@/entities/goal"
import { useUnitName } from "@/shared/unit-name"

import type { MaterialStep } from "../model/outcome-buckets"
import { useUpgradeName } from "../model/use-upgrade-name"

/**
 * The manual step for every V1 material goal (upgrade material or pre-farm): V2 goals always belong to
 * a unit and V1's material goals have none, so each one is listed with its material, its quantity, and
 * the units it pre-farmed for or the suggested unit — and, where the app shell's goal-creation sheet is
 * mounted, a shortcut that opens it with that unit, the Upgrade type and the material preselected.
 */
export function MaterialSteps({
  steps,
  onDismiss,
}: {
  steps: readonly MaterialStep[]
  /** Offered where the list outlives its import report (the Goals page), to put it away once done. */
  onDismiss?: () => void
}) {
  const { t } = useTranslation()
  const getUnitName = useUnitName()
  const getUpgradeName = useUpgradeName()
  // Absent outside the app shell (e.g. account setup); the steps still read as instructions there.
  const launchCreateGoal = useContext(CreateGoalLauncherContext)

  const unitNames = (units: MaterialStep["units"]) =>
    units.map((unit) => getUnitName(unit.entityType, unit.entityId)).join(", ")

  return (
    <Alert data-testid="v1-import-material-steps">
      <AlertTitle>{t("goals.v1Import.materialSteps.title")}</AlertTitle>
      <AlertDescription>
        <p>{t("goals.v1Import.materialSteps.description")}</p>
        <ul className="mt-2 grid gap-2">
          {steps.map((step, index) => (
            <li
              className="rounded-lg border bg-background p-2 text-xs text-foreground"
              data-testid="v1-import-material-step"
              key={step.sourceGoalId ?? index}
            >
              <p className="font-medium">
                {[
                  step.upgradeId ? getUpgradeName(step.upgradeId) : null,
                  step.quantity ? `×${step.quantity}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="text-muted-foreground">
                {step.linkedUnits.length > 0
                  ? t("goals.v1Import.materialSteps.preFarmedFor", {
                      units: unitNames(step.linkedUnits),
                    })
                  : t("goals.v1Import.materialSteps.suggestedUnit", {
                      unit: unitNames(step.units),
                    })}
              </p>
              {launchCreateGoal && step.upgradeId ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {step.units.map((unit) => (
                    <Button
                      data-testid="v1-import-material-step-create"
                      key={`${unit.entityType}:${unit.entityId}`}
                      onClick={() =>
                        launchCreateGoal({
                          entityType:
                            unit.entityType === "Mow" ? "Mow" : "Character",
                          entityId: unit.entityId as UnitId,
                          goalType: "Upgrade",
                          upgradeId: step.upgradeId as UpgradeId,
                          ...(step.quantity ? { quantity: step.quantity } : {}),
                        })
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {step.units.length > 1
                        ? `${t("goals.v1Import.materialSteps.createUpgradeGoal")} · ${getUnitName(unit.entityType, unit.entityId)}`
                        : t("goals.v1Import.materialSteps.createUpgradeGoal")}
                    </Button>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        {onDismiss ? (
          <Button
            className="mt-2"
            data-testid="v1-import-material-steps-dismiss"
            onClick={onDismiss}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("goals.v1Import.materialSteps.dismiss")}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
