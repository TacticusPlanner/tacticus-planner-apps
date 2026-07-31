import { useTranslation } from "react-i18next"
import { LockKeyhole } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"

import type { GoalStatus } from "@/entities/goal"

import {
  blockerReasonText,
  type GoalBlockers,
} from "../../model/blockers/goal-blockers"

const VARIANT_BY_STATUS: Record<
  GoalStatus,
  "default" | "secondary" | "outline"
> = {
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

/** The blocked indicator shown alongside `StatusBadge` (plan §4) — the goal keeps its normal
 * Active/Paused status; this is a separate, additive signal. Renders nothing when not blocked. The
 * tooltip lists every current reason (a goal can be blocked for more than one at once). */
export function BlockedIndicator({ blockers }: { blockers: GoalBlockers }) {
  const { t } = useTranslation()
  if (!blockers.isBlocked) return null

  return (
    <Badge
      className="gap-1 text-amber-700"
      data-testid="goal-blocked-indicator"
      title={blockers.reasons
        .map((reason) => blockerReasonText(t, reason))
        .join(" · ")}
      variant="outline"
    >
      <LockKeyhole className="size-3.5" />
      {t("goals.blocked.label")}
    </Badge>
  )
}
