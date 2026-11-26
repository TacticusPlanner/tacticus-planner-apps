import { Suspense, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pencil, Plus } from "lucide-react"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { useCreateGoalLauncher } from "@/entities/goal"
import {
  TeamIssueList,
  TeamUnitPortrait,
  teamUnitView,
  useSurvivalEventName,
  useTeamRoster,
  useTeams,
} from "@/entities/team"
import type { Team } from "@/entities/team"
import {
  TEAM_EDITOR_NAMESPACES,
  TeamEditorDialog,
} from "@/features/team-editor"
import {
  useGoalLabels,
  useLegendaryEventGoalTargets,
} from "@/features/legendary-event-goals"
import { EmptyState } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { useSurvivalContext } from "../model/survival-context"

const HORDE = ["horde"] as const

interface LineupUnit {
  kind: "character" | "mow"
  unitId: string
  featured: boolean
}

/** The event's team: the featured hero first (always fights, not counted), then the saved units. */
function lineupOf(featuredId: string, team: Team | undefined): LineupUnit[] {
  return [
    { kind: "character", unitId: featuredId, featured: true },
    ...(team?.characterIds ?? []).map((unitId) => ({
      kind: "character" as const,
      unitId,
      featured: false,
    })),
    ...(team?.mowIds ?? []).map((unitId) => ({
      kind: "mow" as const,
      unitId,
      featured: false,
    })),
  ]
}

/** The lineup band: each unit at `portrait-md` with its name, the featured hero badged. */
function Lineup({ units }: { units: readonly LineupUnit[] }) {
  const { t } = useTranslation("survival")
  const roster = useTeamRoster()
  const unitName = useUnitName()
  const rosterData = roster.status === "ready" ? roster.data : null
  return (
    <ul
      className="grid grid-cols-5 gap-3 sm:flex sm:flex-wrap"
      data-testid="survival-lineup"
    >
      {units.map((unit) => {
        const name = unitName(
          unit.kind === "mow" ? "Mow" : "Character",
          unit.unitId
        )
        return (
          <li
            className="flex w-full min-w-0 flex-col items-center gap-1 text-center sm:w-20"
            data-featured={unit.featured ? "true" : undefined}
            data-testid="survival-lineup-unit"
            key={`${unit.kind}-${unit.unitId}`}
          >
            <TeamUnitPortrait
              size="portrait-md"
              unit={teamUnitView(unit.kind, unit.unitId, rosterData)}
            />
            <span className="line-clamp-2 text-xs">{name}</span>
            {unit.featured ? (
              <Badge variant="secondary">{t("team.featured")}</Badge>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * "Goals for this team" (plan option 8): each lineup unit with its active goals and a Create goal that
 * opens the goal sheet with the unit picked.
 */
function TeamGoals({ units }: { units: readonly LineupUnit[] }) {
  const { t } = useTranslation("survival")
  const unitName = useUnitName()
  const launchCreateGoal = useCreateGoalLauncher()
  const goalLabels = useGoalLabels()
  const unitIds = useMemo(
    () => new Set(units.map((unit) => unit.unitId)),
    [units]
  )
  const targets = useLegendaryEventGoalTargets(unitIds)
  const roster = useTeamRoster()
  const rosterData = roster.status === "ready" ? roster.data : null
  return (
    <section className="flex flex-col gap-2" data-testid="survival-goals">
      <h2 className="text-base font-semibold">{t("team.goals")}</h2>
      {targets.status === "loading" ? (
        <Skeleton className="h-24 w-full" />
      ) : targets.status === "failed" ? (
        <p className="text-sm text-destructive">{t("team.goalsFailed")}</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {units.map((unit) => {
            const name = unitName(
              unit.kind === "mow" ? "Mow" : "Character",
              unit.unitId
            )
            const lines = goalLabels.badgeLines(targets.byUnit.get(unit.unitId))
            return (
              <li
                className="flex items-center gap-3 rounded-lg border bg-card p-2"
                data-testid="survival-goal-unit"
                key={`${unit.kind}-${unit.unitId}`}
              >
                <TeamUnitPortrait
                  unit={teamUnitView(unit.kind, unit.unitId, rosterData)}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {lines.length > 0 ? lines.join(" · ") : t("team.noGoals")}
                  </span>
                </span>
                <Button
                  aria-label={t("team.createGoalFor", { name })}
                  onClick={() =>
                    launchCreateGoal({
                      entityType: unit.kind === "mow" ? "Mow" : "Character",
                      entityId: unit.unitId as UnitId,
                    })
                  }
                  size="sm"
                  variant="outline"
                >
                  <Plus aria-hidden />
                  {t("team.createGoal")}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/**
 * Team (plan options 4, 6 and 8): the event's saved team (a Horde team tied to the event) as a lineup
 * band behind the featured hero, Create team or Edit team opening the shared team editor with the
 * event's rules, the rules the team breaks, and goals for its units.
 */
export function TeamTab() {
  const { t, i18n } = useTranslation("survival")
  const { event } = useSurvivalContext()
  const eventName = useSurvivalEventName()
  const teamsQuery = useTeams()
  const [editorOpen, setEditorOpen] = useState(false)
  // The editor's copy (filters, factions, traits) loads with the tab.
  useEffect(() => {
    void i18n.loadNamespaces([...TEAM_EDITOR_NAMESPACES])
  }, [i18n])

  const teams = teamsQuery.data?.teams ?? []
  const team = teams.find((entry) => entry.survivalEventKey === event.id)
  const units = lineupOf(event.featuredCharacterId, team)
  const characters = team?.characterIds.length ?? 0

  let body
  if (teamsQuery.isPending) {
    body = <Skeleton className="h-32 w-full" />
  } else if (teamsQuery.isError) {
    body = (
      <p className="text-sm text-destructive" role="alert">
        {t("team.loadError")}
      </p>
    )
  } else {
    body = (
      <>
        <Lineup units={units} />
        {team ? (
          team.issues.length > 0 ? (
            <TeamIssueList codes={team.issues} team={team} />
          ) : null
        ) : (
          <EmptyState
            actions={
              <Button onClick={() => setEditorOpen(true)} variant="outline">
                <Plus aria-hidden />
                {t("team.create")}
              </Button>
            }
            testId="survival-no-team"
            title={t("team.none")}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground tabular-nums">
            {t("team.count", {
              count: characters,
              max: event.rules.maxCharacters,
            })}
          </p>
          {team ? (
            <Button
              data-testid="survival-edit-team"
              onClick={() => setEditorOpen(true)}
              size="sm"
              variant="outline"
            >
              <Pencil aria-hidden />
              {t("team.edit")}
            </Button>
          ) : null}
        </div>
        {body}
      </section>
      <TeamGoals units={units} />
      {editorOpen ? (
        // Its own boundary: the editor's copy still loading suspends it, never the page.
        <Suspense fallback={null}>
          <TeamEditorDialog
            newTeamModes={HORDE}
            newTeamName={t("team.newName", { name: eventName(event.id) })}
            newTeamSurvivalEventKey={event.id}
            onClose={() => setEditorOpen(false)}
            team={team ?? null}
            teams={teams}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
