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

import { abilityIcon } from "@workspace/game-catalog"

import {
  CompactProgression,
  EntityIcon,
  HintTrigger,
  RankBadge,
} from "@/shared/ui"
import type { EntityIconSize } from "@/shared/ui"

import type { ResourceNeed } from "@/entities/goal-farming"
import type { GoalProgress, GoalTargetPreview } from "@/features/goal-planning"
import { numberFormat } from "@/shared/lib"
import { reachableCeilingLabel } from "./ceiling-marker"
import type { GoalAbilityIds } from "./goal-ability-ids"
import {
  formatGenericRemainingText,
  formatGoalRemainingText,
  formatProgressTooltipText,
} from "./goal-remaining-text"
import { StackedProgressBar } from "./stacked-progress-bar"
import { UpgradeTargetMaterials } from "./upgrade-target-materials"

/** Locale-aware thousands separator for a number embedded directly in translated copy (the info
 *  popover's per-line remaining-count clauses) — mirrors `goal-remaining-text.ts`'s own formatting so
 *  the same figure never reads "1,674" in one place and "1674" in another. */
function formatNumber(language: string | undefined, value: number): string {
  return numberFormat(language).format(value)
}

/** Rounds a 0–1 ratio to a whole percent for display without ever showing "100%" unless the ratio has
 *  truly reached 1 — plain `Math.round` reads e.g. 0.996 (498/500) as "100%", which contradicts a
 *  Remaining figure that still says "2 shards" right next to it. Caps just under instead. */
function displayPercent(ratio: number): number {
  if (ratio >= 1) return 100
  if (ratio <= 0) return 0
  return Math.min(99, Math.round(ratio * 100))
}

/** An ability's icon as a focusable tooltip trigger naming the track and the ability
 *  ("Primary · Ammo Bandolier"): the icon is the ability's only visible name in the Goals table. */
function AbilityIconTrigger({
  abilityId,
  trackLabel,
  size,
}: {
  abilityId: string
  trackLabel: string
  size: EntityIconSize
}) {
  const { t } = useTranslation("abilities")
  const label = `${trackLabel} · ${t(abilityId, { defaultValue: abilityId })}`
  return (
    // A popover on touch, with the hit area grown past the small icon so a finger can reach it.
    <HintTrigger
      className="relative shrink-0 pointer-coarse:after:absolute pointer-coarse:after:-inset-3.5"
      data-testid="goal-ability-icon"
      label={label}
    >
      <EntityIcon
        alt=""
        className="rounded-sm"
        size={size}
        src={abilityIcon(abilityId)}
      />
    </HintTrigger>
  )
}

/** "30 → 35": a track's current level, an arrow and the emphasised target. */
function AbilityLevels({
  current,
  target,
}: {
  current: number
  target: number
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-muted-foreground tabular-nums">{current}</span>
      <ArrowRight aria-hidden="true" className="size-icon-sm" />
      <span className="font-semibold tabular-nums">{target}</span>
    </span>
  )
}

/** One entry per ability track still being raised: the ability, the current level, an arrow and the
 *  emphasised target. A Machine of War's tracks are Primary/Secondary, a Character's are
 *  Active/Passive (`active*` fields hold the first track, `passive*` the second, for both). A track at
 *  or above its target gets no entry.
 *
 *  `row` (the desktop table) draws each ability's icon at row size beside its levels, with the track
 *  and ability name in the icon's tooltip, so it sits level with the rank and rarity emblems. Otherwise
 *  each track is a compact pill (label, levels) with an inline icon; `blocks` stretches the pills
 *  across the row as V1's goal card did. A track without a known ability shows its label instead. */
