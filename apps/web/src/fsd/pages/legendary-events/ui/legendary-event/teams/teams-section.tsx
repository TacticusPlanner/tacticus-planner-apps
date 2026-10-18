import { useId, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Sparkles } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  buildLanePointsModel,
  useTeamDisplayName,
  type LaneProgressView,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
  type LegendaryEventRun,
  type LegendaryEventTeam,
  type TeamSuggestion,
} from "@/entities/legendary-event"
import { TeamSuggestionsDialog } from "@/features/legendary-event-team-suggestions"
import {
  laneTeams,
  type LegendaryEventPlanActions,
  type PickerGoalsPreview,
} from "@/features/legendary-event-teams"
import { ConfirmationDialog, SortableList } from "@/shared/ui"

import {
  laneEstimateInputs,
  type ClearEstimatesViewModel,
} from "../legendary-event-page.view-model"
import {
  teamLastRunClearedBattle,
  type LastRunClears,
} from "../overview/last-run.view-model"

import { TeamCard, type TeamCardActions } from "./team-card"
import type { TeamEditorLauncher } from "./team-editor-launcher"
import { TeamsEmptyState } from "./teams-empty-state"
import {
  buildTeamCardViewModel,
  moveTargets,
  rosterMap,
  type TeamCardViewModel,
  type TeamPowerSource,
  type TeamsSectionState,
} from "./teams.view-model"

type TeamsActions = Pick<
  LegendaryEventPlanActions,
  | "createTeam"
  | "updateTeam"
  | "deleteTeam"
  | "reorderLane"
  | "setDepth"
  | "restoreEstimate"
>

/** The Teams section's goal integration (Stage 6): badges, Prefer units with goals and the
 *  picker's Goals Preview. */
interface TeamsGoalsViewModel {
  goalLines: (unitId: string) => readonly string[]
  goalUnitIds: ReadonlySet<string>
  pickerPreview: (laneId: LegendaryEventLaneId) => PickerGoalsPreview
}

/** The page's Teams data (design D2): the section state, the current run, the plan actions and
 *  the clear estimates, plus what Suggest teams reads (Stage 6). */
export interface TeamsViewModel {
  eventId: string
  state: TeamsSectionState
  run: LegendaryEventRun
  actions: TeamsActions
  estimates: ClearEstimatesViewModel
  /** The power data the cards' Team power reads. */
  unitPower: TeamPowerSource
  /** Synced progress per lane; undefined while it loads or failed (nothing counts as cleared). */
  progressByLane:
    Partial<Record<LegendaryEventLaneId, LaneProgressView>> | undefined
  goals: TeamsGoalsViewModel
  /** Each previous-run team's cleared battle (the card's last-run line); undefined while the run
   *  records load or when their read failed (no line). */
  lastRunClears: LastRunClears
}

/**
 * A lane's Teams section (design D5, D6), between the lane overview and the progress grid: one
 * card per team in stored order, an explicit Add team button, Suggest teams (also in the empty
 * state), delete confirmation, and reorder — drag on desktop, Move up / Move down in the card
 * menu on mobile. Add team, Edit and Use this team open the page's single editor through
 * `editor` (design D4). A suggestion opens the editor as a new team; cancelling it returns to the
 * suggestions.
 */
