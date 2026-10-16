import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { teamDisplayName, type NamedTeam } from "../lib/team-display-name"
import type { LegendaryEventLane } from "./types"
import { useObjectiveLabel } from "./use-objective-label"

/** A resolver from a team, its lane and the lane's teams to the name it is shown by
 *  (`teamDisplayName` with localized objective labels and "Team N"). */
export function useTeamDisplayName(): (
  team: NamedTeam,
  lane: Pick<LegendaryEventLane, "unitsRestrictions">,
  laneTeams: readonly Pick<NamedTeam, "laneId" | "sortOrder">[]
) => string {
  const { t } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  return useCallback(
    (team, lane, laneTeams) =>
      teamDisplayName(
        team,
        lane.unitsRestrictions.map((objective) => ({
          index: objective.index,
          label: objectiveLabel(objective).label,
        })),
        laneTeams,
        (position) => t("teams.editor.defaultName", { number: position })
      ),
    [objectiveLabel, t]
  )
}
