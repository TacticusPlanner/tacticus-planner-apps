import { useRef } from "react"

import type {
  LegendaryEvent,
  LegendaryEventLaneId,
} from "@/entities/legendary-event"
import { TeamEditorDialog, laneTeams } from "@/features/legendary-event-teams"

import type { TeamEditorLauncher } from "./team-editor-launcher"
import type { TeamsViewModel } from "./teams-section"

/**
 * The event page's single team editor (design D4), mounted once beside the tabs so the Teams
 * section and the lane and Overview leaderboards open the same instance through `launcher`. It
 * renders only while the plan is ready; a suggestion's rank is reported with the first team saved
 * from it, and a team saved after that with Save and add another counts as a new one.
 */
export function TeamEditorHost({
  event,
  teams,
  launcher,
  onlyUnlocked,
}: {
  event: Pick<LegendaryEvent, LegendaryEventLaneId>
  teams: TeamsViewModel
  launcher: TeamEditorLauncher
  onlyUnlocked: boolean
}) {
  const { editor } = launcher
  // The editor (by mount key) whose suggestion was already saved once.
  const suggestionSavedFor = useRef<number | null>(null)
  const { state, run, actions, estimates } = teams
  if (state.kind !== "ready" || !editor) return null
  const { laneId } = editor
  const estimateTeam =
    estimates.kind === "ready" ? estimates.byLane[laneId].team : undefined

  return (
    <TeamEditorDialog
      estimateTeam={estimateTeam}
      goalLines={teams.goals.goalLines}
      goalsPreview={teams.goals.pickerPreview(laneId)}
      initialMemberUnitIds={editor.memberUnitIds}
      key={editor.key}
      lane={event[laneId]}
      laneId={laneId}
      onOpenChange={(open) => {
        if (!open) launcher.closeTeamEditor()
      }}
      onSubmit={async (draft, shown) => {
        if (editor.team) return actions.updateTeam(editor.team, draft, shown)
        const rank =
          suggestionSavedFor.current === editor.key
            ? undefined
            : editor.suggestionRank
        const outcome = await actions.createTeam(
          laneId,
          draft,
          shown,
          rank === undefined
            ? undefined
            : { source: "suggestion", suggestionRank: rank }
        )
        if (outcome === "saved") suggestionSavedFor.current = editor.key
        return outcome
      }}
      onlyUnlockedDefault={onlyUnlocked}
      open
      roster={state.roster}
      run={run}
      team={editor.team}
      teamNumber={laneTeams(state.plan, laneId).length + 1}
      units={state.units}
    />
  )
}
