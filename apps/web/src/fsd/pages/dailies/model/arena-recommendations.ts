import { unitIdSchema, type UnitId } from "@workspace/game-domain"

import { buildTeamRecommendations } from "./team-recommendations"
import type {
  ArenaGoalContribution,
  ArenaRecommendations,
  ArenaRosterCharacter,
  BuildArenaRecommendationsInput,
  RawGoal,
  RawRosterCharacter,
} from "./arena-recommendations.types"
import type {
  TeamMemberRationale,
  TeamPoolSpec,
  TeamRosterCharacter,
} from "./team-recommendations.types"

/** Maps a synced roster record to the engine's character shape. Catalog-sourced `traits` /
 * `damageTypes` are merged in separately (see `use-arena-recommendations`); an Arena run with no
 * catalog data simply matches no preference. */
export function mapRosterCharacter(
  record: RawRosterCharacter
): ArenaRosterCharacter {
  return {
    unitId: record.unitId,
    rank: record.rank,
    progression: record.progressionIndex,
    xpLevel: record.xpLevel,
    appliedUpgradeCount: new Set(record.appliedUpgradeSlots).size,
    activeAbilityLevel: record.abilities[0]?.level ?? 1,
    passiveAbilityLevel: record.abilities[1]?.level ?? 1,
  }
}

/** Keeps only the active-status character goals and turns them into contributions. `projectId` is
 * stamped on every result when the goals came from a project's membership list. */
export function collectContributions(
  goals: readonly RawGoal[],
  projectId?: string
): ArenaGoalContribution[] {
  const contributions: ArenaGoalContribution[] = []
  for (const goal of goals) {
    if (goal.status !== "Active" || goal.entityType !== "Character") continue
    const parsed = unitIdSchema.safeParse(goal.entityId)
    if (!parsed.success) continue
    contributions.push({
      unitId: parsed.data,
      goalId: goal.goalId,
      ...(projectId ? { projectId } : {}),
    })
  }
  return contributions
}

/** First contribution per unit id, in input order — a unit targeted by several active goals keeps
 * the first for its rationale. */
function contributionByUnitId(
  contributions: readonly ArenaGoalContribution[]
): Map<UnitId, ArenaGoalContribution> {
  const map = new Map<UnitId, ArenaGoalContribution>()
  for (const contribution of contributions) {
    if (!map.has(contribution.unitId)) {
      map.set(contribution.unitId, contribution)
    }
  }
  return map
}

function goalRationale(
  contribution: ArenaGoalContribution | undefined
): TeamMemberRationale | undefined {
  if (!contribution) return undefined
  return {
    kind: "goal",
    goalId: contribution.goalId,
    ...(contribution.projectId ? { projectId: contribution.projectId } : {}),
  }
}

/**
 * Builds the Arena recommendations — one Plan Team and one Random Team — by configuring the shared
 * `dailies-team-recommendations` engine with two priority pools (the selected project's owned
 * contributors, then every active goal's owned contributors). The caller guarantees at least three
 * owned characters (fewer is the page-level "not enough characters" state, handled upstream).
 */
export function buildArenaRecommendations(
  input: BuildArenaRecommendationsInput
): ArenaRecommendations {
  const rosterIdSet = new Set(input.roster.map((character) => character.unitId))

  const projectContributionById = contributionByUnitId(
    input.activeProjectContributions.filter((c) => rosterIdSet.has(c.unitId))
  )
  const goalContributionById = contributionByUnitId(
    input.activeGoalContributions.filter((c) => rosterIdSet.has(c.unitId))
  )

  const pools: TeamPoolSpec[] = [
    {
      id: "active-project",
      unitIds: new Set(projectContributionById.keys()),
      rationaleFor: (id) => goalRationale(projectContributionById.get(id)),
    },
    {
      id: "overall-goals",
      unitIds: new Set(goalContributionById.keys()),
      rationaleFor: (id) => goalRationale(goalContributionById.get(id)),
    },
  ]

  const roster: TeamRosterCharacter[] = input.roster.map((character) => ({
    ...character,
    traits: input.rosterCatalog?.get(character.unitId)?.traits ?? [],
    damageTypes: input.rosterCatalog?.get(character.unitId)?.damageTypes ?? [],
  }))

  return buildTeamRecommendations({
    mode: input.mode,
    teamSize: input.teamSize,
    roster,
    pools,
    preferences: input.preferences ?? {},
    lockedRandomUnitIds: input.lockedRandomUnitIds,
    randomSeed: input.randomSeed,
  })
}
