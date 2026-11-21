import { TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"

import type { DailyRaidsReadyViewModel } from "../model/daily-raids.domain"
import { GoalTargetBadge, UnitIcon } from "./resource-card"
import { ResourceIcon } from "./resource-icon"

/**
 * The blockers behind a partial plan, straight from the plan's own per-goal outcome: each goal
 * that has requirements with no supported source, and why. Rendered by both Today and Raids Plan
 * so neither implies the goal can finish.
 */
export function PlanBlockers({ raids }: { raids: DailyRaidsReadyViewModel }) {
  const { t } = useTranslation(["dailies", "common"])
  if (raids.blockedGoals.length === 0) return null

  return (
    <Alert data-testid="plan-blockers">
      <TriangleAlert aria-hidden="true" />
      <AlertTitle>{t("dailies:blockers.title")}</AlertTitle>
      <AlertDescription>
        <ul className="space-y-2">
          {raids.blockedGoals.map(({ goalId, blockers, partial }) => {
            const goal = raids.goalsById.get(goalId)
            return (
              <li key={goalId} data-testid={`plan-blocker-${goalId}`}>
                {goal ? (
                  <span className="inline-flex items-center gap-1.5 align-middle font-medium text-foreground">
                    <UnitIcon goal={goal} />
                    {goal.unitLabel}
                    <span aria-hidden="true">·</span>
                    <GoalTargetBadge goal={goal} />
                  </span>
                ) : (
                  <span className="font-medium text-foreground">{goalId}</span>
                )}
                {" — "}
                {t(
                  partial ? "dailies:blockers.partial" : "dailies:blockers.none"
                )}
                <ul className="mt-1 flex flex-col gap-1">
                  {blockers.map((blocker) => {
                    const material =
                      raids.resourceLabels.get(blocker.resourceId) ??
                      blocker.resourceId
                    return (
                      <li
                        className="flex items-center gap-1.5"
                        key={blocker.resourceId}
                      >
                        <ResourceIcon
                          size="row"
                          label={material}
                          visual={raids.resourceVisuals.get(blocker.resourceId)}
                        />
                        <span className="min-w-0">
                          {t("dailies:blockers.row", {
                            material,
                            count: blocker.remaining,
                            reason: t(
                              `common:goals.estimate.blocked.${blocker.reason}`
                            ),
                          })}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
