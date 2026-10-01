import { useTranslation } from "react-i18next"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import type { DailyRaidGoalViewModel } from "../../model/daily-raids.domain"
import { UnitIcon } from "../resource-card"

const MAX_VISIBLE = 4

/** The goals an event raid row feeds: up to 4 round unit icons, then a "+N" chip. The accessible
 * name and the tooltip list every goal, including the ones the chip hides. */
export function EventGoalIcons({
  goals,
  testId,
}: {
  goals: readonly DailyRaidGoalViewModel[]
  testId: string
}) {
  const { t } = useTranslation("dailies")
  if (goals.length === 0) return null
  const hidden = goals.length - MAX_VISIBLE
  const label = t("hse.raids.goals", {
    goals: goals.map((goal) => goal.unitLabel).join(", "),
  })
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={label}
          className="flex shrink-0 items-center -space-x-1.5 border-0 bg-transparent p-0"
          data-testid={testId}
          type="button"
        >
          {goals.slice(0, MAX_VISIBLE).map((goal) => (
            <UnitIcon
              key={goal.goalId}
              className="size-6 rounded-full ring-2 ring-background"
              goal={goal}
            />
          ))}
          {hidden > 0 ? (
            <span
              className="z-10 ml-1 rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums"
              data-testid={`${testId}-more`}
            >
              {t("hse.raids.moreGoals", { count: hidden })}
            </span>
          ) : null}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
