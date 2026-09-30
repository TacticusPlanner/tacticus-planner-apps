import { TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"

import type { DailyRaidsReadyViewModel } from "../model/daily-raids.domain"

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
                <span className="font-medium text-foreground">
                  {goal ? `${goal.unitLabel} · ${goal.targetLabel}` : goalId}
                </span>
                {" — "}
                {t(
                  partial ? "dailies:blockers.partial" : "dailies:blockers.none"
                )}
                <ul className="mt-1 ml-4 list-disc">
                  {blockers.map((blocker) => (
                    <li key={blocker.resourceId}>
                      {t("dailies:blockers.row", {
                        material:
                          raids.resourceLabels.get(blocker.resourceId) ??
                          blocker.resourceId,
                        count: blocker.remaining,
                        reason: t(
                          `common:goals.estimate.blocked.${blocker.reason}`
                        ),
                      })}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
