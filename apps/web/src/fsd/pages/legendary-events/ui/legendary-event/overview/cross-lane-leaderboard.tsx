import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
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
  LeaderboardProgression,
  LeaderboardRankTile,
  LeaderboardRowActions,
  LeaderboardUnit,
  ObjectiveIndicator,
  type LeaderboardAddToTeam,
} from "../leaderboard/leaderboard-parts"
import {
  crossLaneLeaderboardBody,
  leaderboardFigure,
  mergeShownObjectiveSelection,
  shownObjectiveSelection,
  useLeaderboardUnitName,
  useObjectiveChips,
  type ObjectiveChipGroup,
} from "../leaderboard/leaderboard.view-model"
import type {
  LeaderboardGoalsViewModel,
  LeaderboardViewModel,
  ProgressGridViewModel,
} from "../legendary-event-page.view-model"
import {
  nextCrossLaneSort,
  sortCrossLaneRows,
  type CrossLaneSort,
  type CrossLaneSortKey,
} from "./cross-lane-sort"
import { LeaderboardLanePicker } from "./leaderboard-lane-picker"
import { useLeaderboardLanes } from "./use-leaderboard-lanes"

/**
 * The cross-lane Eligibility leaderboard (spec: one eligibility leaderboard on Teams): one row per
 * unit allowed on at least one of its lanes with each lane's figure ("—" where a lane disallows
 * it), each under that lane's objective indicators, ordered by their sum. Its lanes come from its
 * own multi-select (every lane by default, remembered apart from the page's lane switches). The
 * table's Progression, Rank and lane columns sort on a header press. Shares the controls bar and
 * its state with the lane leaderboards; the chips are grouped per lane.
 */
