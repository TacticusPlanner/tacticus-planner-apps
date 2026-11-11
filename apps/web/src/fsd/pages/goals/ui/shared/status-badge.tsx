import { useTranslation } from "react-i18next"
import { Check, Link2, LockKeyhole, Pause, Play } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import type { GoalStatus } from "@/entities/goal"
import {
  resourceLabel,
  type EstimateOutcome,
  type EstimateResourceId,
} from "@/features/goal-farming"

import type { GoalProgress } from "@/features/goal-planning"
import { blockerReasonText, type GoalBlockers } from "@/features/goal-planning"
import { useGoalCatalog } from "@/features/goal-planning"
import { reachableCeilingLabel } from "./ceiling-marker"
import { FarmUnlockPaths } from "./farm-unlock-paths"
import { GoalResourceIcon } from "./goal-resource-icon"

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
  className,
}: {
  status: GoalStatus
  reached?: boolean
  /** Extra classes for the chip (the desktop table's standalone Status column draws it larger). */
  className?: string
  /** When given, an Active/Paused chip becomes a one-click Pause/Resume toggle (no extra space). */
  onToggle?: (next: "Active" | "Paused") => void
  disabled?: boolean
}) {
  const { t } = useTranslation()

  if (reached) {
    return (
      <Badge
        className={cn(
          "gap-1 border-transparent bg-success text-success-foreground",
          className
        )}
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
            className={className}
            data-testid="goal-status-badge"
            variant={VARIANT_BY_STATUS[status]}
          >
            <button
              aria-label={`${t(`goals.status.${status}`)} — ${label}`}
              className="cursor-pointer hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-default"
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
    <Badge
      className={className}
      data-testid="goal-status-badge"
      variant={VARIANT_BY_STATUS[status]}
    >
      {t(`goals.status.${status}`)}
    </Badge>
  )
}

/** The blocked indicator shown alongside `StatusBadge` (plan §4) — the goal keeps its normal
 * Active/Paused status; this is a separate, additive signal. Renders nothing when not blocked. The
 * popover lists every distinct current reason (a goal can be blocked for more than one at once —
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
 * popover rather than requiring a second place to look. */
export function BlockedIndicator({
  blockers,
  progress,
  estimate,
  className,
}: {
  blockers: GoalBlockers
  /** Extra classes for the chip, matching `StatusBadge`'s `className` beside it. */
  className?: string
  progress?: GoalProgress
  /** A Blocked estimate's unavailable-materials rows are appended to the popover. */
  estimate?: EstimateOutcome
}) {
  const { t } = useTranslation()
  if (!blockers.isBlocked) return null

  const reasonLines = [
    ...new Set(blockers.reasons.map((reason) => blockerReasonText(t, reason))),
  ]
  const ceilingLabel = progress ? reachableCeilingLabel(t, progress) : null
  const details = (explanation?: string) => (
    <div className="grid gap-2 text-sm">
      {explanation ? (
        <div className="font-medium" data-testid="goal-restricted-explanation">
          {explanation}
        </div>
      ) : null}
      {reasonLines.map((line) => (
        <div key={line}>{line}</div>
      ))}
      {ceilingLabel ? <div>{ceilingLabel}</div> : null}
      {estimate ? (
        <UnavailableMaterials estimate={estimate} reasonLines={reasonLines} />
      ) : null}
    </div>
  )
  const isOnlyRestrictedByPrerequisite = blockers.reasons.every(
    (reason) =>
      (reason.kind === "EstimateBlocked" && reason.partial === true) ||
      reason.kind === "PrerequisiteNotReached" ||
      reason.kind === "MissingAscensionPrerequisite" ||
      reason.kind === "MissingUnlockPrerequisite"
  )

  // A popover rather than a tooltip: it opens on click or tap alike, stays open while the player
  // scrolls it or uses the "+N more" toggle and Unlock goal buttons inside, and reads in the
  // page's own colours.
  if (isOnlyRestrictedByPrerequisite) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge
            asChild
            className={cn(
              "gap-1 border-transparent bg-amber-400 text-amber-950",
              className
            )}
            data-testid="goal-restricted-indicator"
            variant="outline"
          >
            <button
              className="cursor-pointer focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              type="button"
            >
              <Link2 className="size-3.5" />
              {t("goals.blocked.restrictedLabel")}
            </button>
          </Badge>
        </PopoverTrigger>
        <PopoverContent
          className="max-h-(--radix-popover-content-available-height) w-80 overflow-y-auto"
          collisionPadding={16}
          data-testid="goal-restricted-tooltip"
        >
          {details(t("goals.blocked.restrictedExplanation"))}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          asChild
          className={cn("gap-1 text-amber-800 dark:text-amber-400", className)}
          data-testid="goal-blocked-indicator"
          variant="outline"
        >
          <button
            className="cursor-pointer focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            type="button"
          >
            <LockKeyhole className="size-3.5" />
            {t("goals.blocked.label")}
          </button>
        </Badge>
      </PopoverTrigger>
      <PopoverContent
        className="max-h-(--radix-popover-content-available-height) w-80 overflow-y-auto"
        collisionPadding={16}
        data-testid="goal-blocked-tooltip"
      >
        {details()}
      </PopoverContent>
    </Popover>
  )
}

/** Each requirement with no supported source: material, remaining quantity and reason, with no
 * completion date (the goal cannot complete). Same rows on the desktop table and the mobile card. */
function UnavailableMaterials({
  estimate,
  reasonLines,
}: {
  estimate: EstimateOutcome
  /** Reasons the popover already states above the rows; a row doesn't repeat them. */
  reasonLines: readonly string[]
}) {
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
    <ul className="grid gap-3 text-xs" data-testid="goal-unavailable-materials">
      {estimate.blockers.map((blocker) => {
        const reason = t(`common:goals.estimate.blocked.${blocker.reason}`)
        const material = t("common:goals.estimate.materialCount", {
          material: label(blocker.resourceId),
          count: blocker.remaining,
        })
        return (
          <li className="grid gap-1" key={blocker.resourceId}>
            <span className="flex items-center gap-2 text-sm font-medium">
              <GoalResourceIcon
                className="size-8"
                resourceId={blocker.resourceId}
              />
              {reasonLines.includes(reason)
                ? material
                : t("common:goals.estimate.unavailableRow", {
                    material: label(blocker.resourceId),
                    count: blocker.remaining,
                    reason,
                  })}
            </span>
            {blocker.reason === "NoFarmLocation" ? (
              <FarmUnlockPaths
                resourceId={blocker.resourceId}
                testId={`goal-unlock-paths-${blocker.resourceId}`}
              />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
