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

import type { PreFarmStep } from "../model/outcome-buckets"
import { useUpgradeName } from "../model/use-upgrade-name"

/**
 * The manual step for every V1 pre-farm goal: V2 has no pre-farm goal type, so each one is listed
 * with its material and the units it pre-farmed for, and — where the app shell's goal-creation sheet
 * is mounted — a shortcut that opens it with that unit, the Upgrade type and the material preselected.
 */
export function PreFarmSteps({ steps }: { steps: readonly PreFarmStep[] }) {
  const { t } = useTranslation()
  const getUnitName = useUnitName()
  const getUpgradeName = useUpgradeName()
  // Absent outside the app shell (e.g. account setup); the steps still read as instructions there.
  const launchCreateGoal = useContext(CreateGoalLauncherContext)

  return (
    <Alert data-testid="v1-import-pre-farm">
      <AlertTitle>{t("goals.v1Import.preFarm.title")}</AlertTitle>
      <AlertDescription>
        <p>{t("goals.v1Import.preFarm.description")}</p>
        <ul className="mt-2 grid gap-2">
          {steps.map((step, index) => (
            <li
              className="rounded-lg border bg-background p-2 text-xs text-foreground"
              data-testid="v1-import-pre-farm-step"
              key={step.sourceGoalId ?? index}
            >
              <p className="font-medium">
                {step.upgradeId ? getUpgradeName(step.upgradeId) : null}
              </p>
              <p className="text-muted-foreground">
                {step.units.length > 0
                  ? t("goals.v1Import.preFarm.forUnits", {
                      units: step.units
                        .map((unit) =>
                          getUnitName(unit.entityType, unit.entityId)
                        )
                        .join(", "),
                    })
                  : t("goals.v1Import.preFarm.noLinkedUnit")}
              </p>
              {launchCreateGoal && step.upgradeId ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {step.units.map((unit) => (
                    <Button
                      data-testid="v1-import-pre-farm-create"
                      key={`${unit.entityType}:${unit.entityId}`}
                      onClick={() =>
                        launchCreateGoal({
                          entityType:
                            unit.entityType === "Mow" ? "Mow" : "Character",
                          entityId: unit.entityId as UnitId,
                          goalType: "Upgrade",
                          upgradeId: step.upgradeId as UpgradeId,
                        })
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {step.units.length > 1
                        ? `${t("goals.v1Import.preFarm.createUpgradeGoal")} · ${getUnitName(unit.entityType, unit.entityId)}`
                        : t("goals.v1Import.preFarm.createUpgradeGoal")}
                    </Button>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
