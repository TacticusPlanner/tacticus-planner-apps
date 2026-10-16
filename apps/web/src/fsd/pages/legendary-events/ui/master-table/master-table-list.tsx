import { useTranslation } from "react-i18next"

import type {
  MasterTableRow,
  MasterTableUnitSet,
} from "@/entities/legendary-event"

import { MasterTableUnit } from "./master-table-parts"
import { useCellLanes } from "./use-cell-lanes"

/**
 * The mobile card list (design D5): per unit its portrait, name, rarity and rank and total, then
 * one line per selected event ("Lysander · 5,774 · 5 objectives", In teams "· 1 team · Gamma").
 */
export function MasterTableList({
  rows,
  eventIds,
  unitSet,
  unitName,
  eventName,
}: {
  rows: readonly MasterTableRow[]
  eventIds: readonly string[]
  unitSet: MasterTableUnitSet
  unitName: (unitId: string) => string
  eventName: (eventId: string) => string
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const lanesOf = useCellLanes()
  return (
    <ul className="flex min-w-0 flex-col gap-2" data-testid="master-table-list">
      {rows.map((row, index) => (
        <li
          className="flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-3"
          data-testid={
            index === 0 ? "master-table-first-row" : "master-table-row"
          }
          data-unit={row.unitId}
          key={row.unitId}
        >
          <div className="flex min-w-0 items-center justify-between gap-2">
            <MasterTableUnit name={unitName(row.unitId)} row={row} />
            <span
              className="shrink-0 font-semibold tabular-nums"
              data-testid="master-table-total"
            >
              {number.format(row.total)}
            </span>
          </div>
          <ul className="flex min-w-0 flex-col gap-0.5 text-sm text-muted-foreground">
            {eventIds.map((eventId) => {
              const cell = row.cells[eventId]
              const detail =
                unitSet === "inTeams"
                  ? [
                      t("masterTable.cell.teams", {
                        count: cell?.teamCount ?? 0,
                      }),
                      ...(cell && cell.laneIds.length > 0
                        ? [lanesOf(cell)]
                        : []),
                    ]
                  : [
                      t("masterTable.cell.objectives", {
                        count: cell?.objectivesCount ?? 0,
                      }),
                    ]
              return (
                <li
                  className="truncate"
                  data-event={eventId}
                  data-testid="master-table-event-line"
                  key={eventId}
                >
                  {[
                    eventName(eventId),
                    number.format(cell?.points ?? 0),
                    ...detail,
                  ].join(" · ")}
                </li>
              )
            })}
          </ul>
        </li>
      ))}
    </ul>
  )
}
