import { useCallback, useId, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronRight } from "lucide-react"
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
  useTeamDisplayName,
  type LegendaryEvent,
  type LegendaryEventLaneId,
  type LegendaryEventRosterUnit,
  type LegendaryEventTeam,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"
import { laneTeams } from "@/features/legendary-event-plan"
import { usePersistedSelection } from "@/shared/lib"
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
  eventBoardUnit,
  isVisibleLanesValue,
  parseVisibleLanes,
  serializeVisibleLanes,
  type EventBoardLane,
  type EventBoardObjective,
  type EventBoardTableColumn,
  type EventBoardTeam,
} from "./event-board.view-model"
import { EventBoardUnitChip } from "./event-board-unit-chip"

/** The best-five line: V1 drew a dashed rule under the fifth unit of every column. */
const TEAM_LINE = 5

const VISIBLE_LANES_KEY = "legendaryEvents.eventBoard.lanes"
const ALL_LANES = serializeVisibleLanes(LEGENDARY_EVENT_LANE_IDS)

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
 * The Overview Event board, as V1's Teams tab: every shown lane side by side from 1024px (stacked
 * below), each with its rule, a unit table (one column per objective listing the allowed units
 * that satisfy it, strongest owned first, coloured by rank, with a dashed line under the best
 * five) and its saved teams with each member's rank, stars and ability levels. Lane switches hide
 * lanes (kept per browser); picking objective headings merges them into one column of the units
 * satisfying all of them. A unit starts a new team, a team row opens the team editor and a lane
 * heading opens that lane's tab.
 */
export function EventBoard({
  event,
  teams,
  progressGrid,
  unitPower,
  catalog,
  onOpenLane,
  onOpenTeam,
  onAddTeam,
}: {
  event: LegendaryEvent
  teams: TeamsSectionState
  progressGrid: ProgressGridViewModel
  unitPower: TeamPowerSource
  catalog: EventBoardCatalog
  onOpenLane: (laneId: LegendaryEventLaneId) => void
  onOpenTeam: (laneId: LegendaryEventLaneId, team: LegendaryEventTeam) => void
  onAddTeam: AddBoardTeam
}) {
  const { t } = useTranslation("legendaryEvents")
  const [visibleRaw, setVisibleRaw] = usePersistedSelection(
    VISIBLE_LANES_KEY,
    isVisibleLanesValue,
    ALL_LANES
  )
  const visibleLanes = parseVisibleLanes(visibleRaw)
  const toggleLane = (laneId: LegendaryEventLaneId, shown: boolean) => {
    const next = shown
      ? [...visibleLanes, laneId]
      : visibleLanes.filter((id) => id !== laneId)
    // The last shown lane stays: an empty board would hide the switches' purpose.
    if (next.length > 0) setVisibleRaw(serializeVisibleLanes(next))
  }
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
        <LaneSwitches onToggle={toggleLane} visibleLanes={visibleLanes} />
      </div>
      <div
        className={cn(
          "grid min-w-0 grid-cols-1 gap-3",
          LANE_GRID[visibleLanes.length]
        )}
      >
        {visibleLanes.map((laneId) => (
          <EventBoardColumn
            board={lanes[laneId]}
            catalog={catalog}
            event={event}
            key={laneId}
            laneId={laneId}
            onAddTeam={onAddTeam}
            onClearObjectives={clearObjectives}
            onOpenLane={onOpenLane}
            onOpenTeam={onOpenTeam}
            onToggleObjective={toggleObjective}
            selected={selection[laneId] ?? []}
            teamsState={teams}
            unitPower={unitPower}
          />
        ))}
      </div>
    </section>
  )
}

