import type {
  CombinedGoalSpec,
  CreateGoalConfigRequest,
  GoalConfig,
  GoalDetail,
  GoalEntityType,
} from "@/entities/goal"

import { computePlanInsights } from "../insights/plan-insights-calc"
import type { EstimateOutcome } from "@/features/goal-farming"

type PlanInsightsParams = Parameters<typeof computePlanInsights>[0]

/** Fills a combined-creation spec's partial `CreateGoalConfigRequest` out to the full `GoalConfig`
 * shape a real, persisted `GoalDetail.config` always carries (every field present, unset ones `null`)
 * — the same defaulting the backend's `GoalMapper.MapConfig` applies at creation. */
function toGoalConfig(config: CreateGoalConfigRequest): GoalConfig {
  return {
    rank: config.rank ?? null,
    progression: config.progression ?? null,
    ability: config.ability ?? null,
    farmingStrategy: config.farmingStrategy ?? "TotalUpgrades",
    acquisitionSources: config.acquisitionSources ?? null,
    farmingLocationIds: config.farmingLocationIds ?? null,
    upgrade: config.upgrade ?? null,
    level: config.level ?? null,
  }
}

/**
 * Placeholder `GoalDetail`s for the goal(s) about to be created (plan §6's combined composer can
 * produce several, e.g. Unlock+Ascension+Rank in one pass) — just enough shape for
 * `estimateNewGoalsForProject`'s `calculateGoalResourceNeed`/`calculateGoalFarmingStages` calls to
 * treat them exactly like a real persisted goal, without actually creating one. Never sent to the
 * server or rendered as a real goal id — `goalId` is a short-lived local placeholder unique only
 * within one preview computation.
 */
export function buildPreviewGoalDetails(
  entityType: GoalEntityType,
  entityId: string,
  specs: readonly CombinedGoalSpec[]
): GoalDetail[] {
  return specs.map((spec, index) => ({
    goalId: `preview-${index}`,
    entityType,
    entityId,
    goalType: spec.goalType as GoalDetail["goalType"],
    status: "Paused",
    notes: null,
    createdAt: "",
    updatedAt: "",
    config: toGoalConfig(spec.config),
    snapshot: null,
    events: [],
    dependsOn: [],
    projectIds: [],
  }))
}

/**
 * One project's estimated duration for a goal (or combined set of goals, plan §6) about to be
 * created — reuses the exact same priority-shared engine the Insights view runs
 * (`computePlanInsights`/`estimatePlan`), rather than a second calculation path, by folding
 * `newDetails` in alongside that project's real active member goals at `newBasePriority` (each later
 * entry in the set placed right after, mirroring the backend's combined-creation priority spacing —
 * see `CreateCombinedGoalsEndpoint`). Read via `result.estimates` (already a per-goal
 * `Map<goalId, EstimateOutcome>` `computePlanInsights` produces internally) rather than its
 * aggregated `completionDate`/`energyTotal`, which cover every member goal, not just the new ones.
 *
 * `null` means "nothing costed to estimate" — every goal in `newDetails` is an uncosted type
 * (Level, Character Ability) with no farmable need, so there's nothing to show a duration for. A
 * `Blocked` outcome is returned as-is (surfacing whichever new goal hit it first) rather than folded
 * into the Estimated case.
 */
export function estimateNewGoalsForProject(
  params: {
    existingDetails: GoalDetail[]
    existingPriorities: ReadonlyMap<string, number>
    newDetails: GoalDetail[]
    newBasePriority: number
  } & Pick<
    PlanInsightsParams,
    | "playerCharacterById"
    | "playerMowById"
    | "inventoryShardById"
    | "inventoryUpgrades"
    | "upgradesById"
    | "battlesById"
    | "charactersById"
    | "mowsById"
    | "ascensionCostsById"
    | "unlockShardCostsById"
    | "releaseTypeByGroupId"
    | "getCharacter"
    | "dailyEnergy"
  >
): EstimateOutcome | null {
  const {
    existingDetails,
    existingPriorities,
    newDetails,
    newBasePriority,
    ...catalogParams
  } = params

  const priorityByGoalId = new Map(existingPriorities)
  newDetails.forEach((detail, index) => {
    priorityByGoalId.set(detail.goalId, newBasePriority + index)
  })

  // Onslaught progress/rewards are intentionally omitted (optional on computePlanInsights) — they
  // only feed the separate onslaughtTokens/onslaughtDays aggregate, never the per-goal `estimates`
  // map this function reads, so skipping them here avoids a second batch-fetch for a figure this
  // preview doesn't use.
  const result = computePlanInsights({
    details: [...existingDetails, ...newDetails],
    priorityByGoalId,
    // Only feed campaignInsights/eventInsights' own display labels — this preview never reads
    // either field, so a stub avoids pulling in useCampaignDisplay's i18n dependency chain.
    campaignName: (descriptor) => descriptor.nameKey,
    campaignFullLabel: (descriptor) => descriptor.nameKey,
    ...catalogParams,
  })

  let maxDays = 0
  let totalEnergy = 0
  let latestDate = ""
  let anyEstimated = false
  for (const detail of newDetails) {
    const outcome = result.estimates.get(detail.goalId)
    if (!outcome) continue // uncosted goal type — contributes nothing to this project's duration
    if (outcome.status === "Blocked") return outcome

    anyEstimated = true
    totalEnergy += outcome.energyTotal
    if (outcome.days > maxDays) maxDays = outcome.days
    if (outcome.date > latestDate) latestDate = outcome.date
  }

  if (!anyEstimated) return null

  return {
    status: "Estimated",
    days: maxDays,
    date: latestDate,
    energyTotal: totalEnergy,
    raidsTotal: 0,
  }
}
