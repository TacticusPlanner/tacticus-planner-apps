import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import type { LaneProgressView } from "@/entities/legendary-event"

import type { ProgressColumn } from "./progress-columns"
import { ClearedCell, ProgressColumnIcon } from "./progress-parts"

const ROW_GRID = "grid grid-cols-[2rem_repeat(6,minmax(0,1fr))_auto] gap-1"

/** Mobile: one compact row per battle (number, six cells, points earned) under a sticky header
 *  row that shows the column icons once. Read-only. */
export function ProgressRows({
  progress,
  columns,
}: {
  progress: LaneProgressView
  columns: readonly ProgressColumn[]
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  return (
    <div className="flex min-w-0 flex-col" data-testid="progress-rows">
      <div
        aria-hidden="true"
        className={cn(
          ROW_GRID,
          "sticky top-0 z-10 items-center border-b bg-background py-1.5 text-xs text-muted-foreground"
        )}
        data-testid="progress-rows-header"
      >
        <span>#</span>
        {columns.map((column, index) => (
          <span
            className="flex flex-col items-center"
            key={index}
            title={column.label}
          >
            <ProgressColumnIcon column={column} />
            <span className="tabular-nums">{column.points}</span>
          </span>
        ))}
        <span className="text-right">{t("progress.points")}</span>
      </div>
      <ol className="flex min-w-0 flex-col">
        {progress.battles.map((battle) => (
          <li
            className={cn(
              ROW_GRID,
              "items-center border-b py-1 last:border-0",
              battle.complete && "bg-(--event-legendary)/10"
            )}
            data-complete={battle.complete}
            data-testid="progress-row"
            key={battle.index}
          >
            <span className="text-sm font-medium tabular-nums">
              <span className="sr-only">
                {t("progress.battleNumber", { battle: battle.index + 1 })}
              </span>
              <span aria-hidden="true">{battle.index + 1}</span>
              {battle.complete ? (
                <span className="sr-only">{t("progress.complete")}</span>
              ) : null}
            </span>
            {battle.cleared.map((cleared, index) => (
              <span className="flex justify-center" key={index}>
                <ClearedCell
                  cleared={cleared}
                  label={columns[index]?.label ?? ""}
                />
              </span>
            ))}
            <span className="text-right text-xs whitespace-nowrap">
              <span
                className="font-medium tabular-nums"
                data-testid="progress-row-points"
              >
                {t("progress.battlePoints", {
                  earned: number.format(battle.pointsEarned),
                  max: number.format(battle.maxPoints),
                })}
              </span>
              {battle.highScore > 0 ? (
                <span
                  className="block text-muted-foreground"
                  data-testid="progress-row-high-score"
                >
                  {t("progress.highScore", {
                    score: number.format(battle.highScore),
                  })}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
