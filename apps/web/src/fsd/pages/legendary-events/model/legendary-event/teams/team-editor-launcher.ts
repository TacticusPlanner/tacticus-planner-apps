import { useSyncExternalStore } from "react"

import type {
  LegendaryEventLaneId,
  LegendaryEventTeam,
} from "@/entities/legendary-event"
import { useTeamEditorLauncher as useLauncher } from "@/features/team-editor"
import type { TeamEditorLauncher as Launcher } from "@/features/team-editor"

export { useOpenTeamEditor } from "@/features/team-editor"

/** What the team editor opens on (design D4): a lane, plus a saved team to edit, or a new team's
 *  first members (a suggestion's, or the leaderboard unit's) and a suggestion's objectives. */
interface TeamEditorRequest {
  laneId: LegendaryEventLaneId
  team?: LegendaryEventTeam
  memberUnitIds?: readonly string[]
  /** A new team's reserve (a suggestion's). */
  reserveUnitId?: string | null
  /** The objectives the picker's chips start from (the suggestion's). */
  objectiveIndexes?: readonly number[]
  /** The 1-based rank of the team suggestion the editor starts from. */
  suggestionRank?: number
}

/** The event page's team editor (the shared launcher, opened with a lane). */
export type TeamEditorLauncher = Launcher<TeamEditorRequest>

/**
 * The page-level team editor (design D4): one editor for the event page, opened by the Teams
 * section (Add team, Edit, Use this team), the Event board and the leaderboards (Add to new team).
 * The returned launcher is the same object for the page's lifetime.
 */
export function useTeamEditorLauncher(): TeamEditorLauncher {
  return useLauncher<TeamEditorRequest>()
}

/** Whether no editor opened from a team suggestion is showing, so the Suggest teams dialog can
 *  stay open behind any other editor and step aside for a suggestion's. Re-renders the caller only
 *  when that answer changes. */
export function useTeamEditorSuggestionOpen(
  launcher: TeamEditorLauncher
): boolean {
  return useSyncExternalStore(
    launcher.subscribe,
    () => launcher.getEditor()?.suggestionRank !== undefined
  )
}