function AbilityTargetPills({
  progress,
  entityType,
  abilityIds,
  blocks = false,
  row = false,
}: {
  progress: Pick<
    Extract<GoalProgress, { kind: "Ability" }>,
    "currentActive" | "targetActive" | "currentPassive" | "targetPassive"
  >
  entityType?: string
  abilityIds?: GoalAbilityIds
  blocks?: boolean
  row?: boolean
}) {
  const { t } = useTranslation()
  const mow = entityType === "Mow"
  const tracks = [
    {
      key: mow ? ("primary" as const) : ("active" as const),
      abilityId: abilityIds?.[0],
      current: progress.currentActive,
      target: progress.targetActive,
    },
    {
      key: mow ? ("secondary" as const) : ("passive" as const),
      abilityId: abilityIds?.[1],
      current: progress.currentPassive,
      target: progress.targetPassive,
    },
  ].filter((track) => track.target > track.current)

  if (row) {
    return (
      <span className="flex w-max items-center gap-3 text-sm">
        {tracks.map((track) => {
          const label = t(`goals.overview.abilityTrack.${track.key}`)
          return (
            <span
              className="inline-flex items-center gap-1.5"
              data-testid={`goal-ability-pill-${track.key}`}
              key={track.key}
            >
              {track.abilityId ? (
                <AbilityIconTrigger
                  abilityId={track.abilityId}
                  size="icon-lg"
                  trackLabel={label}
                />
              ) : (
                <span className="text-xs font-medium text-muted-foreground">
                  {label}
                </span>
              )}
              <AbilityLevels current={track.current} target={track.target} />
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <span
      className={cn("flex flex-wrap items-center gap-1.5", blocks && "w-full")}
    >
      {tracks.map((track) => {
        const label = t(`goals.overview.abilityTrack.${track.key}`)
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs",
              blocks && "flex-1 justify-between rounded-lg px-2 py-1"
            )}
            data-testid={`goal-ability-pill-${track.key}`}
            key={track.key}
          >
            <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
              {track.abilityId ? (
                <AbilityIconTrigger
                  abilityId={track.abilityId}
                  size="icon"
                  trackLabel={label}
                />
              ) : null}
              {label}
            </span>
            <AbilityLevels current={track.current} target={track.target} />
          </span>
        )
      })}
    </span>
  )
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
          : "bg-primary/25 ring-1 ring-primary"
      )}
    />
  )
}

/** A goal's configured start → target while its progress is `Unknown` (the unit isn't owned yet,
 *  or player data hasn't synced) — the same emblems as live progress, so the row still says what the
 *  goal is aiming for instead of rendering nothing. */
function GoalTargetPreviewDisplay({
  preview,
  entityType,
  abilityIds,
  large,
  rankIconSize,
  arrowClass,
}: {
  preview: GoalTargetPreview
  entityType?: string
  abilityIds?: GoalAbilityIds
  large: boolean
  rankIconSize: EntityIconSize
  arrowClass: string
}) {
  const progressionSize = large ? "icon-md" : "icon"
  switch (preview.kind) {
    case "Rank":
      return (
        <span
          className="flex w-max items-center gap-1.5"
          data-testid="goal-target-preview"
        >
          <RankBadge
            size={rankIconSize}
            rank={preview.start}
            showLabel={false}
            tooltip
          />
          <ArrowRight className={arrowClass} />
          <RankBadge
            size={rankIconSize}
            rank={preview.target}
            showLabel={false}
            tooltip
          />
          {preview.targetSlots > 0 ? (
            <span className="text-xs text-muted-foreground">
              ({preview.targetSlots}/6)
            </span>
          ) : null}
        </span>
      )
    case "Ascension":
      return (
        <span
          className="flex w-max items-center gap-1.5"
          data-testid="goal-target-preview"
        >
          <CompactProgression size={progressionSize} value={preview.start} />
          <ArrowRight className={arrowClass} />
          <CompactProgression size={progressionSize} value={preview.target} />
        </span>
      )
    case "Ability":
      return (
        <span data-testid="goal-target-preview">
          <AbilityTargetPills
            abilityIds={abilityIds}
            entityType={entityType}
            row={large}
            progress={{
              currentActive: preview.startActive,
              targetActive: preview.targetActive,
              currentPassive: preview.startPassive,
              targetPassive: preview.targetPassive,
            }}
          />
        </span>
      )
  }
}

