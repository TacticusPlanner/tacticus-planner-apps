import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ArrowDown, ArrowUp } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import {
  ObjectiveIcon,
  useObjectiveLabel,
  type LeaderboardRow,
  type LeaderboardSort,
  type LeaderboardSortKey,
  type LegendaryEventObjective,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"

import {
  LeaderboardRank,
  LeaderboardRarity,
  LeaderboardUnit,
  ObjectiveIndicator,
} from "./leaderboard-parts"
import { nextLeaderboardSort } from "./leaderboard.view-model"

/** Desktop: one lane's leaderboard as a table whose unit, points and slots headers sort it. */
export function LeaderboardTable({
  rows,
  objectives,
  nameOf,
  sort,
  onSortChange,
}: {
  rows: readonly LeaderboardRow[]
  /** The lane's objectives in catalog `index` order, matching each row's `objectives` flags. */
  objectives: readonly LegendaryEventObjective[]
  nameOf: (unit: LegendaryEventUnit) => string
  sort: LeaderboardSort
  onSortChange: (sort: LeaderboardSort) => void
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const number = new Intl.NumberFormat(i18n.language)
  const labels = objectives.map((objective) => objectiveLabel(objective))

  const sortable = (key: LeaderboardSortKey, children: ReactNode) => (
    <SortableHead
      active={sort.key === key}
      direction={sort.direction}
      onSort={() => onSortChange(nextLeaderboardSort(sort, key))}
      sortKey={key}
    >
      {children}
    </SortableHead>
  )

  return (
    <div className="max-h-[36rem] min-w-0 overflow-y-auto rounded-lg border">
      <Table data-testid="leaderboard-table">
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            {sortable("name", t("leaderboard.unit"))}
            <TableHead className="px-1">
              <span className="sr-only">{t("leaderboard.rarity")}</span>
            </TableHead>
            <TableHead className="px-1">
              <span className="sr-only">{t("leaderboard.rank")}</span>
            </TableHead>
            {labels.map(({ label, icon }, index) => (
              <TableHead
                className="px-0.5 text-center"
                data-testid="leaderboard-objective-head"
                key={index}
                title={label}
              >
                <span className="inline-flex justify-center">
                  {icon ? (
                    <ObjectiveIcon className="size-4" icon={icon} />
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                </span>
                <span className="sr-only">{label}</span>
              </TableHead>
            ))}
            {sortable("points", t("leaderboard.points"))}
            {sortable("slots", t("leaderboard.slots"))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              data-ownership={row.ownership}
              data-testid="leaderboard-row"
              data-unit={row.unit.id}
              key={row.unit.id}
            >
              <TableCell className="max-w-48">
                <LeaderboardUnit name={nameOf(row.unit)} row={row} />
              </TableCell>
              <TableCell className="px-1">
                <LeaderboardRarity row={row} />
              </TableCell>
              <TableCell className="px-1">
                <LeaderboardRank row={row} />
              </TableCell>
              {row.objectives.map((met, index) => (
                <TableCell className="px-0.5 text-center" key={index}>
                  <ObjectiveIndicator
                    label={labels[index]?.label ?? ""}
                    met={met}
                  />
                </TableCell>
              ))}
              <TableCell
                className="text-right font-semibold tabular-nums"
                data-testid="leaderboard-points"
              >
                {number.format(row.points)}
              </TableCell>
              <TableCell
                className="text-right tabular-nums"
                data-testid="leaderboard-slots"
              >
                {number.format(row.slots)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function SortableHead({
  sortKey,
  active,
  direction,
  onSort,
  children,
}: {
  sortKey: LeaderboardSortKey
  active: boolean
  direction: LeaderboardSort["direction"]
  onSort: () => void
  children: ReactNode
}) {
  const Arrow = direction === "asc" ? ArrowUp : ArrowDown
  return (
    <TableHead
      aria-sort={
        active ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
      className={sortKey === "name" ? undefined : "text-right"}
    >
      <button
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
        data-testid={`leaderboard-sort-header-${sortKey}`}
        onClick={onSort}
        type="button"
      >
        {children}
        {active ? <Arrow aria-hidden="true" className="size-3.5" /> : null}
      </button>
    </TableHead>
  )
}
