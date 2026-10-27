import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import {
  MOBILE_CREATE_STEPS,
  type MobileCreateStep,
} from "./mobile-create-step"

/** The mobile create flow's step indicator: all three steps, the current one marked. */
export function MobileStepIndicator({ step }: { step: MobileCreateStep }) {
  const { t } = useTranslation()
  const index = MOBILE_CREATE_STEPS.indexOf(step)

  return (
    <nav aria-label={t("goals.create.steps.label")}>
      <ol
        className="flex items-center gap-2 text-xs"
        data-testid="create-goal-step-indicator"
      >
        {MOBILE_CREATE_STEPS.map((candidate, position) => {
          const current = candidate === step
          return (
            <li
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex flex-1 items-center gap-1.5 border-b-2 pb-1",
                current
                  ? "border-primary font-medium text-foreground"
                  : position < index
                    ? "border-primary/40 text-muted-foreground"
                    : "border-border text-muted-foreground"
              )}
              key={candidate}
            >
              <span className="sr-only">
                {t("goals.create.steps.position", {
                  position: position + 1,
                  total: MOBILE_CREATE_STEPS.length,
                })}
              </span>
              <span aria-hidden className="tabular-nums">
                {position + 1}
              </span>
              {t(`goals.create.steps.${candidate}`)}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
