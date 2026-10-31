import type { LegendaryEventTeam } from "../model/plan.types"
import type { LegendaryEventLaneId } from "../model/types"

/** The fields a team (a plan team or a run record's snapshot) is named from. */
export type NamedTeam = Pick<
  LegendaryEventTeam,
  "laneId" | "name" | "objectiveIndexes" | "sortOrder"
>

/** A lane objective's localized label, by its catalog `index`. */
export interface LabelledObjective {
  index: number
  label: string
}

const LANE_LETTERS: Record<LegendaryEventLaneId, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
}

/** The longest team name the plan stores. */
const TEAM_NAME_LIMIT = 60

/** A generated team name with its lane's Greek letter in front ("α · Melee"), so the same
 *  objectives in two lanes read apart; cut to the stored name limit so it can be saved as is. */
export function withLanePrefix(
  laneId: LegendaryEventLaneId,
  name: string
): string {
  return `${LANE_LETTERS[laneId]} · ${name}`.slice(0, TEAM_NAME_LIMIT).trim()
}

/** Whether the stored name says nothing: empty, or the lane id (case-insensitive), as the V1
 *  import stored ("alpha"). */
export function hasLaneDefaultName(
  team: Pick<NamedTeam, "laneId" | "name">
): boolean {
  const name = team.name.trim().toLowerCase()
  return name === "" || name === team.laneId
}

/**
 * The name a team is shown by (spec: a team shows a readable name wherever it is named): the
 * stored name, unless it is empty or the lane id; then the lane's Greek letter and the covered
 * objectives' labels in lane objective order, joined by " · ", else the letter and `numberedName`
 * of its 1-based position in the lane (`laneTeams` ordered or not; other lanes' teams are
 * ignored). Display only: nothing is stored.
 */
export function teamDisplayName(
  team: NamedTeam,
  laneObjectives: readonly LabelledObjective[],
  laneTeams: readonly Pick<NamedTeam, "laneId" | "sortOrder">[],
  numberedName: (position: number) => string
): string {
  if (!hasLaneDefaultName(team)) return team.name
  const covered = new Set(team.objectiveIndexes)
  const labels = [...laneObjectives]
    .sort((a, b) => a.index - b.index)
    .filter((objective) => covered.has(objective.index))
    .map((objective) => objective.label)
  if (labels.length > 0) return withLanePrefix(team.laneId, labels.join(" · "))
  const before = laneTeams.filter(
    (other) => other.laneId === team.laneId && other.sortOrder < team.sortOrder
  ).length
  return withLanePrefix(team.laneId, numberedName(before + 1))
}
