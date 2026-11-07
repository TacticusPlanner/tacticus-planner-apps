import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import {
  rosterDiffMetrics,
  type RosterDiffMetric,
  type RosterDiffSummary,
} from "@/entities/roster-snapshot"

import { formatSigned } from "../../../model/compare-labels"

/**
 * The summary over the matching units (spec: "The summary leads and filters the list"): a card on
 * desktop, one horizontally scrolling chip row on mobile. Each non-zero metric toggles the list
 * down to the units behind it; at most one is selected.
 */
export function CompareSummary({
  title,
  summary,
  matching,
  filtered,
  selected,
  onSelect,
}: {
  title: string
  summary: RosterDiffSummary
  matching: number
  /** A search, filter, quick filter or event filter narrows the units. */
  filtered: boolean
  selected: RosterDiffMetric | null
  onSelect: (metric: RosterDiffMetric | null) => void
}) {
  const { t, i18n } = useTranslation("common")
  const isMobile = useIsMobile()
  const value = (metric: RosterDiffMetric) =>
    metric === "power"
      ? formatSigned(summary.power, i18n.language)
      : new Intl.NumberFormat(i18n.language).format(summary[metric])

  const chips = rosterDiffMetrics.map((metric) => {
    // A Power selection lists only gains, so a loss leaves nothing to show.
    const enabled =
      metric === "power" ? summary.power > 0 : summary[metric] !== 0
    const active = selected === metric
    return (
      <button
        key={metric}
        type="button"
        // A selection that no longer matches stays clickable so it can be cleared.
        disabled={!enabled && !active}
        aria-pressed={active}
        onClick={() => onSelect(active ? null : metric)}
        className={cn(
          "flex shrink-0 flex-col items-start rounded-lg border px-3 py-1.5 text-left transition-colors disabled:opacity-50",
          active
            ? "border-primary bg-primary/10"
            : "hover:bg-accent/10 disabled:hover:bg-transparent"
        )}
        data-testid="compare-metric"
        data-metric={metric}
      >
        <span className="text-base font-semibold tabular-nums">
          {value(metric)}
        </span>
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {t(`myGame.collection.compare.metrics.${metric}`)}
        </span>
      </button>
    )
  })

  const caption = filtered
    ? t("myGame.collection.compare.summaryFor", { count: matching })
    : null

  if (isMobile) {
    return (
      <section
        aria-label={title}
        className="flex min-w-0 flex-col gap-1"
        data-testid="compare-summary"
      >
        {caption ? (
          <p className="text-xs text-muted-foreground">{caption}</p>
        ) : null}
        <div className="flex gap-2 overflow-x-auto pb-1">{chips}</div>
      </section>
    )
  }
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-[10px] border bg-card p-4"
      data-testid="compare-summary"
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {caption ? (
          <span className="text-xs text-muted-foreground">{caption}</span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">{chips}</div>
      <p className="text-xs text-muted-foreground">
        {t("myGame.collection.compare.metricHint")}
      </p>
    </section>
  )
}