export function TeamsSection({
  laneId,
  lane,
  teams,
  isMobile,
  editor,
}: {
  laneId: LegendaryEventLaneId
  lane: LegendaryEventLane
  teams: TeamsViewModel
  isMobile: boolean
  /** The page's team editor. */
  editor: Pick<TeamEditorLauncher, "editor" | "openTeamEditor">
}) {
  const { t } = useTranslation("legendaryEvents")
  const [suggestCount, setSuggestCount] = useState(0)
  const [deleting, setDeleting] = useState<LegendaryEventTeam | null>(null)
  // The open Suggest teams dialog's mount key (null when closed): a fresh mount resets its toggles.
  const [suggesting, setSuggesting] = useState<number | null>(null)
  const suggestReasonId = useId()
  const { state, run, actions, estimates, unitPower } = teams
  const estimateTeam =
    estimates.kind === "ready" ? estimates.byLane[laneId].team : undefined
  const estimateInputs = laneEstimateInputs(estimates, laneId)
  const model = useMemo(() => buildLanePointsModel(lane), [lane])
  const savedTeams = useMemo(
    () => (state.kind === "ready" ? laneTeams(state.plan, laneId) : []),
    [state, laneId]
  )

  const displayName = useTeamDisplayName()
  const nameOf = (team: LegendaryEventTeam) =>
    displayName(team, lane, savedTeams)
  const rosterById = useMemo(
    () =>
      state.kind === "ready" && state.roster
        ? rosterMap(state.roster)
        : undefined,
    [state]
  )
  const cards = useMemo(
    () =>
      state.kind === "ready"
        ? savedTeams.map((team) => ({
            ...buildTeamCardViewModel(
              team,
              lane,
              state.units,
              state.roster,
              run,
              estimateTeam,
              unitPower,
              rosterById
            ),
            // Display only (spec: a team shows a readable name): the stored name stays as is.
            name: displayName(team, lane, savedTeams),
          }))
        : [],
    [
      state,
      savedTeams,
      lane,
      run,
      estimateTeam,
      unitPower,
      rosterById,
      displayName,
    ]
  )

  if (state.kind === "hidden") return null

  const openEditor = (team?: LegendaryEventTeam) =>
    editor.openTeamEditor({ laneId, team })
  const openSuggestions = () => {
    setSuggesting(suggestCount)
    setSuggestCount((count) => count + 1)
  }
  const acceptSuggestion = (suggestion: TeamSuggestion, rank: number) =>
    editor.openTeamEditor({
      laneId,
      memberUnitIds: suggestion.memberUnitIds,
      suggestionRank: rank,
    })
  const suggestButton = (testId: string) => (
    <Button
      aria-describedby={estimateInputs ? undefined : suggestReasonId}
      data-testid={testId}
      disabled={!estimateInputs}
      onClick={openSuggestions}
      size="sm"
      variant="outline"
    >
      <Sparkles />
      {t("suggestions.button")}
    </Button>
  )
  const ids = cards.map((card) => card.id)
  const lastRunOf = (teamId: string) =>
    teamLastRunClearedBattle(teams.lastRunClears, teamId, laneId)
  const cardActions = (card: TeamCardViewModel): TeamCardActions => {
    const moves = moveTargets(ids, card.id)
    return {
      onEdit: () => openEditor(card.team),
      onDelete: () => setDeleting(card.team),
      onDepthChange: (depth, shown) =>
        void actions.setDepth(card.team, depth, shown),
      onUseEstimate: (estimate) =>
        void actions.restoreEstimate(card.team, estimate),
      onMoveUp:
        isMobile && moves.up
          ? () => void actions.reorderLane(laneId, moves.up!)
          : null,
      onMoveDown:
        isMobile && moves.down
          ? () => void actions.reorderLane(laneId, moves.down!)
          : null,
    }
  }

  return (
    <section
      aria-labelledby="legendary-event-teams-title"
      className="flex min-w-0 scroll-mt-[calc(var(--mobile-header-height)+3rem)] flex-col gap-3 md:scroll-mt-4"
      data-lane={laneId}
      data-testid="legendary-event-teams"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold" id="legendary-event-teams-title">
          {t("teams.title")}
        </h2>
        {state.kind === "ready" ? (
          <div className="flex flex-wrap items-center gap-2">
            {estimateInputs ? null : (
              <span
                className="text-xs text-muted-foreground"
                id={suggestReasonId}
              >
                {t("suggestions.needsEstimates")}
              </span>
            )}
            {suggestButton("legendary-event-suggest-teams")}
            <Button
              data-testid="legendary-event-add-team"
              onClick={() => openEditor()}
              size="sm"
            >
              <Plus />
              {t("teams.add")}
            </Button>
          </div>
        ) : null}
      </div>

      {state.kind === "loading" ? (
        <div data-testid="legendary-event-teams-loading">
          <span className="sr-only">{t("teams.loading")}</span>
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      ) : null}

      {state.kind === "error" ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 p-3"
          data-testid="legendary-event-teams-error"
          role="alert"
        >
          <p className="text-sm text-destructive">{t("teams.loadError")}</p>
          <Button onClick={state.retry} size="sm" variant="outline">
            {t("teams.retry")}
          </Button>
        </div>
      ) : null}

      {state.kind === "ready" && cards.length === 0 ? (
        <TeamsEmptyState laneId={laneId}>
          {estimateInputs
            ? suggestButton("legendary-event-suggest-teams-empty")
            : null}
        </TeamsEmptyState>
      ) : null}

      {state.kind === "ready" && cards.length > 0 ? (
        <ul className="flex min-w-0 flex-col gap-3" data-testid="team-list">
          {isMobile ? (
            cards.map((card) => (
              <TeamCard
                actions={cardActions(card)}
                card={card}
                key={card.id}
                lane={lane}
                lastRunClearedBattle={lastRunOf(card.id)}
              />
            ))
          ) : (
            <SortableList
              getId={(card) => card.id}
              items={cards}
              onReorder={(orderedIds) =>
                void actions.reorderLane(laneId, orderedIds)
              }
              renderItem={(card, sortable) => (
                <TeamCard
                  actions={cardActions(card)}
                  card={card}
                  lane={lane}
                  lastRunClearedBattle={lastRunOf(card.id)}
                  sortable={sortable}
                />
              )}
            />
          )}
        </ul>
      ) : null}

      {state.kind === "ready" && suggesting !== null ? (
        <TeamSuggestionsDialog
          goalLines={teams.goals.goalLines}
          key={suggesting}
          onClose={() => setSuggesting(null)}
          onUseSuggestion={acceptSuggestion}
          open={editor.editor?.suggestionRank === undefined}
          source={{
            eventId: teams.eventId,
            laneId,
            lane,
            units: state.units,
            teams: savedTeams,
            run,
            model,
            progress: teams.progressByLane?.[laneId],
            estimates: estimateInputs,
            goalUnitIds: teams.goals.goalUnitIds,
          }}
        />
      ) : null}

      <ConfirmationDialog
        cancelLabel={t("teams.deleteConfirm.cancel")}
        confirmLabel={t("teams.deleteConfirm.confirm")}
        description={t("teams.deleteConfirm.description")}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void actions.deleteTeam(deleting, nameOf(deleting))
          setDeleting(null)
        }}
        open={deleting !== null}
        title={t("teams.deleteConfirm.title", {
          name: deleting ? nameOf(deleting) : "",
        })}
      />
    </section>
  )
}
