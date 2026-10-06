import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import type { LaneProgressView } from "@/entities/legendary-event"

import type { ProgressColumn } from "./progress-columns"
import { ClearedCell, ProgressColumnIcon } from "./progress-parts"

/** Desktop: one lane's battles (rows, battle 1 first) by defeat-all and the five objectives, each
 *  row ending with its points earned of the maximum and its high score. Read-only. */
export function ProgressGrid({
  progress,
  columns,
}: {
  progress: LaneProgressView
  columns: readonly ProgressColumn[]
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  return (
    <table className="w-full text-sm" data-testid="progress-grid">
      <thead>
        <tr className="border-b">
          <th className="py-1 pr-1 text-left font-medium" scope="col">
            <span className="sr-only">{t("progress.battle")}</span>
            <span aria-hidden="true">#</span>
          </th>
          {columns.map((column, index) => {
            const label = t("progress.columnLabel", {
              objective: column.label,
              points: column.points,
            })
            return (
              <th
                className="px-0.5 py-1 font-normal"
                data-testid="progress-column"
                key={index}
                scope="col"
                title={label}
              >
                <span className="flex flex-col items-center gap-0.5">
                  <ProgressColumnIcon column={column} />
                  <span
                    aria-hidden="true"
                    className="text-xs text-muted-foreground tabular-nums"
                  >
                    {column.points}
                  </span>
                </span>
                <span className="sr-only">{label}</span>
              </th>
            )
          })}
          <th className="py-1 pl-1 text-right font-medium" scope="col">
            {t("progress.points")}
          </th>
        </tr>
      </thead>
      <tbody>
        {progress.battles.map((battle) => (
          <tr
            className={cn(
              "border-b last:border-0",
              battle.complete && "bg-(--event-legendary)/10"
            )}
            data-complete={battle.complete}
            data-testid="progress-row"
            key={battle.index}
          >
            <th
              className="py-0.5 pr-1 text-left font-medium tabular-nums"
              scope="row"
            >
              <span className="sr-only">
                {t("progress.battleNumber", { battle: battle.index + 1 })}
              </span>
              <span aria-hidden="true">{battle.index + 1}</span>
              {battle.complete ? (
                <span className="sr-only">{t("progress.complete")}</span>
              ) : null}
            </th>
            {battle.cleared.map((cleared, index) => (
              <td className="px-0.5 py-0.5 text-center" key={index}>
                <ClearedCell
                  cleared={cleared}
                  label={columns[index]?.label ?? ""}
                />
              </td>
            ))}
            <td className="py-0.5 pl-1 text-right whitespace-nowrap">
              <span className="tabular-nums" data-testid="progress-row-points">
                {t("progress.battlePoints", {
                  earned: number.format(battle.pointsEarned),
                  max: number.format(battle.maxPoints),
                })}
              </span>
              {battle.highScore > 0 ? (
                <span
                  className="block text-xs text-muted-foreground"
                  data-testid="progress-row-high-score"
                >
                  {t("progress.highScore", {
                    score: number.format(battle.highScore),
                  })}
                </span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
