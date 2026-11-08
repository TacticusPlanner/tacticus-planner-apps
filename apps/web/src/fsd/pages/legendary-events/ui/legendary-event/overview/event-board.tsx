import {
  useCallback,
  useId,
  useMemo,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"

import {
  LEGENDARY_EVENT_LANE_IDS,
  ObjectiveIcon,
  useLaneAllowedRule,
  useObjectiveLabel,
  useRankShading,
  type LegendaryEvent,
  type LegendaryEventLaneId,
  type LegendaryEventRosterUnit,
  type LegendaryEventUnit,
  EventUnitChip,
} from "@/entities/legendary-event"
import { laneTeams } from "@/features/legendary-event-plan"
import { useUnitName } from "@/shared/unit-name"

import type {
  ProgressGridViewModel,
  ReadValue,
} from "../legendary-event-page.view-model"
import {
  rosterMap,
  type TeamPowerSource,
  type TeamsSectionState,
} from "../teams/teams.view-model"

import {
  buildEventBoardLane,
  buildEventBoardTable,
  type EventBoardLane,
  type EventBoardObjective,
  type EventBoardTableColumn,
} from "./event-board.view-model"

/** The best-five line: V1 drew a dashed rule under the fifth unit of every column. */
const TEAM_LINE = 5

/** How many units each column lists before "Show all": the best five and two spares below the
 *  team line. */
const SHOWN = 7

/** A unit-table column's minimum width: the stacked unit chip (~94px). Three lanes of five then fit
 *  side by side from about 1920px with the sidebar open; narrower screens scroll the table. */
const COLUMN_MIN_REM = 5.9

const LANE_GRID: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
}

/** What the unit table lists: the catalog units and the synced roster (undefined when signed out
 *  or unavailable: ownership is then unknown). Independent of the plan. */
interface EventBoardCatalog {
  units: ReadValue<readonly LegendaryEventUnit[]>
  roster: readonly LegendaryEventRosterUnit[] | undefined
}

/** Opens the team editor on a new team for the lane: the unit first, the column's objectives. */
type AddBoardTeam = (
  laneId: LegendaryEventLaneId,
  objectiveIndexes: readonly number[],
  unitId: string
) => void

/**
 * The Teams tab's Event board, as V1's Teams tab: the shown lanes (the page's lane selection) side
 * by side from 1024px (stacked below), each with its rule and overview figures, a unit table (one
 * column per objective listing the allowed units that satisfy it, strongest owned first, coloured
 * by rank, with a dashed line under the best five) and the lane's Teams section with its team
 * cards. Picking objective headings merges them into one column of the units satisfying all of
 * them; a unit starts a new team.
 */
