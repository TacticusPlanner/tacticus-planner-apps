import { useTranslation } from "react-i18next"

import { planSummary } from "../lib/plan-summary"
import type { TokenPlanView } from "../lib/token-plan-view"

/** "Unlock at token 42 (run 2) · 31 tokens left this run", from the token plan and its forecast. */
export function PlanSummaryLine({ view }: { view: TokenPlanView }) {
  const { t } = useTranslation("legendaryEvents")
  const summary = planSummary(view)
  if (!summary) return null
  const parts = [
    ...(summary.nextStep
      ? [
          t("tokenPlan.summary.nextStep", {
            step: t(`outlook.steps.${summary.nextStep.step}`),
            token: summary.nextStep.token,
            run: summary.nextStep.run,
          }),
        ]
      : []),
    t("tokenPlan.summary.tokensLeft", {
      count: summary.tokensLeft,
    }),
  ]
  return (
    <p className="text-sm font-medium" data-testid="run-status-plan-summary">
      {parts.join(" · ")}
    </p>
  )
}
