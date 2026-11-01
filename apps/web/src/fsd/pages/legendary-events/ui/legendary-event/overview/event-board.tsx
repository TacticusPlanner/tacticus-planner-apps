import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import {
  LEGENDARY_EVENT_LANE_IDS,
  ObjectiveIcon,
  useLaneAllowedRule,
  useObjectiveLabel,
  useTeamDisplayName,
  type LegendaryEvent,
  type LegendaryEventLaneId,
  type LegendaryEventTeam,
} from "@/entities/legendary-event"
import { laneTeams } from "@/features/legendary-event-plan"
import { EntityIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { ProgressGridViewModel } from "../legendary-event-page.view-model"
import type { TeamsSectionState } from "../teams/teams.view-model"

import {
  buildEventBoardLane,
  type EventBoardLane,
  type EventBoardObjective,
  type EventBoardTeam,
} from "./event-board.view-model"

/**
 * The Overview Event board (behind the `LreEventBoard` flag): every lane at once, side by side
 * from 1024px and stacked below, each with its rule, its objectives (points, synced cleared
 * count, and a "No team" mark when no saved team covers one) and its saved teams as compact rows.
 * A team row opens the page's team editor; a lane heading opens that lane's tab.
 */
export function EventBoard({
  event,
  teams,
  progressGrid,
  onOpenLane,
  onOpenTeam,
}: {
  event: LegendaryEvent
  teams: TeamsSectionState
  progressGrid: ProgressGridViewModel
  onOpenLane: (laneId: LegendaryEventLaneId) => void
  onOpenTeam: (laneId: LegendaryEventLaneId, team: LegendaryEventTeam) => void
}) {
  const { t } = useTranslation("legendaryEvents")
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
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold" id="legendary-event-board-title">
          {t("eventBoard.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("eventBoard.description")}
        </p>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-3">
        {LEGENDARY_EVENT_LANE_IDS.map((laneId) => (
          <EventBoardColumn
            board={lanes[laneId]}
            event={event}
            key={laneId}
            laneId={laneId}
            onOpenLane={onOpenLane}
            onOpenTeam={onOpenTeam}
            teamsState={teams}
          />
        ))}
      </div>
    </section>
  )
}

function EventBoardColumn({
  event,
  laneId,
  board,
  teamsState,
  onOpenLane,
  onOpenTeam,
}: {
  event: LegendaryEvent
  laneId: LegendaryEventLaneId
  board: EventBoardLane
  teamsState: TeamsSectionState
  onOpenLane: (laneId: LegendaryEventLaneId) => void
  onOpenTeam: (laneId: LegendaryEventLaneId, team: LegendaryEventTeam) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const allowedRule = useLaneAllowedRule()
  const displayName = useTeamDisplayName()
  const lane = event[laneId]
  const laneName = t(`lanes.${laneId}`)
  const rule = allowedRule(lane)
  const savedTeams = board.teams.map((entry) => entry.team)
  const teamsReady = teamsState.kind === "ready"
  return (
    <Card
      className="min-w-0 gap-3 py-3"
      data-lane={laneId}
      data-testid="event-board-lane"
    >
      <CardHeader className="px-3">
        <CardTitle>
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
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3 px-3">
        <ul
          aria-label={t("laneOverview.objectives")}
          className="flex flex-col gap-1"
        >
          {board.objectives.map((entry) => (
            <ObjectiveLine
              entry={entry}
              key={entry.objective.index}
              showCoverage={teamsReady}
            />
          ))}
        </ul>
        {teamsState.kind === "hidden" ? null : (
          <div className="flex min-w-0 flex-col gap-1.5 border-t pt-3">
            <h4 className="text-sm font-medium">
              {teamsReady
                ? t("eventBoard.teams", { count: board.teams.length })
                : t("teams.title")}
            </h4>
            {teamsState.kind === "loading" ? (
              <Skeleton className="h-16 w-full rounded-lg" />
            ) : null}
            {teamsState.kind === "error" ? (
              <p className="text-sm text-destructive">{t("teams.loadError")}</p>
            ) : null}
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

function ObjectiveLine({
  entry,
  showCoverage,
}: {
  entry: EventBoardObjective
  showCoverage: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const number = new Intl.NumberFormat(i18n.language)
  const { label, icon } = objectiveLabel(entry.objective)
  const uncovered = showCoverage && entry.coveringTeams === 0
  return (
    <li
      className={cn(
        "flex min-w-0 items-center gap-1.5 rounded-md border px-1.5 py-1 text-sm",
        uncovered && "border-dashed"
      )}
      data-testid="event-board-objective"
      data-uncovered={uncovered ? "true" : undefined}
    >
      <ObjectiveIcon className="size-5" icon={icon} />
      <span className="min-w-0 flex-1 truncate" title={label}>
        {label}
      </span>
      <span className="font-semibold tabular-nums">
        {number.format(entry.objective.points)}
      </span>
      {entry.cleared === null ? null : (
        <span
          className="w-12 text-right text-xs text-muted-foreground tabular-nums"
          title={t("eventBoard.cleared", {
            cleared: number.format(entry.cleared),
            total: number.format(entry.battles),
          })}
        >
          <span aria-hidden="true">
            {number.format(entry.cleared)}/{number.format(entry.battles)}
          </span>
          <span className="sr-only">
            {t("eventBoard.cleared", {
              cleared: number.format(entry.cleared),
              total: number.format(entry.battles),
            })}
          </span>
        </span>
      )}
      {uncovered ? (
        <span className="shrink-0 rounded-full border border-dashed px-1.5 text-xs text-muted-foreground">
          {t("eventBoard.noTeam")}
        </span>
      ) : null}
    </li>
  )
}

function TeamLine({
  entry,
  lane,
  name,
  onOpen,
}: {
  entry: EventBoardTeam
  lane: LegendaryEvent[LegendaryEventLaneId]
  name: string
  onOpen: () => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const unitName = useUnitName()
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
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="flex min-w-0 flex-wrap items-center gap-1">
          {entry.team.memberUnitIds.map((unitId) => (
            <EntityIcon
              alt={unitName("Character", unitId)}
              className="size-7 rounded-full"
              key={unitId}
              src={characterIcon(unitId as UnitId)}
            />
          ))}
          {covered.length > 0 ? (
            <span className="ml-auto flex items-center gap-0.5">
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
      </button>
    </li>
  )
}
