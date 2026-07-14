import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"

import type { GoalStatus } from "@/entities/goal"

const VARIANT_BY_STATUS: Record<
  GoalStatus,
  "default" | "secondary" | "outline"
> = {
  Draft: "outline",
  Active: "default",
  Paused: "secondary",
  Completed: "secondary",
  Archived: "outline",
}

export function StatusBadge({ status }: { status: GoalStatus }) {
  const { t } = useTranslation()

  return (
    <Badge data-testid="goal-status-badge" variant={VARIANT_BY_STATUS[status]}>
      {t(`goals.status.${status}`)}
    </Badge>
  )
}
