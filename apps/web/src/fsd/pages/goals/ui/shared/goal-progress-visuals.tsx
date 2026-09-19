import { useState } from "react"
import { ArrowRight, Info } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
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
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import { ProgressionBadge, RankBadge } from "@/shared/ui"

import type { ResourceNeed } from "@/features/goal-farming"
import type { GoalProgress } from "../../model/attainment/goal-progress"
import { reachableCeilingLabel } from "./ceiling-marker"
import {
  formatGenericRemainingText,
  formatGoalRemainingText,
} from "./goal-remaining-text"
import { StackedProgressBar } from "./stacked-progress-bar"

/** Locale-aware thousands separator for a number embedded directly in translated copy (the info
 *  popover's per-line remaining-count clauses) — mirrors `goal-remaining-text.ts`'s own formatting so
 *  the same figure never reads "1,674" in one place and "1674" in another. */
function formatNumber(language: string | undefined, value: number): string {
  return new Intl.NumberFormat(language).format(value)
}

/** Rounds a 0–1 ratio to a whole percent for display without ever showing "100%" unless the ratio has
 *  truly reached 1 — plain `Math.round` reads e.g. 0.996 (498/500) as "100%", which contradicts a
 *  Remaining figure that still says "2 shards" right next to it. Caps just under instead. */
function displayPercent(ratio: number): number {
  if (ratio >= 1) return 100
  if (ratio <= 0) return 0
  return Math.min(99, Math.round(ratio * 100))
}

/** The track with the larger remaining gap — the one that's actually gating the goal, so that's the
 *  one `GoalTargetDisplay` shows a current/target pair for. */
function widestAbilityTrack(
  progress: Extract<GoalProgress, { kind: "Ability" }>
): { current: number; target: number } {
  const activeGap = progress.targetActive - progress.currentActive
  const passiveGap = progress.targetPassive - progress.currentPassive
  return activeGap > passiveGap
    ? { current: progress.currentActive, target: progress.targetActive }
    : { current: progress.currentPassive, target: progress.targetPassive }
}

/** Small legend dot — solid for Actual, a hollow ring for Potential (mirrors the stacked bar's
 *  solid-over-striped fill convention at a size too small to render a real diagonal stripe). */
function ProgressSwatch({ variant }: { variant: "actual" | "potential" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        variant === "actual"
          ? "bg-primary"
          : "bg-primary/25 ring-1 ring-primary/60"
      )}
    />
  )
}

/** The "■ Actual / ▨ Potential" legend (`goal-list-layout`'s legend requirement) — renders once per
 *  list, not per row/card, and only when at least one visible goal actually shows both ratios. */
export function GoalProgressLegend({ show }: { show: boolean }) {
  const { t } = useTranslation()
  if (!show) return null

  return (
    <div
      className="flex items-center gap-3 text-xs text-muted-foreground"
      data-testid="goal-progress-legend"
    >
      <span className="flex items-center gap-1">
        <ProgressSwatch variant="actual" />
        {t("goals.overview.actualProgress")}
      </span>
      <span className="flex items-center gap-1">
        <ProgressSwatch variant="potential" />
        {t("goals.overview.potentialProgress")}
      </span>
    </div>
  )
}

/** The goal's own from → target representation (Rank/Ascension badges, "Lv 44 → 50", "273 / 500
 *  shards", …) — split out from the progress bar/percent/explanation (`GoalProgressDisplay`) so a
 *  caller can lay the two out independently (the desktop table's separate Goal/Progress columns; the
 *  mobile card's "goal line"). Reuses `RankBadge`/`ProgressionBadge` so a goal's target reads
 *  identically here and in the create-goal form. Renders nothing for `Unknown` progress or a kind
 *  with no natural current/target pair and no ratio to fall back to. */
