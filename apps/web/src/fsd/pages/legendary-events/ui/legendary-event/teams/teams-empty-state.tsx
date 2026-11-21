import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"
import { EmptyState } from "@/shared/ui"

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
    <EmptyState
      actions={children}
      description={t("teams.empty", { lane: t(`lanes.${laneId}`) })}
      icon={Users}
      testId="legendary-event-teams-empty"
    />
  )
}
