import { useTranslation } from "react-i18next"
import { ArrowDown } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import type {
  MasterTableRow,
  MasterTableUnitSet,
} from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"

import { MasterTableUnit } from "./master-table-parts"
import { useCellLanes } from "./use-cell-lanes"
import { rowDetailTotal } from "./master-table.view-model"

/**
 * The desktop table (design D5): the unit column stays visible while the table scrolls
 * horizontally inside its container; a Total group (points, objectives) follows, then one group
 * per selected event headed by its unit's portrait and name. Clicking an event header sorts by
 * that event; clicking Total restores the default order.
 */
export function MasterTableTable({
  rows,
  eventIds,
  unitSet,
  sort,
  onSortChange,
  unitName,
  eventName,
}: {
  rows: readonly MasterTableRow[]
  eventIds: readonly string[]
  unitSet: MasterTableUnitSet
  sort: string | null
  onSortChange: (eventId: string | null) => void
  unitName: (unitId: string) => string
  eventName: (eventId: string) => string
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const lanesOf = useCellLanes()
  const detailLabel =
    unitSet === "inTeams"
      ? t("masterTable.columns.teams")
      : t("masterTable.columns.objectives")
  const sticky = "sticky left-0 z-10 bg-card"
  const header = (
    key: string | null,
    label: React.ReactNode,
    testId: string
  ) => (
    <th
      aria-sort={sort === key ? "descending" : "none"}
      className="border-b border-l px-3 py-2 text-left font-medium"
      colSpan={2}
      scope="colgroup"
    >
      <button
        className="inline-flex items-center gap-2 rounded-md hover:text-foreground"
        data-testid={testId}
        onClick={() => onSortChange(key)}
        type="button"
      >
        {label}
        {sort === key ? (
          <ArrowDown aria-hidden="true" className="size-3.5" />
        ) : null}
      </button>
    </th>
  )

  return (
    <div
      className="max-w-full min-w-0 overflow-x-auto rounded-xl border"
      data-testid="master-table-scroll"
    >
      <table className="w-max min-w-full text-sm" data-testid="master-table">
        <thead className="text-muted-foreground">
          <tr>
            <th
              className={cn(sticky, "border-b px-3 py-2 text-left font-medium")}
              rowSpan={2}
              scope="col"
            >
              {t("masterTable.columns.unit")}
            </th>
            {header(
              null,
              t("masterTable.columns.total"),
              "master-table-sort-total"
            )}
            {eventIds.map((eventId) => (
              <EventHeader
                eventId={eventId}
                header={header}
                key={eventId}
                name={eventName(eventId)}
              />
            ))}
          </tr>
          <tr className="text-xs">
            {[null, ...eventIds].map((eventId) => (
              <SubHeaders detailLabel={detailLabel} key={eventId ?? "total"} />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const totalDetail = rowDetailTotal(row, eventIds, unitSet)
            return (
              <tr
                className="border-b last:border-b-0"
                data-testid={
                  index === 0 ? "master-table-first-row" : "master-table-row"
                }
                data-unit={row.unitId}
                key={row.unitId}
              >
                <th
                  className={cn(sticky, "px-3 py-2 text-left font-normal")}
                  scope="row"
                >
                  <MasterTableUnit name={unitName(row.unitId)} row={row} />
                </th>
                <td
                  className="border-l px-3 py-2 text-right font-semibold tabular-nums"
                  data-testid="master-table-total"
                >
                  {number.format(row.total)}
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
                  {number.format(totalDetail)}
                </td>
                {eventIds.map((eventId) => {
                  const cell = row.cells[eventId]
                  return [
                    <td
                      className="border-l px-3 py-2 text-right tabular-nums"
                      data-event={eventId}
                      data-testid="master-table-cell-points"
                      key={`${eventId}-points`}
                    >
                      {number.format(cell?.points ?? 0)}
                    </td>,
                    <td
                      className="px-3 py-2 text-right text-muted-foreground tabular-nums"
                      data-event={eventId}
                      data-testid="master-table-cell-detail"
                      key={`${eventId}-detail`}
                    >
                      {cell && unitSet === "inTeams" ? (
                        <span className="inline-flex items-center gap-1.5">
                          {number.format(cell.teamCount)}
                          {cell.laneIds.length > 0 ? (
                            <span className="rounded-full border px-1.5 text-xs">
                              {lanesOf(cell)}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        number.format(cell?.objectivesCount ?? 0)
                      )}
                    </td>,
                  ]
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EventHeader({
  eventId,
  name,
  header,
}: {
  eventId: string
  name: string
  header: (
    key: string | null,
    label: React.ReactNode,
    testId: string
  ) => React.ReactNode
}) {
  return header(
    eventId,
    <span className="inline-flex items-center gap-2 text-foreground">
      <EntityIcon
        alt=""
        className="size-6 shrink-0 rounded-full"
        src={characterIcon(eventId as UnitId)}
      />
      <span className="max-w-32 truncate">{name}</span>
    </span>,
    `master-table-sort-${eventId}`
  )
}

function SubHeaders({ detailLabel }: { detailLabel: string }) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <>
      <th
        className="border-b border-l px-3 py-1 text-right font-normal"
        scope="col"
      >
        {t("masterTable.columns.points")}
      </th>
      <th className="border-b px-3 py-1 text-right font-normal" scope="col">
        {detailLabel}
      </th>
    </>
  )
}
