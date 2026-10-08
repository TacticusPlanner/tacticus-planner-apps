import { useTranslation } from "react-i18next"

import type {
  LeaderboardFigure,
  LeaderboardRow,
  LegendaryEventUnit,
} from "@/entities/legendary-event"

import {
  LeaderboardRank,
  LeaderboardRarity,
  LeaderboardUnit,
  ObjectiveIndicator,
} from "./leaderboard-parts"
import type { ObjectiveChip } from "./leaderboard.view-model"

/** Mobile: one lane's leaderboard as row cards (portrait, name, rarity and rank, the objective
 *  icon indicators, the shown points figure and "Objectives: N"). */
export function LeaderboardList({
  rows,
  objectives,
  figure,
  nameOf,
}: {
  rows: readonly LeaderboardRow[]
  objectives: readonly ObjectiveChip[]
  figure: LeaderboardFigure
  nameOf: (unit: LegendaryEventUnit) => string
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)

  return (
    <ul className="flex min-w-0 flex-col gap-2" data-testid="leaderboard-list">
      {rows.map((row) => (
        <li
          className="flex min-w-0 flex-col gap-2 rounded-xl border p-2.5"
          data-ownership={row.ownership}
          data-testid="leaderboard-row"
          data-unit={row.unit.id}
          key={row.unit.id}
        >
          <div className="flex min-w-0 items-center justify-between gap-2">
            <LeaderboardUnit name={nameOf(row.unit)} row={row} />
            <span className="flex shrink-0 items-center gap-1">
              <LeaderboardRarity row={row} />
              <LeaderboardRank row={row} />
            </span>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="flex items-center gap-1">
              {row.objectives.map((met, index) => (
                <ObjectiveIndicator
                  icon={objectives[index]?.icon}
                  key={index}
                  label={objectives[index]?.label ?? ""}
                  met={met}
                />
              ))}
            </span>
            <span className="flex shrink-0 flex-col items-end text-sm">
              <span
                className="font-semibold tabular-nums"
                data-testid="leaderboard-points"
              >
                {t(`leaderboard.${figure}Value`, {
                  points: number.format(
                    figure === "remaining"
                      ? row.remainingPoints
                      : row.pointsPerBattle
                  ),
                })}
              </span>
              <span
                className="text-xs text-muted-foreground tabular-nums"
                data-testid="leaderboard-objectives"
              >
                {t("leaderboard.objectivesValue", {
                  count: number.format(row.objectivesCount),
                })}
              </span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