export function CrossLaneLeaderboard({
  event,
  leaderboard: state,
  progressGrid,
  layout,
}: {
  event: LegendaryEvent
  leaderboard: LeaderboardViewModel
  progressGrid: ProgressGridViewModel
  layout: "table" | "list"
}) {
  const lanes = useLeaderboardLanes()
  const laneIds = lanes.laneIds
  const [sort, setSort] = useState<CrossLaneSort | null>(null)
  const leaderboard = withPickerLaneSelection(event, laneIds, state)
  const onLaneToggle = (laneId: LegendaryEventLaneId, shown: boolean) => {
    // A hidden lane's column can't show its sort.
    if (!shown && sort?.key === laneId) setSort(null)
    lanes.onToggle(laneId, shown)
  }
  const { t, i18n } = useTranslation("legendaryEvents")
  const nameOf = useLeaderboardUnitName()
  const objectiveChips = useObjectiveChips()
  const ready = leaderboard.kind === "ready"
  const rosterAvailable = ready && leaderboard.rosterAvailable
  const figure = leaderboardFigure(leaderboard)
  const groups = objectiveChips(event, laneIds, progressGrid)
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
    const result = crossLaneLeaderboardBody(
      leaderboard.crossLaneRows,
      {
        onlyUnlocked: rosterAvailable && leaderboard.onlyUnlocked,
        objectiveKeys: leaderboard.selectedObjectives,
        figure,
        nameOf,
        locale: i18n.language,
      },
      laneIds
    )
    body =
      result.kind === "rows" ? (
        layout === "table" ? (
          <CrossLaneTable
            laneIds={laneIds}
            figure={figure}
            goals={leaderboard.goals}
            groups={groups}
            nameOf={nameOf}
            onAddToTeam={leaderboard.onAddToTeam}
            onSort={(key) =>
              setSort((current) => nextCrossLaneSort(current, key))
            }
            rows={sortCrossLaneRows(result.rows, sort, figure)}
            sort={sort}
          />
        ) : (
          <CrossLaneList
            laneIds={laneIds}
            figure={figure}
            goals={leaderboard.goals}
            groups={groups}
            nameOf={nameOf}
            onAddToTeam={leaderboard.onAddToTeam}
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
        goals={leaderboard.goals}
        groups={groups}
        leading={
          <LeaderboardLanePicker laneIds={laneIds} onToggle={onLaneToggle} />
        }
        progressAvailable={!ready || leaderboard.progressAvailable}
        rosterAvailable={!ready || rosterAvailable}
        state={leaderboard}
      />
      {body}
    </section>
  )
}

/** The objective chips of the picker's lanes filter (a lane the picker hides keeps its picks for
 *  when it's shown again), rather than the page's lane switches. */
function withPickerLaneSelection(
  event: LegendaryEvent,
  laneIds: readonly LegendaryEventLaneId[],
  leaderboard: LeaderboardViewModel
): LeaderboardViewModel {
  const all = leaderboard.allSelectedObjectives
  const update = leaderboard.onAllSelectedObjectivesChange
  if (!all || !update) return leaderboard
  return {
    ...leaderboard,
    selectedObjectives: shownObjectiveSelection(event, laneIds, all),
    onSelectedObjectivesChange: (next) =>
      update((current) =>
        mergeShownObjectiveSelection(event, laneIds, current, next)
      ),
  }
}

/** Add to new team on the Overview (design D5): one item per lane allowing the unit, in lane
 *  order, each naming its lane. */
function crossLaneAddToTeam(
  row: CrossLaneLeaderboardRow,
  laneIds: readonly LegendaryEventLaneId[],
  onAddToTeam:
    ((unitId: string, laneId: LegendaryEventLaneId) => void) | undefined
): LeaderboardAddToTeam | undefined {
  if (!onAddToTeam) return undefined
  return {
    laneIds: laneIds.filter((laneId) => row.lanes[laneId]),
    nameLane: true,
    onSelect: (laneId) => onAddToTeam(row.unit.id, laneId),
  }
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
  return (row: CrossLaneLeaderboardRow, laneId: LegendaryEventLaneId) => {
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

/** A sortable column heading: a button naming the column, with `aria-sort` on the cell. */
function SortHead({
  sortKey,
  sort,
  onSort,
  label,
  className,
}: {
  sortKey: CrossLaneSortKey
  sort: CrossLaneSort | null
  onSort: (key: CrossLaneSortKey) => void
  label: string
  className?: string
}) {
  const { t } = useTranslation("legendaryEvents")
  const direction = sort?.key === sortKey ? sort.direction : undefined
  const Icon =
    direction === "desc"
      ? ArrowDown
      : direction === "asc"
        ? ArrowUp
        : ArrowUpDown
  return (
    <TableHead
      aria-sort={
        direction === "desc"
          ? "descending"
          : direction === "asc"
            ? "ascending"
            : "none"
      }
      className={className}
    >
      <button
        className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        data-sort={sortKey}
        data-testid="leaderboard-sort"
        onClick={() => onSort(sortKey)}
        title={t("leaderboard.sortBy", { column: label })}
        type="button"
      >
        {label}
        <Icon
          aria-hidden
          className={direction ? "size-3.5" : "size-3.5 opacity-40"}
        />
      </button>
    </TableHead>
  )
}

function CrossLaneTable({
  rows,
  groups,
  figure,
  nameOf,
  goals,
  onAddToTeam,
  laneIds,
  sort,
  onSort,
}: {
  rows: readonly CrossLaneLeaderboardRow[]
  groups: readonly ObjectiveChipGroup[]
  figure: LeaderboardFigure
  nameOf: (unit: LegendaryEventUnit) => string
  goals: LeaderboardGoalsViewModel
  onAddToTeam?: (unitId: string, laneId: LegendaryEventLaneId) => void
  laneIds: readonly LegendaryEventLaneId[]
  sort: CrossLaneSort | null
  onSort: (key: CrossLaneSortKey) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const laneFigure = useLaneFigure(figure)
  return (
    <div className="max-h-144 min-w-0 overflow-y-auto rounded-lg border">
      <Table data-testid="cross-lane-table">
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead>{t("leaderboard.unit")}</TableHead>
            <SortHead
              label={t("leaderboard.progression")}
              onSort={onSort}
              sort={sort}
              sortKey="progression"
            />
            <SortHead
              label={t("leaderboard.rank")}
              onSort={onSort}
              sort={sort}
              sortKey="rank"
            />
            {laneIds.map((laneId) => (
              <SortHead
                className="text-right"
                key={laneId}
                label={t(`lanes.${laneId}`)}
                onSort={onSort}
                sort={sort}
                sortKey={laneId}
              />
            ))}
          </TableRow>
          <TableRow>
            <TableHead className="h-6 py-0 text-xs font-normal" colSpan={3}>
              <span className="sr-only">{t("leaderboard.unit")}</span>
            </TableHead>
            <TableHead
              className="h-6 py-0 text-right text-xs font-normal text-muted-foreground"
              colSpan={laneIds.length}
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
              <TableCell className="max-w-64">
                <span className="flex min-w-0 items-center gap-1">
                  <LeaderboardUnit
                    goalLines={goals.badgeLines(row.unit.id)}
                    name={nameOf(row.unit)}
                    previewed={goals.previewed.has(row.unit.id)}
                    row={row}
                  />
                  <LeaderboardRowActions
                    name={nameOf(row.unit)}
                    onCreateGoal={() => goals.onCreateGoal(row.unit.id, null)}
                    addToTeam={crossLaneAddToTeam(row, laneIds, onAddToTeam)}
                  />
                </span>
              </TableCell>
              <TableCell>
                <LeaderboardProgression row={row} />
              </TableCell>
              <TableCell>
                <LeaderboardRankTile row={row} />
              </TableCell>
              {laneIds.map((laneId) => {
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
  goals,
  onAddToTeam,
  laneIds,
}: {
  rows: readonly CrossLaneLeaderboardRow[]
  groups: readonly ObjectiveChipGroup[]
  figure: LeaderboardFigure
  nameOf: (unit: LegendaryEventUnit) => string
  goals: LeaderboardGoalsViewModel
  onAddToTeam?: (unitId: string, laneId: LegendaryEventLaneId) => void
  laneIds: readonly LegendaryEventLaneId[]
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
            <span className="-my-1.5 flex min-w-0 items-center gap-1">
              <LeaderboardUnit
                goalLines={goals.badgeLines(row.unit.id)}
                name={nameOf(row.unit)}
                previewed={goals.previewed.has(row.unit.id)}
                row={row}
              />
              <LeaderboardRowActions
                name={nameOf(row.unit)}
                onCreateGoal={() => goals.onCreateGoal(row.unit.id, null)}
                addToTeam={crossLaneAddToTeam(row, laneIds, onAddToTeam)}
                size="card"
              />
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <LeaderboardProgression row={row} />
              <LeaderboardRankTile row={row} />
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">
              {t(`leaderboard.${figure}`)}
            </span>
            {laneIds.map((laneId) => {
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
