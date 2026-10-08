import { useTranslation } from "react-i18next"
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
  type LeaderboardFigure,
  type LeaderboardRow,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"

import {
  LeaderboardRank,
  LeaderboardRarity,
  LeaderboardUnit,
  ObjectiveIndicator,
} from "./leaderboard-parts"
import type { ObjectiveChip } from "./leaderboard.view-model"

/** Desktop: one lane's leaderboard as a table, in the fixed default order (no sortable headers),
 *  with one icon-headed column per objective, the shown points figure and the objectives count. */
export function LeaderboardTable({
  rows,
  objectives,
  figure,
  nameOf,
}: {
  rows: readonly LeaderboardRow[]
  /** The lane's objectives in catalog `index` order, matching each row's `objectives` flags. */
  objectives: readonly ObjectiveChip[]
  figure: LeaderboardFigure
  nameOf: (unit: LegendaryEventUnit) => string
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)

  return (
    <div className="max-h-[36rem] min-w-0 overflow-y-auto rounded-lg border">
      <Table data-testid="leaderboard-table">
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead>{t("leaderboard.unit")}</TableHead>
            <TableHead className="px-1">
              <span className="sr-only">{t("leaderboard.rarity")}</span>
            </TableHead>
            <TableHead className="px-1">
              <span className="sr-only">{t("leaderboard.rank")}</span>
            </TableHead>
            {objectives.map(({ key, label, icon }, index) => (
              <TableHead
                className="px-0.5 text-center"
                data-testid="leaderboard-objective-head"
                key={key}
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
            <TableHead
              className="text-right"
              data-testid="leaderboard-figure-head"
            >
              {t(`leaderboard.${figure}`)}
            </TableHead>
            <TableHead className="text-right">
              {t("leaderboard.objectives")}
            </TableHead>
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
                    icon={objectives[index]?.icon}
                    label={objectives[index]?.label ?? ""}
                    met={met}
                  />
                </TableCell>
              ))}
              <TableCell
                className="text-right font-semibold tabular-nums"
                data-testid="leaderboard-points"
              >
                {number.format(
                  figure === "remaining"
                    ? row.remainingPoints
                    : row.pointsPerBattle
                )}
              </TableCell>
              <TableCell
                className="text-right tabular-nums"
                data-testid="leaderboard-objectives"
              >
                {number.format(row.objectivesCount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