export function GoalTargetDisplay({ progress }: { progress: GoalProgress }) {
  const { t } = useTranslation()

  if (progress.kind === "Unknown") return null

  return progress.kind === "Rank" ? (
    <span className="flex items-center gap-1.5">
      <RankBadge rank={progress.current} showLabel={false} />
      <ArrowRight className="size-3.5 text-muted-foreground" />
      <RankBadge rank={progress.target} showLabel={false} />
    </span>
  ) : progress.kind === "Ascension" ? (
    <span className="flex items-center gap-1.5">
      <ProgressionBadge value={progress.current} />
      <ArrowRight className="size-3.5 text-muted-foreground" />
      <ProgressionBadge value={progress.target} />
    </span>
  ) : progress.kind === "Ability" ? (
    <span>
      {t("goals.overview.levelProgress", widestAbilityTrack(progress))}
    </span>
  ) : progress.kind === "Unlock" ? (
    <span>
      {t("goals.create.unlock.ownedOfTotal", {
        owned: progress.owned,
        total: progress.required,
      })}
    </span>
  ) : progress.kind === "Level" ? (
    <span>
      {t("goals.overview.levelProgress", {
        current: progress.current,
        target: progress.target,
      })}
    </span>
  ) : progress.ratio !== null ? (
    // "Upgrade" — no natural current/target pair to show (it's an average across several
    // materials), so the percentage itself is the only visible readout.
    <span>{displayPercent(progress.ratio)}%</span>
  ) : null
}

/** The stacked progress bar, a percent readout, and — wherever both an Actual and a Potential ratio
 * are present — an on-demand explanation (an "i"-triggered popover at or above the mobile
 * breakpoint, a tap-to-expand footer line below it), per `goal-progress-display`. Pair with
 * `GoalTargetDisplay` for the goal's own current/target representation, rendered separately so a
 * caller can position the two independently. Renders nothing for `Unknown` progress or a ratio-less
 * kind beyond a still-available remaining-text line (player data for this goal hasn't synced yet, or
 * the goal kind has no ratio to show at all).
 *
 * `open`/`onOpenChange` make the desktop popover a controlled component when the caller needs to
 * coordinate one-open-at-a-time across a list (see `goals-list.tsx`'s `openPopoverGoalId`); omit
 * both for an uncontrolled popover (Radix manages its own state) in a single-instance context like
 * the goal-detail sheet.
 *
 * `potentialOnly` (see `LevelGoalSubProgress`) drops the actual reading: the bar renders fully in
 * the striped "potential" style, the percent shows only the small potential-styled reading, and the
 * breakdown popover is dropped. Requires `potentialRatio`, else falls back to normal. */
