import { buildArenaRecommendations } from "./arena-recommendations"
import type {
  BuildSalvageRecommendationsInput,
  SalvageRecommendations,
} from "./salvage-recommendations.types"

export {
  collectContributions,
  mapRosterCharacter,
} from "./arena-recommendations"

/**
 * Builds the Salvage Run recommendations for one alliance track. The only thing that distinguishes
 * it from the Arena page is a hard alliance restriction: the roster is narrowed to the track's
 * alliance **before** any project, goal, XP, or power prioritization, so every pool the shared
 * engine widens through — including the implicit full roster — already contains only that
 * alliance. Everything downstream (the two priority pools, the mode ordering, the Random Team, the
 * preference filters) is the Arena configuration unchanged.
 */
export function buildSalvageRecommendations(
  input: BuildSalvageRecommendationsInput
): SalvageRecommendations {
  const trackRoster = input.roster.filter(
    (character) =>
      input.rosterCatalog.get(character.unitId)?.alliance === input.track
  )

  return buildArenaRecommendations({
    mode: input.mode,
    roster: trackRoster,
    selectedProjectId: input.selectedProjectId,
    activeProjectContributions: input.activeProjectContributions,
    activeGoalContributions: input.activeGoalContributions,
    teamSize: input.teamSize,
    lockedRandomUnitIds: input.lockedRandomUnitIds,
    randomSeed: input.randomSeed,
    preferences: input.preferences,
    rosterCatalog: input.rosterCatalog,
  })
}
