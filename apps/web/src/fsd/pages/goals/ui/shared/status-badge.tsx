import { useTranslation } from "react-i18next"
import { Check, Link2, LockKeyhole, Pause, Play } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import type { GoalStatus } from "@/entities/goal"
import {
  resourceLabel,
  type EstimateOutcome,
  type EstimateResourceId,
} from "@/features/goal-farming"

import type { GoalProgress } from "../../model/attainment/goal-progress"
import {
  blockerReasonText,
  type GoalBlockers,
} from "../../model/blockers/goal-blockers"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
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

/** `reached` is display only (`goal-list-layout`: a Reached goal reads "Reached" with a check mark
 *  whatever its stored status) — the stored `status` prop is left as it is for every other caller. */
export function StatusBadge({
  status,
  reached = false,
  onToggle,
  disabled = false,
}: {
  status: GoalStatus
  reached?: boolean
  /** When given, an Active/Paused chip becomes a one-click Pause/Resume toggle (no extra space). */
  onToggle?: (next: "Active" | "Paused") => void
  disabled?: boolean
}) {
  const { t } = useTranslation()

  if (reached) {
    return (
      <Badge
        className="gap-1 border-transparent bg-success text-success-foreground"
        data-testid="goal-status-badge"
        variant="outline"
      >
        <Check aria-hidden="true" className="size-3.5" />
        {t("goals.status.Reached")}
      </Badge>
    )
  }

  if (onToggle && (status === "Active" || status === "Paused")) {
    const next = status === "Active" ? "Paused" : "Active"
    const label = t(`goals.actions.${next === "Paused" ? "pause" : "resume"}`)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            asChild
            data-testid="goal-status-badge"
            variant={VARIANT_BY_STATUS[status]}
          >
            <button
              aria-label={`${t(`goals.status.${status}`)} — ${label}`}
              className="cursor-pointer hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-default"
              disabled={disabled}
              onClick={() => onToggle(next)}
              type="button"
            >
              {status === "Active" ? (
                <Pause aria-hidden="true" className="size-3 fill-current" />
              ) : (
                <Play aria-hidden="true" className="size-3 fill-current" />
              )}
              {t(`goals.status.${status}`)}
            </button>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    )
  }

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
 * is met. A goal whose estimate is blocked but still has obtainable work scheduled (a partial plan,
 * `partial`) reads "Restricted" too - presentation only, the same blocked state. A goal blocked for a prerequisite *and* another reason still gets the stronger "Blocked"
 * treatment, since at least one reason genuinely is a dead end right now.
 *
 * `progress`, when passed, folds in the rarity/level reachable-ceiling line (`reachableCeilingLabel`)
 * for a Rank goal or level requirement that's currently capped — the same underlying "something currently limits
 * this goal" idea `StackedProgressBar`'s ceiling marker also surfaces, consolidated into this one
 * tooltip rather than requiring a second hover elsewhere. */
export function BlockedIndicator({
  blockers,
  progress,
  estimate,
}: {
  blockers: GoalBlockers
  progress?: GoalProgress
  /** A Blocked estimate's unavailable-materials rows are appended to the tooltip. */
  estimate?: EstimateOutcome
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
      {estimate ? <UnavailableMaterials estimate={estimate} /> : null}
    </div>
  )
  const isOnlyRestrictedByPrerequisite = blockers.reasons.every(
    (reason) =>
      (reason.kind === "EstimateBlocked" && reason.partial === true) ||
      reason.kind === "PrerequisiteNotReached" ||
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
          className="gap-1 text-amber-800 dark:text-amber-400"
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

/** Each requirement with no supported source: material, remaining quantity and reason, with no
 * completion date (the goal cannot complete). Same rows on the desktop table and the mobile card. */
function UnavailableMaterials({ estimate }: { estimate: EstimateOutcome }) {
  const { t } = useTranslation(["common", "upgrades", "characters", "dailies"])
  const { upgradesById, charactersById } = useGoalCatalog()
  if (estimate.status !== "Blocked" || !estimate.blockers?.length) return null
  const label = (id: EstimateResourceId) => {
    const fallback = resourceLabel(
      id,
      upgradesById,
      charactersById ?? new Map()
    )
    if (id.startsWith("shard:")) {
      const unitId = id.slice("shard:".length)
      return t("dailies:resource.shards", {
        unit: t(`characters:${unitId}`, { defaultValue: fallback }),
      })
    }
    return t(`upgrades:${id}`, { defaultValue: fallback })
  }
  return (
    <ul
      className="grid gap-0.5 text-xs"
      data-testid="goal-unavailable-materials"
    >
      {estimate.blockers.map((blocker) => (
        <li key={blocker.resourceId}>
          {t("common:goals.estimate.unavailableRow", {
            material: label(blocker.resourceId),
            count: blocker.remaining,
            reason: t(`common:goals.estimate.blocked.${blocker.reason}`),
          })}
        </li>
      ))}
    </ul>
  )
}
