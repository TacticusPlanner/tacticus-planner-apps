import { useTranslation } from "react-i18next"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { powerNote, type PowerFigure } from "./unit-power.model"

/**
 * The unit's power in the header's values area (character and MoW pages, desktop and mobile alike):
 * the label, the whole number with locale grouping, and a muted line saying what it counts. While
 * the dataset loads it is a placeholder; without power data (the `unit-power` dataset absent, or no
 * entry for the unit) it is not shown.
 */
export function UnitPowerValue({
  label,
  figure,
  note,
  isMobile,
}: {
  label: string
  figure: PowerFigure
  /** What the figure counts, e.g. "Without equipment". */
  note?: string
  isMobile: boolean
}) {
  const { i18n } = useTranslation()
  const format = new Intl.NumberFormat(i18n.language)
  if (figure.status === "unavailable") return null
  const noteText = powerNote(figure, note)

  return (
    <div
      className={cn("flex min-w-28 flex-col", isMobile && "w-full")}
      data-testid="unit-power"
      data-status={figure.status}
    >
      <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {figure.status === "loading" ? (
        <Skeleton
          className="my-1 h-6 w-24 rounded-md"
          data-testid="unit-power-loading"
        />
      ) : (
        <span
          className={cn(
            "font-bold tabular-nums",
            isMobile ? "text-xl" : "text-2xl"
          )}
          data-testid="unit-power-value"
        >
          {format.format(figure.value)}
        </span>
      )}
      {noteText ? (
        <span
          className="text-xs text-muted-foreground"
          data-testid="unit-power-note"
        >
          {noteText}
        </span>
      ) : null}
    </div>
  )
}
