import { useTranslation } from "react-i18next"

import {
  useObjectiveLabel,
  type LeaderboardRow,
  type LegendaryEventObjective,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"

import {
  LeaderboardRank,
  LeaderboardRarity,
  LeaderboardUnit,
  ObjectiveIndicator,
} from "./leaderboard-parts"

/** Mobile: one lane's leaderboard as row cards (portrait, name, rarity and rank, the five
 *  objective indicators, points and slots). Sorting and the filter live in the compact bar. */
export function LeaderboardList({
  rows,
  objectives,
  nameOf,
}: {
  rows: readonly LeaderboardRow[]
  objectives: readonly LegendaryEventObjective[]
  nameOf: (unit: LegendaryEventUnit) => string
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const number = new Intl.NumberFormat(i18n.language)
  const labels = objectives.map((objective) => objectiveLabel(objective).label)

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
                  key={index}
                  label={labels[index] ?? ""}
                  met={met}
                />
              ))}
            </span>
            <span className="flex shrink-0 flex-col items-end text-sm">
              <span
                className="font-semibold tabular-nums"
                data-testid="leaderboard-points"
              >
                {t("leaderboard.pointsValue", {
                  points: number.format(row.points),
                })}
              </span>
              <span
                className="text-xs text-muted-foreground tabular-nums"
                data-testid="leaderboard-slots"
              >
                {t("leaderboard.slotsValue", {
                  slots: number.format(row.slots),
                })}
              </span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