export function EventBoard({
  event,
  laneIds,
  teams,
  progressGrid,
  unitPower,
  catalog,
  laneFigures,
  laneTeamsSection,
  onAddTeam,
}: {
  event: LegendaryEvent
  /** The shown lanes, in lane order (the page's lane selection). */
  laneIds: readonly LegendaryEventLaneId[]
  teams: TeamsSectionState
  progressGrid: ProgressGridViewModel
  unitPower: TeamPowerSource
  catalog: EventBoardCatalog
  /** The lane's overview figures, under its name. */
  laneFigures: (laneId: LegendaryEventLaneId) => ReactNode
  /** The lane's Teams section (its team cards, Add team and Suggest teams), under its table. */
  laneTeamsSection: (laneId: LegendaryEventLaneId) => ReactNode
  onAddTeam: AddBoardTeam
}) {
  const { t } = useTranslation("legendaryEvents")
  const [selection, setSelection] = useState<
    Partial<Record<LegendaryEventLaneId, readonly number[]>>
  >({})
  const toggleObjective = useCallback(
    (laneId: LegendaryEventLaneId, index: number) =>
      setSelection((current) => {
        const selected = current[laneId] ?? []
        return {
          ...current,
          [laneId]: selected.includes(index)
            ? selected.filter((entry) => entry !== index)
            : [...selected, index],
        }
      }),
    []
  )
  const clearObjectives = useCallback(
    (laneId: LegendaryEventLaneId) =>
      setSelection((current) => ({ ...current, [laneId]: [] })),
    []
  )
  const lanes = useMemo(
    () =>
      Object.fromEntries(
        LEGENDARY_EVENT_LANE_IDS.map((laneId) => [
          laneId,
          buildEventBoardLane(
            event[laneId],
            teams.kind === "ready" ? laneTeams(teams.plan, laneId) : [],
            teams.kind === "ready" ? teams.units : [],
            progressGrid.kind === "ready"
              ? progressGrid.lanes[laneId]
              : undefined
          ),
        ])
      ) as Record<LegendaryEventLaneId, EventBoardLane>,
    [event, teams, progressGrid]
  )
  return (
    <section
      aria-labelledby="legendary-event-board-title"
      className="flex min-w-0 flex-col gap-3"
      data-testid="legendary-event-board"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            className="text-lg font-semibold"
            id="legendary-event-board-title"
          >
            {t("eventBoard.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("eventBoard.description")}
          </p>
        </div>
        <RankShadingSwitch />
      </div>
      <div
        className={cn(
          "grid min-w-0 grid-cols-1 gap-3",
          LANE_GRID[laneIds.length]
        )}
      >
        {laneIds.map((laneId) => (
          <EventBoardColumn
            board={lanes[laneId]}
            catalog={catalog}
            event={event}
            figures={laneFigures(laneId)}
            key={laneId}
            laneId={laneId}
            onAddTeam={onAddTeam}
            onClearObjectives={clearObjectives}
            onToggleObjective={toggleObjective}
            selected={selection[laneId] ?? []}
            teamsSection={laneTeamsSection(laneId)}
            teamsState={teams}
            unitPower={unitPower}
          />
        ))}
      </div>
    </section>
  )
}

/** The Rank shading switch (spec: Rank shading is a per-browser setting): every unit chip on the
 *  event page follows it. */
function RankShadingSwitch() {
  const { t } = useTranslation("legendaryEvents")
  const { shaded, setShaded } = useRankShading()
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <Switch
        aria-describedby={`${id}-hint`}
        checked={shaded}
        data-testid="event-board-rank-shading"
        id={id}
        onCheckedChange={setShaded}
      />
      <Label htmlFor={id}>{t("unitChip.rankShading")}</Label>
      <span hidden id={`${id}-hint`}>
        {t("unitChip.rankShadingHint")}
      </span>
    </div>
  )
}

function EventBoardColumn({
  event,
  laneId,
  board,
  teamsState,
  unitPower,
  catalog,
  selected,
  figures,
  teamsSection,
  onToggleObjective,
  onClearObjectives,
  onAddTeam,
}: {
  event: LegendaryEvent
  laneId: LegendaryEventLaneId
  board: EventBoardLane
  teamsState: TeamsSectionState
  unitPower: TeamPowerSource
  catalog: EventBoardCatalog
  selected: readonly number[]
  figures: ReactNode
  teamsSection: ReactNode
  onToggleObjective: (laneId: LegendaryEventLaneId, index: number) => void
  onClearObjectives: (laneId: LegendaryEventLaneId) => void
  onAddTeam: AddBoardTeam
}) {
  const { t } = useTranslation("legendaryEvents")
  const allowedRule = useLaneAllowedRule()
  const unitName = useUnitName()
  const lane = event[laneId]
  const laneName = t(`lanes.${laneId}`)
  const rule = allowedRule(lane)
  const teamsReady = teamsState.kind === "ready"
  const rosterById = useMemo(
    () => (catalog.roster ? rosterMap(catalog.roster) : undefined),
    [catalog.roster]
  )
  const { units } = catalog
  const powerContext = typeof unitPower === "object" ? unitPower : null
  const columns = useMemo(
    () =>
      Array.isArray(units)
        ? buildEventBoardTable(
            lane,
            units as readonly LegendaryEventUnit[],
            rosterById,
            powerContext,
            new Set(selected),
            (unitId) => unitName("Character", unitId)
          )
        : undefined,
    [lane, units, rosterById, powerContext, selected, unitName]
  )
  const objectivesByIndex = useMemo(
    () =>
      new Map(board.objectives.map((entry) => [entry.objective.index, entry])),
    [board.objectives]
  )
  return (
    <Card
      className="min-w-0 gap-3 py-3"
      data-lane={laneId}
      data-testid="event-board-lane"
    >
      <CardHeader className="flex min-w-0 flex-col items-stretch gap-2 px-2">
        <div className="flex w-full min-w-0 flex-row items-center justify-between gap-2">
          <CardTitle className="min-w-0">
            <h3 className="truncate" data-testid="legendary-event-lane-label">
              {rule
                ? t("laneOverview.labelWithRule", { lane: laneName, rule })
                : laneName}
            </h3>
          </CardTitle>
          {selected.length > 0 ? (
            <Button
              className="h-7 shrink-0 px-2 text-xs"
              onClick={() => onClearObjectives(laneId)}
              type="button"
              variant="ghost"
            >
              {t("eventBoard.clearSelection")}
            </Button>
          ) : null}
        </div>
        {figures}
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3 px-2">
        <UnitTable
          columns={columns}
          laneId={laneId}
          objectivesByIndex={objectivesByIndex}
          onAddTeam={onAddTeam}
          onToggleObjective={onToggleObjective}
          selected={selected}
          showCoverage={teamsReady}
          unitsState={
            units === "loading" || units === "error" ? units : "ready"
          }
        />
        {teamsState.kind === "hidden" ? null : (
          <div className="min-w-0 border-t pt-3">{teamsSection}</div>
        )}
      </CardContent>
    </Card>
  )
}

function UnitTable({
  laneId,
  columns,
  objectivesByIndex,
  selected,
  showCoverage,
  unitsState,
  onToggleObjective,
  onAddTeam,
}: {
  laneId: LegendaryEventLaneId
  columns: EventBoardTableColumn[] | undefined
  objectivesByIndex: ReadonlyMap<number, EventBoardObjective>
  selected: readonly number[]
  showCoverage: boolean
  unitsState: "loading" | "error" | "ready"
  onToggleObjective: (laneId: LegendaryEventLaneId, index: number) => void
  onAddTeam: AddBoardTeam
}) {
  const { t } = useTranslation("legendaryEvents")
  const headingId = useId()
  // Each column lists its best seven (the team line and two more), so the lanes stay short and the
  // teams are in reach; "Show all" lists every unit. On a phone the table then grows with its
  // content rather than scrolling inside the scrolling page.
  const [showAll, setShowAll] = useState(false)
  const capped = !showAll
  const grid = useBoardGridFocus(
    (columns ?? []).map((column) =>
      capped ? Math.min(column.units.length, SHOWN) : column.units.length
    )
  )
  const keysHintId = useId()
  const longest = Math.max(
    0,
    ...(columns ?? []).map((column) => column.units.length)
  )
  const headingFor = (indexes: readonly number[]) =>
    `${headingId}-${indexes.join("+")}`
  // Before the units load the headings still show every objective, one column each.
  const headings =
    columns?.map((column) => column.objectiveIndexes) ??
    [...objectivesByIndex.keys()].map((index) => [index])
  const template = {
    gridTemplateColumns: `repeat(${headings.length}, minmax(${COLUMN_MIN_REM}rem, 1fr))`,
  }
  // At least every column's minimum (plus the 1px gaps and padding), and otherwise the box's width.
  // Not `w-max`: that would widen each column to its heading's unwrapped label.
  const contentMinWidth = `calc(${headings.length} * ${COLUMN_MIN_REM}rem + ${headings.length + 1}px)`
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        className="min-w-0 overflow-x-auto rounded-md border md:max-h-[max(34rem,calc(100dvh-18rem))] md:overflow-y-auto"
        data-testid="event-board-table"
      >
        {/* As wide as the columns, not the scroll box: the sticky heading row (and its background)
          then spans every column and moves sideways with them on a narrow screen. */}
        <div
          className="w-full"
          data-testid="event-board-table-content"
          style={{ minWidth: contentMinWidth }}
        >
          <div
            className="sticky top-0 z-10 grid gap-px border-b bg-card"
            role="group"
            aria-label={t("laneOverview.objectives")}
            style={template}
          >
            {headings.map((indexes) => (
              <ObjectiveHeading
                id={headingFor(indexes)}
                entries={indexes
                  .map((index) => objectivesByIndex.get(index))
                  .filter((entry) => entry !== undefined)}
                key={indexes.join("+")}
                onToggle={(index) => onToggleObjective(laneId, index)}
                selected={selected}
                showCoverage={showCoverage}
              />
            ))}
          </div>
          {unitsState === "loading" ? (
            <Skeleton className="m-1 h-32 rounded-md" />
          ) : null}
          {unitsState === "error" ? (
            <p className="p-2 text-sm text-destructive">
              {t("teams.loadError")}
            </p>
          ) : null}
          {columns ? (
            // The arrow keys come from the unit buttons inside, delegated to the table.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
            <div
              aria-describedby={keysHintId}
              className="grid gap-px p-px"
              onFocus={grid.onFocus}
              onKeyDown={grid.onKeyDown}
              role="group"
              style={template}
            >
              <span hidden id={keysHintId}>
                {t("eventBoard.keysHint")}
              </span>
              {columns.map((column, columnIndex) => (
                <ul
                  aria-describedby={headingFor(column.objectiveIndexes)}
                  aria-label={t("eventBoard.columnUnits", {
                    count: column.units.length,
                  })}
                  className="@container flex min-w-0 flex-col gap-px"
                  data-testid="event-board-column"
                  key={column.objectiveIndexes.join("+")}
                >
                  {column.units.length === 0 ? (
                    <li className="p-1 text-center text-xs text-muted-foreground">
                      {t("eventBoard.noUnits")}
                    </li>
                  ) : null}
                  {(capped ? column.units.slice(0, SHOWN) : column.units).map(
                    (unit, position) => (
                      <li
                        className={cn(
                          position === TEAM_LINE &&
                            "mt-0.5 border-t-2 border-dashed border-foreground/60 pt-0.5"
                        )}
                        key={unit.unitId}
                      >
                        <EventUnitChip
                          action={{
                            onActivate: () =>
                              onAddTeam(
                                laneId,
                                column.objectiveIndexes,
                                unit.unitId
                              ),
                            hint: t("eventBoard.addTeam"),
                            testId: "event-board-add-team",
                            tabIndex: grid.tabIndex(columnIndex, position),
                          }}
                          fill
                          unit={unit}
                        />
                      </li>
                    )
                  )}
                </ul>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {longest > SHOWN ? (
        <Button
          className="self-center"
          data-testid="event-board-show-all"
          onClick={() => setShowAll((all) => !all)}
          size="sm"
          type="button"
          variant="outline"
        >
          {showAll
            ? t("eventBoard.showBest", { count: SHOWN })
            : t("eventBoard.showAll", { count: longest })}
        </Button>
      ) : null}
    </div>
  )
}

const CELL = 'button[data-testid="event-board-add-team"]'

/**
 * The unit table's keyboard focus: the whole table is one Tab stop (the last focused unit, at first
 * the top of the first column), and the arrow keys move between units, Home and End to a column's
 * first and last. Without it a keyboard user tabs through every unit of every lane, hundreds on a
 * wide screen, before reaching the teams.
 */
function useBoardGridFocus(counts: readonly number[]) {
  const [active, setActive] = useState({ column: 0, row: 0 })
  // The remembered unit, kept inside the table as columns change or shrink (the best seven until "Show all").
  const stopColumn =
    (counts[active.column] ?? 0) > 0
      ? active.column
      : counts.findIndex((count) => count > 0)
  const stopRow =
    stopColumn === active.column
      ? Math.min(active.row, (counts[stopColumn] ?? 1) - 1)
      : 0
  const columnsOf = (grid: HTMLElement) => [
    ...grid.querySelectorAll<HTMLElement>(":scope > ul"),
  ]
  const positionOf = (grid: HTMLElement, target: EventTarget) => {
    if (!(target instanceof HTMLButtonElement) || !target.matches(CELL))
      return null
    const list = target.closest("ul")
    if (!list) return null
    const column = columnsOf(grid).indexOf(list)
    const row = [...list.querySelectorAll(CELL)].indexOf(target)
    return column < 0 || row < 0 ? null : { column, row }
  }
  const nextColumn = (from: number, step: 1 | -1) => {
    for (
      let column = from + step;
      column >= 0 && column < counts.length;
      column += step
    ) {
      if ((counts[column] ?? 0) > 0) return column
    }
    return from
  }
  return {
    tabIndex: (column: number, row: number) =>
      column === stopColumn && row === stopRow ? 0 : -1,
    onFocus: (event: FocusEvent<HTMLDivElement>) => {
      const at = positionOf(event.currentTarget, event.target)
      if (at && (at.column !== active.column || at.row !== active.row))
        setActive(at)
    },
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      const at = positionOf(event.currentTarget, event.target)
      if (!at) return
      const last = (column: number) => (counts[column] ?? 1) - 1
      let next: { column: number; row: number }
      switch (event.key) {
        case "ArrowDown":
          next = { ...at, row: Math.min(at.row + 1, last(at.column)) }
          break
        case "ArrowUp":
          next = { ...at, row: Math.max(at.row - 1, 0) }
          break
        case "ArrowRight":
        case "ArrowLeft": {
          const column = nextColumn(
            at.column,
            event.key === "ArrowRight" ? 1 : -1
          )
          next = { column, row: Math.min(at.row, last(column)) }
          break
        }
        case "Home":
          next = { ...at, row: 0 }
          break
        case "End":
          next = { ...at, row: last(at.column) }
          break
        default:
          return
      }
      event.preventDefault()
      setActive(next)
      const cells = columnsOf(event.currentTarget)[
        next.column
      ]?.querySelectorAll<HTMLButtonElement>(CELL)
      cells?.[next.row]?.focus()
    },
  }
}

/** One table heading: an objective (or the selected ones, merged) with its points, its synced
 *  cleared count and a dashed edge when no saved team covers it; pressing it selects it. */
function ObjectiveHeading({
  id,
  entries,
  selected,
  showCoverage,
  onToggle,
}: {
  id: string
  entries: EventBoardObjective[]
  selected: readonly number[]
  showCoverage: boolean
  onToggle: (index: number) => void
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const number = new Intl.NumberFormat(i18n.language)
  const merged = entries.length > 1
  return (
    <div
      id={id}
      className={cn(
        "flex min-w-0 flex-col gap-px",
        merged && "rounded-md bg-primary/10"
      )}
    >
      {entries.map((entry) => {
        const { label, icon } = objectiveLabel(entry.objective)
        const uncovered = showCoverage && entry.coveringTeams === 0
        const isSelected = selected.includes(entry.objective.index)
        const cleared =
          entry.cleared === null
            ? undefined
            : t("eventBoard.cleared", {
                cleared: number.format(entry.cleared),
                total: number.format(entry.battles),
              })
        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              "relative flex min-w-0 flex-col items-center gap-0.5 rounded-md border border-transparent px-0.5 py-1 text-center transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              uncovered && "border-dashed border-muted-foreground/60",
              isSelected && "bg-primary/15"
            )}
            data-testid="event-board-objective"
            data-uncovered={uncovered ? "true" : undefined}
            key={entry.objective.index}
            onClick={() => onToggle(entry.objective.index)}
            title={[label, cleared, uncovered ? t("eventBoard.noTeam") : ""]
              .filter(Boolean)
              .join(" · ")}
            type="button"
          >
            {isSelected ? (
              <Check
                aria-hidden="true"
                className="absolute top-0.5 right-0.5 size-3 text-primary"
              />
            ) : null}
            <span className="text-xs font-semibold tabular-nums">
              {number.format(entry.objective.points)}
            </span>
            <ObjectiveIcon className="size-5" icon={icon} />
            {entry.cleared === null ? null : (
              <span
                aria-hidden="true"
                className="text-xs text-muted-foreground tabular-nums"
              >
                {number.format(entry.cleared)}/{number.format(entry.battles)}
              </span>
            )}
            <span className="line-clamp-2 text-xs/tight">{label}</span>
            {cleared ? <span className="sr-only">{cleared}</span> : null}
            {uncovered ? (
              <span className="text-xs text-muted-foreground">
                {t("eventBoard.noTeam")}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
