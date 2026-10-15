import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"

/** One line naming the lane; the section's Add team button sits beside it (design D5), and
 *  Suggest teams below it when estimates are available (Stage 6). */
export function TeamsEmptyState({
  laneId,
  children,
}: {
  laneId: LegendaryEventLaneId
  children?: ReactNode
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <div
      className="flex flex-col items-start gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
      data-testid="legendary-event-teams-empty"
    >
      <p>{t("teams.empty", { lane: t(`lanes.${laneId}`) })}</p>
      {children}
    </div>
  )
}