/** What Actual and Potential progress mean, with the legend swatches. `actual`/`potential` add a goal's own
 *  figures to each line (the mobile card's expanded footer); the list-wide "i" shows it without. */
function ProgressExplanation({
  actual,
  potential,
}: {
  actual?: { heading: string; extra: string | null }
  potential?: { heading: string; extra: string | null }
}) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-3 text-sm" data-testid="goal-progress-explanation">
      <p className="flex items-start gap-2">
        <ProgressSwatch variant="actual" />
        <span>
          <span className="font-medium">
            {actual?.heading ?? t("goals.overview.actualProgress")}
          </span>
          : {t("goals.overview.actualProgressDescription")}
          {actual?.extra ? ` ${actual.extra}` : null}
        </span>
      </p>
      <p className="flex items-start gap-2">
        <ProgressSwatch variant="potential" />
        <span>
          <span className="font-medium">
            {potential?.heading ?? t("goals.overview.potentialProgress")}
          </span>
          : {t("goals.overview.potentialProgressDescription")}
          {potential?.extra ? ` ${potential.extra}` : null}
        </span>
      </p>
    </div>
  )
}

/** The one "i" per list that explains Actual and Potential progress (goal-list-layout): beside the
 *  Progress header in the table, beside the legend above the cards. Each goal's own figures are in its
 *  percent readout's tooltip. */
export function ProgressExplainer() {
  const { t } = useTranslation()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={t("goals.overview.progressDetails")}
          data-testid="goals-progress-info-trigger"
          size="icon-sm"
          variant="ghost"
        >
          <Info />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <ProgressExplanation />
      </PopoverContent>
    </Popover>
  )
}

/** The once-per-list Actual/Potential key (goal-list-layout: never repeated per row or card). */
export function ProgressLegend({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        "flex items-center gap-4 text-xs text-muted-foreground",
        className
      )}
      data-testid="goals-progress-legend"
    >
      <span className="flex items-center gap-1.5">
        <ProgressSwatch variant="actual" />
        {t("goals.overview.actualProgress")}
      </span>
      <span className="flex items-center gap-1.5">
        <ProgressSwatch variant="potential" />
        {t("goals.overview.potentialProgress")}
      </span>
    </div>
  )
}

/** The goal's own from → target representation (Rank/Ascension badges, "Lv 44 → 50", "273 / 500
 *  shards", …) — split out from the progress bar/percent/explanation (`GoalProgressDisplay`) so a
 *  caller can lay the two out independently (the desktop table's separate Goal/Progress columns; the
 *  mobile card's "goal line"). Ranks are `RankBadge` emblems, Ascension the compact rarity-and-stars
 *  `CompactProgression`, ability tracks their icons. Renders nothing for `Unknown` progress or a kind
 *  with no natural current/target pair and no ratio to fall back to. */