export function GoalProgressDisplay({
  progress,
  potentialRatio,
  potentialOnly = false,
  remaining = null,
  energy,
  open,
  onOpenChange,
}: {
  progress: GoalProgress
  potentialRatio?: number
  potentialOnly?: boolean
  remaining?: ResourceNeed | null
  energy?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const isMobile = useIsMobile()
  const [mobileExpanded, setMobileExpanded] = useState(false)

  if (progress.kind === "Unknown" || progress.ratio === null) {
    const remainingText = formatGenericRemainingText(t, remaining, energy)
    return remainingText ? (
      <p
        className="text-xs text-muted-foreground"
        data-testid="goal-remaining-text"
      >
        {remainingText}
      </p>
    ) : null
  }

  const remainingText = formatGoalRemainingText(
    t,
    i18n?.resolvedLanguage,
    progress,
    remaining,
    energy
  )
  const hasPotential = potentialRatio !== undefined
  const showPotentialOnly = potentialOnly && hasPotential
  const actualPct = displayPercent(progress.ratio)
  const potentialPct =
    potentialRatio !== undefined ? displayPercent(potentialRatio) : undefined
  const showIndicator = potentialPct !== undefined && potentialPct > actualPct
  const hasExplanation = hasPotential && !showPotentialOnly

  const valueText =
    hasPotential && !showPotentialOnly
      ? t("goals.overview.progressCompleteWithPotential", {
          percent: actualPct,
          potential: potentialPct,
        })
      : t("goals.overview.progressComplete", {
          percent: showPotentialOnly ? potentialPct : actualPct,
        })

  const percentLabel = showPotentialOnly ? (
    <span className="text-right text-xs font-normal text-primary tabular-nums">
      {t("goals.overview.potentialIndicator", { percent: potentialPct })}
    </span>
  ) : (
    <span className="text-right text-sm font-medium tabular-nums">
      {actualPct}%
      {showIndicator ? (
        <span className="block text-xs font-normal text-primary tabular-nums">
          {t("goals.overview.potentialIndicator", { percent: potentialPct })}
        </span>
      ) : null}
    </span>
  )

  const percentWithTooltip = remainingText ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="cursor-default"
          data-testid="goal-progress-percent"
          tabIndex={0}
        >
          {percentLabel}
        </span>
      </TooltipTrigger>
      <TooltipContent data-testid="goal-remaining-text">
        {remainingText}
      </TooltipContent>
    </Tooltip>
  ) : (
    <span data-testid="goal-progress-percent">{percentLabel}</span>
  )

  const explanation = hasExplanation ? (
    <div className="grid gap-3 text-sm" data-testid="goal-progress-explanation">
      <p className="flex items-start gap-2">
        <ProgressSwatch variant="actual" />
        <span>
          <span className="font-medium">
            {t("goals.overview.actualProgress")} {actualPct}%
          </span>
          : {t("goals.overview.actualProgressDescription")}
          {progress.kind === "Rank" && remaining?.upgradeSlotsRemaining ? (
            <>
              {" "}
              {t("goals.overview.actualSlotsRemaining", {
                count: formatNumber(
                  i18n?.resolvedLanguage,
                  remaining.upgradeSlotsRemaining
                ),
              })}
            </>
          ) : null}
          {progress.kind === "Level" && progress.target > progress.current ? (
            <>
              {" "}
              {t("goals.overview.actualLevelsRemaining", {
                count: formatNumber(
                  i18n?.resolvedLanguage,
                  progress.target - progress.current
                ),
              })}
            </>
          ) : null}
        </span>
      </p>
      <p className="flex items-start gap-2">
        <ProgressSwatch variant="potential" />
        <span>
          <span className="font-medium">
            {t("goals.overview.potentialProgress")} {potentialPct}%
          </span>
          : {t("goals.overview.potentialProgressDescription")}
          {progress.kind === "Rank" && energy !== undefined ? (
            <>
              {" "}
              {t("goals.overview.potentialEnergyRemaining", {
                energy: formatNumber(i18n?.resolvedLanguage, energy),
              })}
            </>
          ) : null}
          {progress.kind === "Level" && progress.remainingXp ? (
            <>
              {" "}
              {t("goals.overview.potentialXpRemaining", {
                xp: formatNumber(i18n?.resolvedLanguage, progress.remainingXp),
              })}
            </>
          ) : null}
        </span>
      </p>
    </div>
  ) : null

  const infoTrigger = hasExplanation ? (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          aria-label={t("goals.overview.progressDetails")}
          data-testid="goal-progress-info-trigger"
          size="icon-sm"
          variant="ghost"
        >
          <Info className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        {explanation}
      </PopoverContent>
    </Popover>
  ) : (
    <span aria-hidden="true" className="inline-block size-7 shrink-0" />
  )

  const ceilingLabel = reachableCeilingLabel(t, progress)

  const mobileFooter = hasExplanation ? (
    <div className="grid gap-1">
      <button
        aria-expanded={mobileExpanded}
        className="flex items-center gap-1 text-left text-xs text-muted-foreground"
        data-testid="goal-progress-mobile-footer"
        onClick={() => setMobileExpanded((value) => !value)}
        type="button"
      >
        {remainingText ?? t("goals.overview.progressDetails")}
        <Info className="size-3.5 shrink-0" />
      </button>
      {mobileExpanded ? (
        <div data-testid="goal-progress-mobile-explanation">{explanation}</div>
      ) : null}
    </div>
  ) : remainingText === null ? null : (
    <p
      className="text-xs text-muted-foreground"
      data-testid="goal-progress-mobile-footer"
    >
      {remainingText}
    </p>
  )

  return (
    <div className="grid gap-1" data-testid="goal-progress">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <StackedProgressBar
            actualRatio={showPotentialOnly ? 0 : progress.ratio}
            ceilingLabel={ceilingLabel}
            ceilingRatio={
              progress.kind === "Rank" || progress.kind === "Level"
                ? progress.reachableRatio
                : null
            }
            mobile={isMobile}
            potentialRatio={potentialRatio}
            valueText={valueText}
          />
        </div>
        {percentWithTooltip}
        {!isMobile ? infoTrigger : null}
      </div>
      {isMobile ? mobileFooter : null}
    </div>
  )
}
