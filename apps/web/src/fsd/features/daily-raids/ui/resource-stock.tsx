import { useTranslation } from "react-i18next"

import type { DailyRaidResourceProgress } from "../model/daily-raids.domain"

/** "X/Y" beside the drop icon: what the player holds of the item and its total target over the goals
 * in scope (the Today/Raids have/need figure, aggregated). Nothing when no goal targets the item. */
export function ResourceStock({
  progress,
  testId,
}: {
  progress: DailyRaidResourceProgress | undefined
  testId: string
}) {
  const { t } = useTranslation("dailies")
  if (!progress || progress.target <= 0) return null
  return (
    <span
      aria-label={t("schedule.progress", progress)}
      className="text-xs font-medium whitespace-nowrap text-muted-foreground tabular-nums"
      data-testid={testId}
      role="img"
    >
      {progress.owned}/{progress.target}
    </span>
  )
}