export function GoalTargetDisplay({
  progress,
  entityType,
  abilityIds,
  size = "md",
  abilityBlocks = false,
}: {
  progress: GoalProgress
  /** Picks the Ability track labels (Machine of War: Primary/Secondary; otherwise Active/Passive). */
  entityType?: string
  /** An Ability goal's unit abilities, for each track's icon (see `goalAbilityIds`). */
  abilityIds?: GoalAbilityIds
  /** `lg` (desktop table) draws the emblems at table-row size (rank and ability icons `icon-lg`, the
   *  rarity icon `icon-md`) so the target reads at a glance. */
  size?: "md" | "lg"
  /** Ability tracks as full-width blocks (the goal card) instead of compact pills (the table). */
  abilityBlocks?: boolean
}) {
  const { t } = useTranslation()
  const large = size === "lg"
  const rankIconSize: EntityIconSize = large ? "icon-lg" : "icon"
  // Rarity hexagons are solid and fill their box, so they sit a step below the rank emblems (`icon-md`).
  const progressionSize = large ? "icon-md" : "icon"
  // `w-max` on each target row: the Goal column shrinks to its content's minimum width, and Tailwind's
  // `max-width: 100%` on images gives a row of icons almost none, which squashed them into the next cell.
  const arrowClass = cn(
    "text-muted-foreground",
    large ? "size-icon" : "size-icon-sm"
  )

  if (progress.kind === "Unknown") {
    return progress.preview ? (
      <GoalTargetPreviewDisplay
        abilityIds={abilityIds}
        arrowClass={arrowClass}
        entityType={entityType}
        preview={progress.preview}
        large={large}
        rankIconSize={rankIconSize}
      />
    ) : null
  }

  return progress.kind === "Rank" ? (
    <span className="flex w-max items-center gap-1.5">
      <RankBadge
        size={rankIconSize}
        rank={progress.current}
        showLabel={false}
        tooltip
      />
      <ArrowRight className={arrowClass} />
      {/* Emblems only: the rank name is each emblem's tooltip and accessible name. The `(n/6)` marker
          below is a target modifier, so it stays. */}
      <RankBadge
        size={rankIconSize}
        rank={progress.target}
        showLabel={false}
        tooltip
      />
      {progress.targetSlots > 0 ? (
        <span className="text-xs text-muted-foreground">
          ({progress.targetSlots}/6)
        </span>
      ) : null}
    </span>
  ) : progress.kind === "Ascension" ? (
    <span className="flex w-max items-center gap-1.5">
      <CompactProgression size={progressionSize} value={progress.current} />
      <ArrowRight className={arrowClass} />
      <CompactProgression size={progressionSize} value={progress.target} />
    </span>
  ) : progress.kind === "Ability" ? (
    <AbilityTargetPills
      abilityIds={abilityIds}
      blocks={abilityBlocks}
      entityType={entityType}
      progress={progress}
      row={large && !abilityBlocks}
    />
  ) : progress.kind === "Unlock" ? (
    // The owned / required shard count lives in the Progress cell (`GoalProgressDisplay`).
    <span>{t("goals.create.goalTypes.Unlock")}</span>
  ) : progress.kind === "LevelRequirement" ? (
    <span>
      {t("goals.overview.levelProgress", {
        current: progress.chainedFrom ?? progress.current,
        target: progress.target,
      })}
    </span>
  ) : progress.materials.length > 0 ? (
    <UpgradeTargetMaterials materials={progress.materials} />
  ) : progress.ratio !== null ? (
    // An "Upgrade" goal with no materials: the percentage is the only readout left.
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
 * At or above the mobile breakpoint there is no per-goal "i": the list explains Actual and Potential
 * once (`ProgressExplainer`), and the goal's own figures (upgrade slots, energy, levels, XP) are the
 * percent readout's tooltip.
 *
 * `potentialOnly` drops the actual reading: the bar renders fully in
 * the striped "potential" style, the percent shows only the small potential-styled reading, and the
 * breakdown popover is dropped. Requires `potentialRatio`, else falls back to normal. */
export function GoalProgressDisplay({
  progress,
  potentialRatio,
  potentialOnly = false,
  remaining = null,
  energy,
}: {
  progress: GoalProgress
  potentialRatio?: number
  potentialOnly?: boolean
  remaining?: ResourceNeed | null
  energy?: number
}) {
  const { t, i18n } = useTranslation()
  const isMobile = useIsMobile()
  const [mobileExpanded, setMobileExpanded] = useState(false)

  const unlockCount =
    progress.kind === "Unlock" ? (
      <span
        className="text-xs whitespace-nowrap text-muted-foreground tabular-nums"
        data-testid="goal-unlock-count"
      >
        {t("goals.overview.ownedOfRequired", {
          owned: progress.owned,
          required: progress.required,
        })}
      </span>
    ) : null

  if (progress.kind === "Unknown" || progress.ratio === null) {
    const remainingText = formatGenericRemainingText(t, remaining, energy)
    return remainingText || unlockCount ? (
      <div className="grid gap-1">
        {unlockCount}
        {remainingText ? (
          <p
            className="text-xs whitespace-normal text-muted-foreground"
            data-testid="goal-remaining-text"
          >
            {remainingText}
          </p>
        ) : null}
      </div>
    ) : null
  }

  const remainingText = formatGoalRemainingText(
    t,
    i18n.resolvedLanguage,
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
    <span
      className={cn(
        "block text-right text-sm font-medium tabular-nums",
        // Holds the potential line's slot so a Paused goal (no potential) doesn't reflow.
        !potentialOnly && "min-h-9"
      )}
    >
      {actualPct}%
      {showIndicator ? (
        <span className="block text-xs font-normal text-primary tabular-nums">
          {t("goals.overview.potentialIndicator", { percent: potentialPct })}
        </span>
      ) : null}
    </span>
  )

  const tooltipText = formatProgressTooltipText(
    t,
    i18n.resolvedLanguage,
    progress,
    remaining,
    energy
  )
  const percentWithTooltip = tooltipText ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="cursor-default"
          data-testid="goal-progress-percent"
          type="button"
        >
          {percentLabel}
        </button>
      </TooltipTrigger>
      <TooltipContent data-testid="goal-remaining-text">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  ) : (
    <span data-testid="goal-progress-percent">{percentLabel}</span>
  )

  const fmt = (value: number) => formatNumber(i18n.resolvedLanguage, value)
  const slotsRemaining = remaining?.upgradeSlotsRemaining ?? 0
  // The mobile card's expanded footer: the shared explanation with this goal's own figures.
  const explanation = hasExplanation ? (
    <ProgressExplanation
      actual={{
        heading: `${t("goals.overview.actualProgress")} ${actualPct}%`,
        extra:
          progress.kind === "Rank" && slotsRemaining > 0
            ? t("goals.overview.actualSlotsRemaining", {
                count: slotsRemaining,
              })
            : progress.kind === "LevelRequirement" &&
                progress.target > progress.current
              ? t("goals.overview.actualLevelsRemaining", {
                  count: progress.target - progress.current,
                })
              : null,
      }}
      potential={{
        heading: `${t("goals.overview.potentialProgress")} ${potentialPct}%`,
        extra:
          progress.kind === "Rank" && energy !== undefined
            ? t("goals.overview.potentialEnergyRemaining", {
                energy: fmt(energy),
              })
            : progress.kind === "LevelRequirement" && progress.remainingXp > 0
              ? t("goals.overview.potentialXpRemaining", {
                  xp: fmt(progress.remainingXp),
                })
              : null,
      }}
    />
  ) : null

  const ceilingLabel = reachableCeilingLabel(t, progress)

  // The level line is one compact row, so its potential-only bar carries no footer text.
  const mobileFooter = showPotentialOnly ? null : hasExplanation ? (
    <div className="grid gap-1">
      <button
        aria-expanded={mobileExpanded}
        className="flex items-center gap-1 text-left text-xs text-muted-foreground"
        data-testid="goal-progress-mobile-footer"
        onClick={() => setMobileExpanded((value) => !value)}
        type="button"
      >
        {remainingText ?? t("goals.overview.progressDetails")}
        <Info className="size-icon-sm shrink-0" />
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
              progress.kind === "Rank" || progress.kind === "LevelRequirement"
                ? progress.reachableRatio
                : null
            }
            mobile={isMobile}
            potentialRatio={potentialRatio}
            valueText={valueText}
          />
        </div>
        {unlockCount}
        {percentWithTooltip}
      </div>
      {isMobile ? mobileFooter : null}
    </div>
  )
}