function LaneSwitches({
  visibleLanes,
  onToggle,
}: {
  visibleLanes: readonly LegendaryEventLaneId[]
  onToggle: (laneId: LegendaryEventLaneId, shown: boolean) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const id = useId()
  return (
    <div
      aria-label={t("eventBoard.lanesShown")}
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
      role="group"
    >
      {LEGENDARY_EVENT_LANE_IDS.map((laneId) => {
        const shown = visibleLanes.includes(laneId)
        return (
          <div className="flex items-center gap-2" key={laneId}>
            <Switch
              checked={shown}
              data-testid="event-board-lane-switch"
              disabled={shown && visibleLanes.length === 1}
              id={`${id}-${laneId}`}
              onCheckedChange={(checked) => onToggle(laneId, checked)}
            />
            <Label htmlFor={`${id}-${laneId}`}>{t(`lanes.${laneId}`)}</Label>
          </div>
        )
      })}
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
  onToggleObjective,
  onClearObjectives,
  onOpenLane,
  onOpenTeam,
  onAddTeam,
}: {
  event: LegendaryEvent
  laneId: LegendaryEventLaneId
  board: EventBoardLane
  teamsState: TeamsSectionState
  unitPower: TeamPowerSource
  catalog: EventBoardCatalog
  selected: readonly number[]
  onToggleObjective: (laneId: LegendaryEventLaneId, index: number) => void
  onClearObjectives: (laneId: LegendaryEventLaneId) => void
  onOpenLane: (laneId: LegendaryEventLaneId) => void
  onOpenTeam: (laneId: LegendaryEventLaneId, team: LegendaryEventTeam) => void
  onAddTeam: AddBoardTeam
}) {
  const { t } = useTranslation("legendaryEvents")
  const allowedRule = useLaneAllowedRule()
  const displayName = useTeamDisplayName()
  const unitName = useUnitName()
  const lane = event[laneId]
  const laneName = t(`lanes.${laneId}`)
  const rule = allowedRule(lane)
  const savedTeams = board.teams.map((entry) => entry.team)
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
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-3">
        <CardTitle className="min-w-0">
          <h3>
            <button
              aria-label={t("eventBoard.openLane", { lane: laneName })}
              className="flex max-w-full items-center gap-1 rounded-md text-left hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              onClick={() => onOpenLane(laneId)}
              type="button"
            >
              <span className="truncate">
                {rule
                  ? t("laneOverview.labelWithRule", { lane: laneName, rule })
                  : laneName}
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
            </button>
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
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3 px-3">
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
          <div className="flex min-w-0 flex-col gap-1.5 border-t pt-3">
            <h4 className="text-sm font-medium">
              {teamsReady
                ? t("eventBoard.teams", { count: board.teams.length })
                : t("teams.title")}
            </h4>
            {teamsReady && board.teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("eventBoard.noTeams")}
              </p>
            ) : null}
            {teamsReady && board.teams.length > 0 ? (
              <ul className="flex min-w-0 flex-col gap-1">
                {board.teams.map((entry) => (
                  <TeamLine
                    entry={entry}
                    key={entry.team.id}
                    lane={lane}
                    name={displayName(entry.team, lane, savedTeams)}
                    onOpen={() => onOpenTeam(laneId, entry.team)}
                    rosterById={rosterById}
                  />
                ))}
              </ul>
            ) : null}
          </div>
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
  const headingFor = (indexes: readonly number[]) =>
    `${headingId}-${indexes.join("+")}`
  // Before the units load the headings still show every objective, one column each.
  const headings =
    columns?.map((column) => column.objectiveIndexes) ??
    [...objectivesByIndex.keys()].map((index) => [index])
  const template = {
    gridTemplateColumns: `repeat(${headings.length}, minmax(5.5rem, 1fr))`,
  }
  return (
    <div
      className="max-h-[34rem] min-w-0 overflow-auto rounded-md border"
      data-testid="event-board-table"
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
        <p className="p-2 text-sm text-destructive">{t("teams.loadError")}</p>
      ) : null}
      {columns ? (
        <div className="grid gap-px p-px" style={template}>
          {columns.map((column) => (
            <ul
              aria-describedby={headingFor(column.objectiveIndexes)}
              aria-label={t("eventBoard.columnUnits", {
                count: column.units.length,
              })}
              className="flex min-w-0 flex-col gap-px"
              data-testid="event-board-column"
              key={column.objectiveIndexes.join("+")}
            >
              {column.units.length === 0 ? (
                <li className="p-1 text-center text-xs text-muted-foreground">
                  {t("eventBoard.noUnits")}
                </li>
              ) : null}
              {column.units.map((unit, position) => (
                <li
                  className={cn(
                    position === TEAM_LINE &&
                      "mt-0.5 border-t-2 border-dashed border-foreground/60 pt-0.5"
                  )}
                  key={unit.unitId}
                >
                  <button
                    className="block w-full rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    data-testid="event-board-add-team"
                    onClick={() =>
                      onAddTeam(laneId, column.objectiveIndexes, unit.unitId)
                    }
                    title={t("eventBoard.addTeam")}
                    type="button"
                  >
                    <EventBoardUnitChip
                      className="hover:brightness-110"
                      unit={unit}
                    />
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </div>
      ) : null}
    </div>
  )
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
              "relative flex min-w-0 flex-col items-center gap-0.5 rounded-md border border-transparent px-0.5 py-1 text-center transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
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
                className="text-[10px] text-muted-foreground tabular-nums"
              >
                {number.format(entry.cleared)}/{number.format(entry.battles)}
              </span>
            )}
            <span className="line-clamp-2 text-[11px] leading-tight">
              {label}
            </span>
            {cleared ? <span className="sr-only">{cleared}</span> : null}
            {uncovered ? (
              <span className="text-[10px] text-muted-foreground">
                {t("eventBoard.noTeam")}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

function TeamLine({
  entry,
  lane,
  name,
  rosterById,
  onOpen,
}: {
  entry: EventBoardTeam
  lane: LegendaryEvent[LegendaryEventLaneId]
  name: string
  rosterById: ReturnType<typeof rosterMap> | undefined
  onOpen: () => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const covered = entry.coveredObjectiveIndexes
    .map((index) =>
      lane.unitsRestrictions.find((objective) => objective.index === index)
    )
    .filter((objective) => objective !== undefined)
  return (
    <li className="min-w-0">
      <button
        aria-label={t("eventBoard.editTeam", { name })}
        className="flex w-full min-w-0 flex-col gap-1 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        data-testid="event-board-team"
        onClick={onOpen}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {name}
          </span>
          {covered.length > 0 ? (
            <span className="flex shrink-0 items-center gap-0.5">
              {covered.map((objective) => {
                const { label, icon } = objectiveLabel(objective)
                return (
                  <span key={objective.index} title={label}>
                    <ObjectiveIcon className="size-4" icon={icon} />
                    <span className="sr-only">{label}</span>
                  </span>
                )
              })}
            </span>
          ) : null}
        </span>
        <span className="flex min-w-0 flex-wrap items-center gap-1 pt-1.5">
          {entry.team.memberUnitIds.map((unitId) => (
            <EventBoardUnitChip
              key={unitId}
              showStars
              unit={eventBoardUnit(unitId, rosterById)}
            />
          ))}
        </span>
      </button>
    </li>
  )
}
