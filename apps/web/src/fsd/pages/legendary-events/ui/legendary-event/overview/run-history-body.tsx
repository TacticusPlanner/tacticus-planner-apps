import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type {
  RunHistory,
  RunHistoryLane,
  RunHistoryTeam,
} from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { RUN_COUNT } from "./last-run.view-model"
import { RunHistoryDeltas } from "./run-history-deltas"
import { useRunDate } from "./use-run-date"

/** One record's history (the Last run card and each Earlier runs entry): run, date and event
 *  points, the lanes with their teams, then the roster changes since. */
export function RunHistoryBody({
  history,
  isMobile,
  since,
}: {
  history: RunHistory
  isMobile: boolean
  since: "last" | "then"
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const date = useRunDate(history.progressAt)
  return (
    <div className="flex min-w-0 flex-col gap-4" data-testid="last-run-body">
      <p
        className="flex flex-wrap gap-x-2 text-sm"
        data-testid="last-run-summary"
      >
        <span className="font-semibold" data-testid="last-run-run">
          {t("history.run", { run: history.run, total: RUN_COUNT })}
        </span>
        <span className="text-muted-foreground" data-testid="last-run-date">
          {date}
        </span>
        <span data-testid="last-run-points">
          {t("history.points", { points: number.format(history.points) })}
        </span>
      </p>
      {history.teamCount === 0 ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="last-run-no-teams"
        >
          {t("history.noTeams")}
        </p>
      ) : null}
      <ul
        className={cn(
          "grid min-w-0 gap-3",
          isMobile ? "grid-cols-1" : "grid-cols-3"
        )}
        data-layout={isMobile ? "stacked" : "columns"}
        data-testid="last-run-lanes"
      >
        {history.lanes.map((lane) => (
          <LaneHistory
            isMobile={isMobile}
            key={lane.laneId}
            lane={lane}
            showTeams={history.teamCount > 0}
          />
        ))}
      </ul>
      <RunHistoryDeltas history={history} since={since} />
    </div>
  )
}

function LaneHistory({
  lane,
  isMobile,
  showTeams,
}: {
  lane: RunHistoryLane
  isMobile: boolean
  showTeams: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const [open, setOpen] = useState(false)
  const teamsId = useId()
  const laneName = t(`lanes.${lane.laneId}`)
  const progress =
    lane.clearedBattle > 0
      ? t("history.lane.battle", { battle: lane.clearedBattle })
      : t("history.lane.noBattle")
  const summary =
    lane.points === null
      ? t("history.lane.summary", { lane: laneName, progress })
      : t("history.lane.summaryPoints", {
          lane: laneName,
          progress,
          points: number.format(lane.points),
        })
  const teams =
    lane.teams.length === 0 ? (
      <p className="text-xs text-muted-foreground">
        {t("history.lane.noTeams")}
      </p>
    ) : (
      <ul className="flex min-w-0 flex-col gap-2" id={teamsId}>
        {lane.teams.map((entry) => (
          <TeamHistory entry={entry} key={entry.team.teamId} />
        ))}
      </ul>
    )
  return (
    <li
      className="flex min-w-0 flex-col gap-2 rounded-lg border p-2"
      data-lane={lane.laneId}
      data-testid="last-run-lane"
    >
      <p
        className="text-sm font-medium tabular-nums"
        data-testid="last-run-lane-summary"
      >
        {summary}
      </p>
      {showTeams ? (
        isMobile && lane.teams.length > 0 ? (
          <>
            <ToggleButton
              controls={teamsId}
              label={t("history.lane.teamsToggle", {
                teams: lane.teams.length,
              })}
              onToggle={() => setOpen(!open)}
              open={open}
              testId="last-run-lane-teams-toggle"
            />
            {open ? teams : null}
          </>
        ) : (
          teams
        )
      ) : null}
    </li>
  )
}

function TeamHistory({ entry }: { entry: RunHistoryTeam }) {
  const { t } = useTranslation("legendaryEvents")
  const unitName = useUnitName()
  const { team } = entry
  const unitIds = [
    ...team.memberUnitIds,
    ...(team.reserveUnitId ? [team.reserveUnitId] : []),
  ]
  const cleared =
    entry.clearedBattle > 0
      ? t("history.team.cleared", { battle: entry.clearedBattle })
      : t("history.team.noBattle")
  return (
    <li
      className="flex min-w-0 flex-col gap-1"
      data-team={team.teamId}
      data-testid="last-run-team"
    >
      <span className="truncate text-sm font-medium">{team.name}</span>
      <ul className="flex flex-wrap gap-1" data-testid="last-run-team-members">
        {unitIds.map((unitId) => {
          const name = unitName("Character", unitId)
          return (
            <li data-unit={unitId} key={unitId} title={name}>
              <EntityIcon
                alt={name}
                className={cn(
                  "size-7 rounded-full",
                  unitId === team.reserveUnitId && "border border-dashed"
                )}
                src={characterIcon(unitId as UnitId)}
              />
            </li>
          )
        })}
      </ul>
      <span
        className="text-xs text-muted-foreground tabular-nums"
        data-testid="last-run-team-cleared"
      >
        {entry.plannedDepth === null
          ? cleared
          : t("history.team.clearedPlanned", {
              cleared,
              planned: entry.plannedDepth,
            })}
      </span>
    </li>
  )
}

/** A disclosure toggle; `controls` is the id of the region it shows, rendered only while open. */
export function ToggleButton({
  label,
  open,
  onToggle,
  controls,
  testId,
}: {
  label: string
  open: boolean
  onToggle: () => void
  controls: string
  testId: string
}) {
  return (
    <Button
      // Only while open: the controlled region is not rendered while collapsed.
      aria-controls={open ? controls : undefined}
      aria-expanded={open}
      className="h-auto justify-start gap-1 self-start px-1 py-0.5"
      data-testid={testId}
      onClick={onToggle}
      size="sm"
      type="button"
      variant="ghost"
    >
      <ChevronDown
        className={cn("size-4 transition-transform", !open && "-rotate-90")}
      />
      {label}
    </Button>
  )
}
