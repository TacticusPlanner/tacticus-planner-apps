import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import type {
  BattleProgressView,
  LaneProgressView,
} from "@/entities/legendary-event"

import { BattleAnnotationMenu } from "@/features/legendary-event-plan"

import type { ProgressColumn } from "./progress-columns"
import type { LaneMarks } from "./progress-marks"
import { splitClearedBattles } from "./progress-order"
import { ProgressCell, ProgressColumnIcon } from "./progress-parts"

// One grid for the header and every row (rows are subgrids), so the auto-sized points column is
// as wide as its widest entry and the six cell columns line up from row to row.
const TABLE_GRID =
  "grid grid-cols-[2.5rem_repeat(6,minmax(0,1fr))_auto] gap-x-1"
const ROW_GRID = "col-span-full grid grid-cols-subgrid"

/** Mobile: one compact row per battle (number, six cells, points earned) under a sticky header
 *  row that shows the column icons once; open battles first, then the fully cleared ones struck
 *  through below a divider. Cleared state and points are read-only; saved marks always show; with editable `marks`, a
 *  not-cleared cell opens its mark menu and an incomplete row's battle number is its row action,
 *  with 40px touch targets. */
export function ProgressRows({
  progress,
  columns,
  marks,
}: {
  progress: LaneProgressView
  columns: readonly ProgressColumn[]
  marks?: LaneMarks
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const { open, cleared } = splitClearedBattles(progress.battles)
  const renderRow = (battle: BattleProgressView) => (
    <li
      className={cn(
        ROW_GRID,
        "items-center border-b py-1 last:border-0",
        battle.complete &&
          "bg-(--event-legendary)/10 text-muted-foreground line-through"
      )}
      data-battle={battle.index + 1}
      data-complete={battle.complete}
      data-testid="progress-row"
      key={battle.index}
    >
      {marks?.editable && !battle.complete ? (
        <BattleAnnotationMenu
          battle={battle.index + 1}
          onChange={(status) => marks.onMarkBattle(battle, status)}
          touch
          trigger={
            <button
              aria-label={t("annotations.rowAction", {
                battle: battle.index + 1,
              })}
              className="inline-flex size-10 items-center justify-center rounded-md border text-sm font-medium tabular-nums"
              data-testid="progress-row-action"
              type="button"
            >
              {battle.index + 1}
            </button>
          }
        />
      ) : (
        <span className="text-sm font-medium tabular-nums">
          <span className="sr-only">
            {t("progress.battleNumber", { battle: battle.index + 1 })}
          </span>
          <span aria-hidden="true">{battle.index + 1}</span>
          {battle.complete ? (
            <span className="sr-only">{t("progress.complete")}</span>
          ) : null}
        </span>
      )}
      {battle.cleared.map((cleared, index) => (
        <span className="flex justify-center" key={index}>
          <ProgressCell
            battleIndex={battle.index}
            cleared={cleared}
            label={columns[index]?.label ?? ""}
            marks={marks}
            objectiveId={index}
            touch
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
            {/* Shortened ("HS 31") so the points column stays narrow on a phone. */}
            <span aria-hidden="true">
              {t("progress.highScoreShort", {
                score: number.format(battle.highScore),
              })}
            </span>
            <span className="sr-only">
              {t("progress.highScore", {
                score: number.format(battle.highScore),
              })}
            </span>
          </span>
        ) : null}
      </span>
    </li>
  )
  return (
    <div className={cn(TABLE_GRID, "min-w-0")} data-testid="progress-rows">
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
      <ol className={cn(ROW_GRID, "min-w-0")}>
        {open.map(renderRow)}
        {cleared.length > 0 ? (
          <li
            className="col-span-full border-t-2 border-border pt-2 pb-0.5 text-xs text-muted-foreground"
            data-testid="progress-cleared-divider"
          >
            {t("progress.clearedDivider", { count: cleared.length })}
          </li>
        ) : null}
        {cleared.map(renderRow)}
      </ol>
    </div>
  )
}
