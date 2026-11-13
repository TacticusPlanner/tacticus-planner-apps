import { useContext } from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { CreateGoalLauncherContext, useGoalsById } from "@/entities/goal"
import type { PlanCampaignLockReason } from "@/features/goal-planning"

import { useCampaignTrackLabel } from "./campaign-track-label"

/** What stops the player from playing a campaign yet, one line per reason. A missing core hero
 *  gets a button that starts an Unlock goal for it, unless one already exists. */
export function CampaignLockReasons({
  reasons,
  className,
}: {
  reasons: readonly PlanCampaignLockReason[]
  className?: string
}) {
  const { t, i18n } = useTranslation()
  const label = useCampaignTrackLabel()
  const launch = useContext(CreateGoalLauncherContext)
  const { goalsById } = useGoalsById()
  if (reasons.length === 0) return null

  const listFormat = new Intl.ListFormat(i18n.resolvedLanguage)
  const unitName = (unitId: string) =>
    t(`characters:${unitId}`, { defaultValue: unitId })
  const hasUnlockGoal = (unitId: string) =>
    [...goalsById.values()].some(
      (goal) => goal.goalType === "Unlock" && goal.entityId === unitId
    )

  return (
    <ul
      className={cn(
        "flex flex-col gap-1 text-xs text-amber-800 dark:text-amber-400",
        className
      )}
    >
      {reasons.map((reason) => (
        <li
          className="flex flex-wrap items-center gap-x-2 gap-y-1"
          key={reason.kind}
        >
          <span>{lockReasonText(reason)}</span>
          {reason.kind === "MissingCoreCharacters" && launch
            ? reason.unitIds
                .filter((unitId) => !hasUnlockGoal(unitId))
                .map((unitId) => (
                  <Button
                    key={unitId}
                    onClick={() =>
                      launch({
                        entityType: "Character",
                        entityId: unitId as UnitId,
                        goalType: "Unlock",
                      })
                    }
                    className="relative h-8 pointer-coarse:h-10 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-1.5"
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Plus aria-hidden="true" />
                    {t("goals.insights.createUnlockGoal", {
                      unit: unitName(unitId),
                    })}
                  </Button>
                ))
            : null}
        </li>
      ))}
    </ul>
  )

  function lockReasonText(reason: PlanCampaignLockReason): string {
    switch (reason.kind) {
      case "MissingCoreCharacters":
        return t("goals.insights.lockMissingCore", {
          units: listFormat.format(reason.unitIds.map(unitName)),
        })
      case "RequiredCampaignNotCleared":
        return t("goals.insights.lockRequiredCampaign", {
          campaign: label(reason.campaignGroupId, reason.type),
          count: reason.battlesLeft,
        })
      case "PowerLevelTooLow":
        return t("goals.insights.lockPowerLevel", {
          required: reason.required,
          current: reason.current,
        })
    }
  }
}
