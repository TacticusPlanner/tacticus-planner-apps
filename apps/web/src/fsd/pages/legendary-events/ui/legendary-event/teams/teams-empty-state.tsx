import { useTranslation } from "react-i18next"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"

/** One line naming the lane; the section's Add team button sits beside it (design D5). */
export function TeamsEmptyState({ laneId }: { laneId: LegendaryEventLaneId }) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <p
      className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
      data-testid="legendary-event-teams-empty"
    >
      {t("teams.empty", { lane: t(`lanes.${laneId}`) })}
    </p>
  )
}
