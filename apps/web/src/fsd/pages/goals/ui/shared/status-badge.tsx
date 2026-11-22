import { useState } from "react"
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
import { afterNextPaint, hasNode } from "@/shared/lib"
import { isHreBlocker, resourceLabel } from "@/entities/goal-farming"
import type {
  EstimateOutcome,
  EstimateResourceId,
} from "@/entities/goal-farming"

import type { GoalProgress, GoalBlockers } from "@/features/goal-planning"
import { blockerReasonText, useGoalCatalog } from "@/features/goal-planning"
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
  /** When given, an Active/Paused chip becomes a one-click Pause/Resume toggle (no extra space).
   *  It runs after the chip has painted its new status; the chip shows that status until the
   *  returned promise settles, then whatever `status` says (a rolled-back toggle reverts). */
  onToggle?: (next: "Active" | "Paused") => void | Promise<unknown>
  disabled?: boolean
}) {
  const { t } = useTranslation()
  // The status a tap asked for, shown at once. Pausing or resuming rewrites the goals cache, which
  // re-renders the whole list and its estimates; that waits for the chip's own paint so the tap's
  // INP is the chip, not the list (web vitals audit 2026-11-15, P90 about 1 s before).
  const [requested, setRequested] = useState<"Active" | "Paused" | null>(null)

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
    const shown = requested ?? status
    const next = shown === "Active" ? "Paused" : "Active"
    const toggle = () => {
      setRequested(next)
      afterNextPaint(() => {
        void Promise.resolve(onToggle(next)).finally(() => setRequested(null))
      })
    }
    const label = t(`goals.actions.${next === "Paused" ? "pause" : "resume"}`)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            asChild
            className={className}
            data-testid="goal-status-badge"
            variant={VARIANT_BY_STATUS[shown]}
          >
            <button
              aria-label={`${t(`goals.status.${shown}`)} — ${label}`}
              className="cursor-pointer hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-default"
              disabled={disabled || requested !== null}
              onClick={toggle}
              type="button"
            >
              {shown === "Active" ? (
                <Pause aria-hidden="true" className="size-3 fill-current" />
              ) : (
                <Play aria-hidden="true" className="size-3 fill-current" />
              )}
              {t(`goals.status.${shown}`)}
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
      {hasNode(ceilingLabel) ? <div>{ceilingLabel}</div> : null}
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
          <button
            className={indicatorTriggerClassName}
            data-testid="goal-restricted-indicator"
            type="button"
          >
            <Badge
              className={cn(
                "gap-1 border-transparent bg-amber-400 text-amber-950",
                className
              )}
              variant="outline"
            >
              <Link2 className="size-3.5" />
              {t("goals.blocked.restrictedLabel")}
            </Badge>
          </button>
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
        <button
          className={indicatorTriggerClassName}
          data-testid="goal-blocked-indicator"
          type="button"
        >
          <Badge
            className={cn(
              "gap-1 text-amber-800 dark:text-amber-400",
              className
            )}
            variant="outline"
          >
            <LockKeyhole className="size-3.5" />
            {t("goals.blocked.label")}
          </Badge>
        </button>
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
  // A hero's shards from a Hero Release Event have their own indicator (`HreSourceIndicator`).
  const blockers =
    estimate.status === "Blocked"
      ? (estimate.blockers ?? []).filter((blocker) => !isHreBlocker(blocker))
      : []
  if (blockers.length === 0) return null
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
      {blockers.map((blocker) => {
        const reason = t(`common:goals.estimate.blocked.${blocker.reason}`)
        const material = t("common:goals.estimate.materialCount", {
          material: label(blocker.resourceId),
          count: blocker.remaining,
        })
        return (
          <li className="grid gap-1" key={blocker.resourceId}>
            <span className="flex items-center gap-2 text-sm font-medium">
              <GoalResourceIcon resourceId={blocker.resourceId} />
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

/** The badge stays compact in a goal's card or row; an invisible overhang gives it a 36px hit area
 *  for a mouse and 48px for touch (the Badge clips its own overflow, so the overhang sits here). */
const indicatorTriggerClassName =
  "relative inline-flex cursor-pointer rounded-2xl after:absolute after:-inset-x-1 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none pointer-coarse:after:-inset-y-3.5"
