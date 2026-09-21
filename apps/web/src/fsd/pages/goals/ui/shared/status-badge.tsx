import { useTranslation } from "react-i18next"
import { Link2, LockKeyhole } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import type { GoalStatus } from "@/entities/goal"

import type { GoalProgress } from "../../model/attainment/goal-progress"
import {
  blockerReasonText,
  type GoalBlockers,
} from "../../model/blockers/goal-blockers"
import { reachableCeilingLabel } from "./ceiling-marker"

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
 * tooltip lists every distinct current reason (a goal can be blocked for more than one at once —
 * deduplicated by rendered text, since e.g. two different unreached prerequisite goals both read as
 * the same generic "Waiting on a prerequisite..." sentence and showing it twice added nothing).
 *
 * A goal blocked *only* by prerequisite-style reasons reads as
 * "Restricted" with a link icon rather than "Blocked" with a lock — a dependency isn't a dead end the
 * way "no farming node exists" or "catalog data missing" is; it resolves itself once the prerequisite
 * is met. A goal blocked for a prerequisite *and* another reason still gets the stronger "Blocked"
 * treatment, since at least one reason genuinely is a dead end right now.
 *
 * `progress`, when passed, folds in the rarity/level reachable-ceiling line (`reachableCeilingLabel`)
 * for a Rank/Level goal that's currently capped — the same underlying "something currently limits
 * this goal" idea `StackedProgressBar`'s ceiling marker also surfaces, consolidated into this one
 * tooltip rather than requiring a second hover elsewhere. */
export function BlockedIndicator({
  blockers,
  progress,
}: {
  blockers: GoalBlockers
  progress?: GoalProgress
}) {
  const { t } = useTranslation()
  if (!blockers.isBlocked) return null

  const reasonLines = [
    ...new Set(blockers.reasons.map((reason) => blockerReasonText(t, reason))),
  ]
  const ceilingLabel = progress ? reachableCeilingLabel(t, progress) : null
  const tooltip = (
    <div className="grid gap-1">
      {reasonLines.map((line) => (
        <div key={line}>{line}</div>
      ))}
      {ceilingLabel ? <div>{ceilingLabel}</div> : null}
    </div>
  )
  const isOnlyRestrictedByPrerequisite = blockers.reasons.every(
    (reason) =>
      reason.kind === "PrerequisiteNotReached" ||
      reason.kind === "MissingLevelPrerequisite" ||
      reason.kind === "MissingAscensionPrerequisite" ||
      reason.kind === "MissingUnlockPrerequisite"
  )

  if (isOnlyRestrictedByPrerequisite) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            asChild
            className="gap-1 border-transparent bg-amber-400 text-amber-950"
            data-testid="goal-restricted-indicator"
            variant="outline"
          >
            <button
              className="focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              type="button"
            >
              <Link2 className="size-3.5" />
              {t("goals.blocked.restrictedLabel")}
            </button>
          </Badge>
        </TooltipTrigger>
        <TooltipContent data-testid="goal-restricted-tooltip">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          asChild
          className="gap-1 text-amber-700"
          data-testid="goal-blocked-indicator"
          variant="outline"
        >
          <button
            className="focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            type="button"
          >
            <LockKeyhole className="size-3.5" />
            {t("goals.blocked.label")}
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent data-testid="goal-blocked-tooltip">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
