import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import {
  LEGENDARY_EVENT_LANE_IDS,
  crossLaneFigure,
  type CrossLaneLeaderboardRow,
  type LeaderboardFigure,
  type LegendaryEvent,
  type LegendaryEventLaneId,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"

import { LeaderboardControls } from "../leaderboard/leaderboard-controls"
import {
  LeaderboardEmptyBody,
  LeaderboardRank,
  LeaderboardRarity,
  LeaderboardUnit,
  ObjectiveIndicator,
} from "../leaderboard/leaderboard-parts"
import {
  crossLaneLeaderboardBody,
  leaderboardFigure,
  useLeaderboardUnitName,
  useObjectiveChips,
  type ObjectiveChipGroup,
} from "../leaderboard/leaderboard.view-model"
import type {
  LeaderboardViewModel,
  ProgressGridViewModel,
} from "../legendary-event-page.view-model"

/**
 * The Overview Eligibility leaderboard (spec: cross-lane eligibility leaderboard on Overview):
 * one row per unit allowed on at least one lane with its Alpha / Beta / Gamma figures ("—" where
 * a lane disallows it), each under that lane's objective indicators, ordered by their sum. Shares
 * the controls bar and its state with the lane leaderboards; the chips are grouped per lane.
 */
export function CrossLaneLeaderboard({
  event,
  leaderboard,
  progressGrid,
  layout,
}: {
  event: LegendaryEvent
  leaderboard: LeaderboardViewModel
  progressGrid: ProgressGridViewModel
  layout: "table" | "list"
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const nameOf = useLeaderboardUnitName()
  const objectiveChips = useObjectiveChips()
  const ready = leaderboard.kind === "ready"
  const rosterAvailable = ready && leaderboard.rosterAvailable
  const figure = leaderboardFigure(leaderboard)
  const groups = objectiveChips(event, LEGENDARY_EVENT_LANE_IDS, progressGrid)
  const clearFilter = () => leaderboard.onSelectedObjectivesChange(new Set())

  let body: ReactNode
  if (leaderboard.kind === "loading") {
    body = (
      <div data-testid="leaderboard-loading">
        <span className="sr-only">{t("leaderboard.loading")}</span>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  } else if (leaderboard.kind === "unavailable") {
    body = (
      <p
        className="text-sm text-destructive"
        data-testid="leaderboard-unavailable"
      >
        {t("leaderboard.error")}
      </p>
    )
  } else {
    const result = crossLaneLeaderboardBody(leaderboard.crossLaneRows, {
      onlyUnlocked: rosterAvailable && leaderboard.onlyUnlocked,
      objectiveKeys: leaderboard.selectedObjectives,
      figure,
      nameOf,
      locale: i18n.language,
    })
    body =
      result.kind === "rows" ? (
        layout === "table" ? (
          <CrossLaneTable
            figure={figure}
            groups={groups}
            nameOf={nameOf}
            rows={result.rows}
          />
        ) : (
          <CrossLaneList
            figure={figure}
            groups={groups}
            nameOf={nameOf}
            rows={result.rows}
          />
        )
      ) : (
        <LeaderboardEmptyBody body={result} onClearFilter={clearFilter} />
      )
  }

  return (
    <section
      aria-labelledby="legendary-event-overview-leaderboard-title"
      className="flex min-w-0 flex-col gap-3"
      data-testid="legendary-event-overview-leaderboard"
    >
      <h2
        className="text-lg font-semibold"
        id="legendary-event-overview-leaderboard-title"
      >
        {t("leaderboard.title")}
      </h2>
      <LeaderboardControls
        groups={groups}
        progressAvailable={!ready || leaderboard.progressAvailable}
        rosterAvailable={!ready || rosterAvailable}
        state={leaderboard}
      />
      {body}
    </section>
  )
}

/** The lane's objective indicators for one row: met when the unit satisfies the objective (an
 *  objective's satisfaction is a unit property, so `satisfiedKeys` is exact per lane); nothing for
 *  a lane that disallows the unit. */
function LaneObjectives({
  row,
  laneId,
  groups,
}: {
  row: CrossLaneLeaderboardRow
  laneId: LegendaryEventLaneId
  groups: readonly ObjectiveChipGroup[]
}) {
  if (!row.lanes[laneId]) return null
  const chips = groups.find((group) => group.laneId === laneId)?.chips ?? []
  return (
    <span
      className="inline-flex items-center"
      data-testid="leaderboard-lane-objectives"
    >
      {chips.map((chip) => (
        <ObjectiveIndicator
          icon={chip.icon}
          key={chip.key}
          label={chip.label}
          met={row.satisfiedKeys.includes(chip.key)}
          size="sm"
        />
      ))}
    </span>
  )
}

/** A lane figure cell's text and accessible name. */
function useLaneFigure(figure: LeaderboardFigure) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  return (
    row: CrossLaneLeaderboardRow,
    laneId: (typeof LEGENDARY_EVENT_LANE_IDS)[number]
  ) => {
    const value = crossLaneFigure(row, laneId, figure)
    const lane = t(`lanes.${laneId}`)
    return value === undefined
      ? {
          text: t("leaderboard.crossLane.notAllowed"),
          label: t("leaderboard.crossLane.notAllowedLabel", { lane }),
        }
      : {
          text: number.format(value),
          label: t("leaderboard.crossLane.laneFigure", {
            lane,
            points: number.format(value),
          }),
        }
  }
}

function CrossLaneTable({
  rows,
  groups,
  figure,
  nameOf,
}: {
  rows: readonly CrossLaneLeaderboardRow[]
  groups: readonly ObjectiveChipGroup[]
  figure: LeaderboardFigure
  nameOf: (unit: LegendaryEventUnit) => string
}) {
  const { t } = useTranslation("legendaryEvents")
  const laneFigure = useLaneFigure(figure)
  return (
    <div className="max-h-[36rem] min-w-0 overflow-y-auto rounded-lg border">
      <Table data-testid="cross-lane-table">
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead>{t("leaderboard.unit")}</TableHead>
            <TableHead className="px-1">
              <span className="sr-only">{t("leaderboard.rarity")}</span>
            </TableHead>
            <TableHead className="px-1">
              <span className="sr-only">{t("leaderboard.rank")}</span>
            </TableHead>
            {LEGENDARY_EVENT_LANE_IDS.map((laneId) => (
              <TableHead className="text-right" key={laneId}>
                {t(`lanes.${laneId}`)}
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            <TableHead className="h-6 py-0 text-xs font-normal" colSpan={3}>
              <span className="sr-only">{t("leaderboard.unit")}</span>
            </TableHead>
            <TableHead
              className="h-6 py-0 text-right text-xs font-normal text-muted-foreground"
              colSpan={3}
              data-testid="leaderboard-figure-head"
            >
              {t(`leaderboard.${figure}`)}
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
              {LEGENDARY_EVENT_LANE_IDS.map((laneId) => {
                const { text, label } = laneFigure(row, laneId)
                return (
                  <TableCell
                    className="text-right"
                    data-lane={laneId}
                    data-testid="leaderboard-lane-cell"
                    key={laneId}
                  >
                    <span className="flex flex-col items-end gap-0.5">
                      <LaneObjectives
                        groups={groups}
                        laneId={laneId}
                        row={row}
                      />
                      <span
                        aria-label={label}
                        className="font-semibold tabular-nums"
                        data-lane={laneId}
                        data-testid="leaderboard-lane-points"
                      >
                        {text}
                      </span>
                    </span>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CrossLaneList({
  rows,
  groups,
  figure,
  nameOf,
}: {
  rows: readonly CrossLaneLeaderboardRow[]
  groups: readonly ObjectiveChipGroup[]
  figure: LeaderboardFigure
  nameOf: (unit: LegendaryEventUnit) => string
}) {
  const { t } = useTranslation("legendaryEvents")
  const laneFigure = useLaneFigure(figure)
  return (
    <ul className="flex min-w-0 flex-col gap-2" data-testid="cross-lane-list">
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
          <div className="flex min-w-0 flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">
              {t(`leaderboard.${figure}`)}
            </span>
            {LEGENDARY_EVENT_LANE_IDS.map((laneId) => {
              const { text, label } = laneFigure(row, laneId)
              return (
                <span
                  className="flex min-w-0 items-center justify-between gap-2"
                  data-lane={laneId}
                  data-testid="leaderboard-lane-cell"
                  key={laneId}
                >
                  <span
                    aria-hidden="true"
                    className="w-12 shrink-0 text-xs text-muted-foreground"
                  >
                    {t(`lanes.${laneId}`)}
                  </span>
                  <LaneObjectives groups={groups} laneId={laneId} row={row} />
                  <span
                    aria-label={label}
                    className="ml-auto font-semibold tabular-nums"
                    data-lane={laneId}
                    data-testid="leaderboard-lane-points"
                  >
                    {text}
                  </span>
                </span>
              )
            })}
          </div>
        </li>
      ))}
    </ul>
  )
}
