import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type {
  LegendaryEventLane,
  LegendaryEventLaneId,
  LegendaryEventRun,
  LegendaryEventTeam,
} from "@/entities/legendary-event"
import {
  TeamEditorDialog,
  laneTeams,
  type LegendaryEventPlanActions,
} from "@/features/legendary-event-teams"
import { ConfirmationDialog, SortableList } from "@/shared/ui"

import { TeamCard, type TeamCardActions } from "./team-card"
import { TeamsEmptyState } from "./teams-empty-state"
import {
  buildTeamCardViewModel,
  moveTargets,
  type TeamCardViewModel,
  type TeamsSectionState,
} from "./teams.view-model"

type TeamsActions = Pick<
  LegendaryEventPlanActions,
  "createTeam" | "updateTeam" | "deleteTeam" | "reorderLane" | "setDepth"
>

/** The page's Teams data (design D2): the section state, the current run and the plan actions. */
export interface TeamsViewModel {
  state: TeamsSectionState
  run: LegendaryEventRun
  actions: TeamsActions
}

type EditorState = { key: number; team?: LegendaryEventTeam }

/**
 * A lane's Teams section (design D5, D6), between the lane overview and the progress grid: one
 * card per team in stored order, an explicit Add team button, the editor, delete confirmation,
 * and reorder — drag on desktop, Move up / Move down in the card menu on mobile.
 */
export function TeamsSection({
  laneId,
  lane,
  teams,
  onlyUnlocked,
  isMobile,
}: {
  laneId: LegendaryEventLaneId
  lane: LegendaryEventLane
  teams: TeamsViewModel
  onlyUnlocked: boolean
  isMobile: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [editorCount, setEditorCount] = useState(0)
  const [deleting, setDeleting] = useState<LegendaryEventTeam | null>(null)
  const { state, run, actions } = teams

  const cards = useMemo(
    () =>
      state.kind === "ready"
        ? laneTeams(state.plan, laneId).map((team) =>
            buildTeamCardViewModel(team, lane, state.units, state.roster, run)
          )
        : [],
    [state, laneId, lane, run]
  )

  if (state.kind === "hidden") return null

  const openEditor = (team?: LegendaryEventTeam) => {
    setEditor({ key: editorCount, team })
    setEditorCount((count) => count + 1)
  }
  const ids = cards.map((card) => card.id)
  const cardActions = (card: TeamCardViewModel): TeamCardActions => {
    const moves = moveTargets(ids, card.id)
    return {
      onEdit: () => openEditor(card.team),
      onDelete: () => setDeleting(card.team),
      onDepthChange: (depth) => void actions.setDepth(card.team, depth),
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
      className="flex min-w-0 flex-col gap-3"
      data-lane={laneId}
      data-testid="legendary-event-teams"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold" id="legendary-event-teams-title">
          {t("teams.title")}
        </h2>
        {state.kind === "ready" ? (
          <Button
            data-testid="legendary-event-add-team"
            onClick={() => openEditor()}
            size="sm"
          >
            <Plus />
            {t("teams.add")}
          </Button>
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
        <TeamsEmptyState laneId={laneId} />
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
                  sortable={sortable}
                />
              )}
            />
          )}
        </ul>
      ) : null}

      {state.kind === "ready" && editor ? (
        <TeamEditorDialog
          key={editor.key}
          lane={lane}
          laneId={laneId}
          onOpenChange={(open) => {
            if (!open) setEditor(null)
          }}
          onSubmit={(draft) =>
            editor.team
              ? actions.updateTeam(editor.team, draft)
              : actions.createTeam(laneId, draft)
          }
          onlyUnlockedDefault={onlyUnlocked}
          open
          roster={state.roster}
          run={run}
          team={editor.team}
          teamNumber={cards.length + 1}
          units={state.units}
        />
      ) : null}

      <ConfirmationDialog
        cancelLabel={t("teams.deleteConfirm.cancel")}
        confirmLabel={t("teams.deleteConfirm.confirm")}
        description={t("teams.deleteConfirm.description")}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void actions.deleteTeam(deleting)
          setDeleting(null)
        }}
        open={deleting !== null}
        title={t("teams.deleteConfirm.title", { name: deleting?.name ?? "" })}
      />
    </section>
  )
}
