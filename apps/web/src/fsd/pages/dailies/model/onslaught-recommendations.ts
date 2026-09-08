import { buildArenaRecommendations } from "./arena-recommendations"
import type {
  BuildOnslaughtRecommendationsInput,
  OnslaughtAscensionGoalContribution,
  OnslaughtRecommendations,
} from "./onslaught-recommendations.types"
import type { TeamPoolSpec } from "./team-recommendations.types"
import type { UnitId } from "@workspace/game-domain"

export {
  collectContributions,
  mapRosterCharacter,
} from "./arena-recommendations"

/**
 * Builds the Onslaught recommendations for one alliance track. It is the Salvage Run configuration —
 * a hard alliance restriction applied to the roster before anything else — plus one extra
 * **highest-priority** pool: the owned Characters of the track that are the target of an active
 * Onslaught-farming Ascension goal. That pool is passed to the shared Arena builder as a leading
 * pool, so it ranks ahead of the active-project and overall-goals pools while composing with pool
 * widening, XP / Power ordering, and the broadened note exactly as any other priority pool does.
 * Machine-of-War Onslaught goals are handled separately by the shard recipient and never reach here.
 */
export function buildOnslaughtRecommendations(
  input: BuildOnslaughtRecommendationsInput
): OnslaughtRecommendations {
  const trackRoster = input.roster.filter(
    (character) =>
      input.rosterCatalog.get(character.unitId)?.alliance === input.track
  )
  const trackRosterIds = new Set(
    trackRoster.map((character) => character.unitId)
  )

  const onslaughtGoalByUnitId = new Map<
    UnitId,
    OnslaughtAscensionGoalContribution
  >()
  for (const contribution of input.onslaughtAscensionGoals) {
    if (
      trackRosterIds.has(contribution.unitId) &&
      !onslaughtGoalByUnitId.has(contribution.unitId)
    ) {
      onslaughtGoalByUnitId.set(contribution.unitId, contribution)
    }
  }

  const leadingPools: TeamPoolSpec[] = [
    {
      id: "onslaught-ascension",
      unitIds: new Set(onslaughtGoalByUnitId.keys()),
      rationaleFor: (id) => {
        const contribution = onslaughtGoalByUnitId.get(id)
        if (!contribution) return undefined
        return {
          kind: "onslaught-goal",
          goalId: contribution.goalId,
          ...(contribution.projectId
            ? { projectId: contribution.projectId }
            : {}),
        }
      },
    },
  ]

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
    leadingPools,
  })
}
