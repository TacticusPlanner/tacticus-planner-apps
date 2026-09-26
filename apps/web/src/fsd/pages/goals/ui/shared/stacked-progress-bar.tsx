import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

/** One bar, two overlaid fills: a striped "potential" layer (only when it exceeds actual) under a
 *  solid "actual" layer, plus an optional marker at the highest point *currently* reachable (a Rank
 *  goal's or level requirement's `reachableRatio` — rarity and, for Rank, level too, cap how far the goal's own
 *  target scale can advance before further Ascending/leveling; `null` when nothing currently
 *  restricts it). One accessible `role="progressbar"` element carries both ratios via
 *  `aria-valuetext`, replacing the two separate `Progress` bars/captions this superseded; the marker
 *  is presentational (`aria-hidden`) with its own hover/focus `Tooltip` naming the actual reachable
 *  rank/level — `GoalProgressDisplay`'s "Restricted" copy nearby carries the equivalent information
 *  for assistive tech that can't reach the tooltip. Split out of `goal-progress-visuals.tsx` only to
 *  keep that file under the lint line cap. */
export function StackedProgressBar({
  actualRatio,
  potentialRatio,
  ceilingRatio,
  ceilingLabel,
  mobile,
  valueText,
}: {
  actualRatio: number
  potentialRatio: number | undefined
  ceilingRatio: number | null
  ceilingLabel: ReactNode | null
  mobile: boolean
  valueText: string
}) {
  const { t } = useTranslation()
  const actualPct = Math.min(100, Math.max(0, actualRatio * 100))
  const potentialPct =
    potentialRatio !== undefined
      ? Math.min(100, Math.max(0, potentialRatio * 100))
      : undefined
  const showStripe = potentialPct !== undefined && potentialPct > actualPct
  const ceilingPct =
    ceilingRatio !== null
      ? Math.min(100, Math.max(0, ceilingRatio * 100))
      : null

  return (
    <div className="relative w-full">
      <div
        aria-label={t("goals.overview.progressLabel")}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(actualPct)}
        aria-valuetext={valueText}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted",
          mobile ? "h-[5px]" : "h-1.5"
        )}
        data-testid="goal-progress-bar"
        role="progressbar"
      >
        {showStripe ? (
          <div
            className="absolute inset-y-0 left-0 rounded-full opacity-40"
            data-testid="goal-progress-bar-potential-fill"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, var(--primary) 0 4px, transparent 4px 8px)",
              width: `${potentialPct}%`,
            }}
          />
        ) : null}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          style={{ width: `${actualPct}%` }}
        />
      </div>
      {/* Rendered as a sibling of the track, not a child, so it isn't clipped by the track's own
       *  `overflow-hidden` — it needs to extend past the thin bar to be visible and give mouse users
       *  a hit target bigger than the 4px-wide indicator itself. */}
      {ceilingPct !== null ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              aria-hidden="true"
              className="absolute -top-1.5 -bottom-1.5 z-10 flex w-3 -translate-x-1/2 cursor-help items-center justify-center"
              data-testid="goal-progress-bar-ceiling"
              style={{ left: `${ceilingPct}%` }}
            >
              <div className="h-full w-1 rounded-full bg-amber-400 ring-1 ring-background" />
            </div>
          </TooltipTrigger>
          <TooltipContent data-testid="goal-progress-bar-ceiling-tooltip">
            {ceilingLabel}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}
