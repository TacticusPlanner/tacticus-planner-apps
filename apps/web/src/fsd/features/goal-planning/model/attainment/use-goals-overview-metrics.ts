import { useMemo } from "react"
import type { UnitId } from "@workspace/game-domain"

import { usePlayerChunk } from "@/shared/local-data"

import {
  computeGoalBlockers,
  type GoalBlockers,
  type PrerequisiteGoalLabel,
} from "../blockers/goal-blockers"
import { implicitPrerequisiteBlockers } from "../blockers/implicit-prerequisite-blockers"
import type {
  EstimateOutcome,
  RankSlotAllocation,
} from "@/features/goal-farming/@x/goal-planning"
import {
  calculateGoalResourceNeed,
  useLevelRules,
} from "@/features/goal-farming/@x/goal-planning"
import type {
  AbilityMaterials,
  ResourceNeed,
} from "@/features/goal-farming/@x/goal-planning"
import { useStableIds } from "../shared/use-stable-ids"
import { useStableMap } from "../shared/use-stable-map"
import { useGoalsFor } from "./use-goals-for"
import { withStandaloneAvailable } from "../insights/plan-ability-materials"
import type { PlanNetResources } from "../insights/use-plan-insights.domain"
import { useGoalCatalog } from "../shared/use-goal-catalog"
import {
  chunkOrUndefined,
  readyData,
  toAbilityMaterials,
  toByUnitId,
} from "../shared/read-data"
import {
  computeGoalAttainment,
  isPlayerDataUnavailable,
} from "./goal-attainment"
import { NO_BLOCKERS, UNKNOWN_PROGRESS } from "./goal-overview-metrics-defaults"
import { computeGoalProgress, type GoalProgress } from "./goal-progress"
import { milestoneSiblings, withMilestoneStart } from "./milestone-siblings"
import type { GoalDetail } from "@/entities/goal"
import {
  computeLevelRequirementProgress,
  type LevelRequirementProgress,
} from "./level-requirement-progress"

export type GoalOverviewMetrics = {
  progress: GoalProgress
  /** Still-missing materials/shards/orbs (plan §2's "remaining resources") — `null` for an uncosted
   *  goal kind (Item, Upgrade) or once nothing more is needed. No energy/day figure here: that
   *  depends on a shared farming plan's priority ordering, which only exists once a goal is scoped to
   *  a project (see `usePlanInsights`/the project-scoped Insights view) — not meaningful on this
   *  flat, cross-project list. */
  remaining: ResourceNeed | null
  blockers: GoalBlockers
  /** The level this Rank/Ability goal's target needs while the character is below it — ordinary
   *  progress shown beside the goal, never a blocker. `null` when sufficient or not applicable. */
  levelRequirement: LevelRequirementProgress | null
  /** The higher-priority in-flight goal of the same unit and type that already reaches this goal's
   *  target (goal-milestone-planning), so this one adds no work of its own; null otherwise. */
  coveredBy?: GoalDetail | null
}

const UNKNOWN_METRICS: GoalOverviewMetrics = {
  progress: UNKNOWN_PROGRESS,
  remaining: null,
  blockers: NO_BLOCKERS,
  levelRequirement: null,
}

/**
 * Batch progress + remaining-resource info for every goal id in `goalIds` — the overview row/card's
 * progress bar and "still needs" summary (plan §2). Mirrors `use-goal-attainment.ts`'s batch-fetch
 * shape but kept separate: attainment answers "is the target already met" (drives tab grouping);
 * this answers "how far along, and what's left" (drives row display) — different questions, different
 * call sites, some shared inputs re-fetched from the same TanStack Query cache (no extra network cost).
 */
function useComputedGoalsOverviewMetrics(
  requestedGoalIds: readonly string[],
  /** The per-goal plan estimates (`usePlanInsights`), when the caller has them — folded into
   *  `blockers` as an `EstimateBlocked` reason. Omitted where no plan run is available. */
  estimatesByGoalId?: ReadonlyMap<string, EstimateOutcome>,
  /** The plan's allocation of each Rank goal's slots (`PlanInsightsResult.rankSlotsByGoalId`): rows
   *  then show what the goal adds to the one plan, not its standalone count. */
  rankSlotsByGoalId?: ReadonlyMap<string, RankSlotAllocation>,
  /** The plan's ability materials per Ability goal (`PlanInsightsResult.abilityMaterialsByGoalId`), net
   *  of levels a higher-priority goal for the same unit covers. Absent (no plan run yet) keeps each
   *  goal's standalone figure. */
  abilityMaterialsByGoalId?: ReadonlyMap<string, AbilityMaterials | null>,
  /** The plan's inventory-netted orbs/shards and Rank gold per goal
   *  (`PlanInsightsResult.planNetByGoalId`); a goal without an entry (paused) keeps its standalone need. */
  planNetByGoalId?: ReadonlyMap<string, PlanNetResources>
): ReadonlyMap<string, GoalOverviewMetrics> {
  const {
    charactersById,
    mowsById,
    upgradesById,
    ascensionCostsById,
    unlockShardCostsById,
    mowUpgradeCostsByLevel,
    characterAbilityCostsByLevel,
    getCharacter,
    getEntityName,
    loading: catalogLoading,
  } = useGoalCatalog()
  // Every goal comes from the goals list (no per-goal read). Prerequisite goals (plan §4's "a
  // prerequisite goal has not been reached") can be outside `goalIds` (a different tab, a different
  // project) — they are in the same map, so their own attainment is known wherever they sit.
  const goalIds = useStableIds(requestedGoalIds)
  const goals = useGoalsFor(goalIds)
  const prerequisiteGoalsReady = !goals.loading

  const playerCharacters = readyData(
    usePlayerChunk("characters", chunkOrUndefined)
  )
  const playerMows = readyData(usePlayerChunk("mows", chunkOrUndefined))
  const inventoryUpgrades = readyData(
    usePlayerChunk("inventory-upgrades", chunkOrUndefined)
  )
  const inventoryItems = readyData(
    usePlayerChunk("inventory-items", chunkOrUndefined)
  )
  const abilityInventory = readyData(
    usePlayerChunk("inventory", toAbilityMaterials)
  )

  const playerCharacterById =
    readyData(usePlayerChunk("characters", toByUnitId)) ?? emptyById
  const playerMowById =
    readyData(usePlayerChunk("mows", toByUnitId)) ?? emptyById

  // Unlock goals need the not-yet-unlocked unit's shard inventory — a separate chunk from
  // `characters`/`mows` (see player-data.schema.ts); empty until it has loaded.
  const inventoryShardByEntity =
    readyData(usePlayerChunk("inventory-shards", toByUnitId)) ?? emptyById

  // `upgradesById` defaults to an empty Map before its own live query resolves (see
  // `use-goal-catalog.ts`), so it can't signal "not loaded yet" on its own — `catalogLoading` (which
  // does check the underlying query) closes that gap.
  const catalogReady =
    !catalogLoading &&
    !!(mowsById && ascensionCostsById && unlockShardCostsById)

  const levelRules = useLevelRules()

  // Everything below is pure in the reads above: memoised so a re-render that changes none of them
  // (a toggle elsewhere on the page, a sync progress tick) skips the per-goal resource maths.
  return useMemo(() => {
    const details = goalIds.map((goalId) => goals.goalsById.get(goalId))
    const prerequisiteGoals = [...goals.goalsById.values()].filter(
      (goal) => goal.goalType === "Ascension" || goal.goalType === "Unlock"
    )
    const dependencyGoalIds = [
      ...new Set(details.flatMap((detail) => detail?.dependsOn ?? [])),
    ]
    const dependencyReachedById = new Map<string, boolean>()
    const dependencyLabelById = new Map<string, PrerequisiteGoalLabel>()
    dependencyGoalIds.forEach((dependencyGoalId) => {
      const dependencyDetail = goals.goalsById.get(dependencyGoalId)
      if (!dependencyDetail) return
      const dependencyUnitId = dependencyDetail.entityId as UnitId
      dependencyLabelById.set(dependencyGoalId, {
        unitName: getEntityName(
          dependencyDetail.entityType,
          dependencyDetail.entityId
        ),
        goalType: dependencyDetail.goalType,
      })
      dependencyReachedById.set(
        dependencyGoalId,
        computeGoalAttainment({
          detail: dependencyDetail,
          playerCharacter: playerCharacterById.get(dependencyUnitId),
          playerMow: playerMowById.get(dependencyUnitId),
          inventoryUpgrades,
          inventoryItems,
        }).reached
      )
    })

    const result = new Map<string, GoalOverviewMetrics>()
    goalIds.forEach((goalId, index) => {
      const detail = details[index]
      if (!detail) {
        result.set(goalId, UNKNOWN_METRICS)
        return
      }
      const unitId = detail.entityId as UnitId
      const playerCharacter = playerCharacterById.get(unitId)
      const playerMow = playerMowById.get(unitId)
      const inventoryShard = inventoryShardByEntity.get(detail.entityId)
      const playerUnit =
        detail.entityType === "Mow" ? playerMow : playerCharacter
      // Distinguishes "roster not loaded yet" from "loaded and this unit just isn't in it" — the split
      // the missing-Unlock reason and the narrowed player-data-unavailable reason both need (see
      // `implicit-prerequisite-blockers.ts` and `goal-attainment.ts#isPlayerDataUnavailable`).
      const rosterLoaded =
        detail.entityType === "Mow"
          ? playerMows !== undefined
          : playerCharacters !== undefined

      const attainment = computeGoalAttainment({
        detail,
        playerCharacter,
        playerMow,
        inventoryUpgrades,
        inventoryItems,
      })

      // A milestone's range reads from the previous milestone's end (display only).
      const siblings = milestoneSiblings(detail, goals.goalsById.values())
      const liveProgress = computeGoalProgress({
        detail,
        playerCharacter,
        playerMow,
        inventoryUpgrades,
        inventoryItems,
        initialRarity: charactersById?.get(detail.entityId)?.initialRarity,
        unlockShardCostsById: unlockShardCostsById ?? new Map(),
        inventoryShard,
        upgradesById,
        levelRules,
      })
      const progress = withMilestoneStart(liveProgress, siblings)

      const remainingStandalone = catalogReady
        ? calculateGoalResourceNeed({
            detail,
            character: getCharacter(unitId),
            characterView: charactersById!.get(detail.entityId),
            mow: mowsById.get(detail.entityId),
            playerCharacter,
            playerMow,
            inventoryShard,
            upgradesById,
            ascensionCostsById: ascensionCostsById,
            unlockShardCostsById: unlockShardCostsById,
            mowUpgradeCostsByLevel,
            characterAbilityCostsByLevel,
          })
        : null

      const slots = rankSlotsByGoalId?.get(goalId)
      const withSlots =
        remainingStandalone && slots
          ? {
              ...remainingStandalone,
              upgradeSlotsRemaining: slots.allocated,
              coveredByEarlierGoal:
                slots.allocated === 0 && slots.standalone > 0,
            }
          : remainingStandalone
      // Plan-wide coverage overrides the standalone ability materials (`null` = fully covered/none left).
      // A paused Machine of War goal is outside the plan run: its standalone need against the full stock.
      const standaloneMaterials = withSlots?.abilityMaterials
      const withMaterials: typeof withSlots =
        withSlots && abilityMaterialsByGoalId?.has(goalId)
          ? {
              ...withSlots,
              abilityMaterials:
                abilityMaterialsByGoalId.get(goalId) ?? undefined,
            }
          : withSlots &&
              detail.entityType === "Mow" &&
              standaloneMaterials &&
              abilityInventory
            ? {
                ...withSlots,
                abilityMaterials: withStandaloneAvailable(
                  standaloneMaterials,
                  abilityInventory,
                  mowsById?.get(detail.entityId)?.alliance
                ),
              }
            : withSlots
      const planNet = planNetByGoalId?.get(goalId)
      const alliance = (
        detail.entityType === "Mow" ? mowsById : charactersById
      )?.get(detail.entityId)?.alliance
      const remaining = withMaterials
        ? { ...withMaterials, ...planNet, alliance }
        : withMaterials

      const estimateOutcome = estimatesByGoalId?.get(goalId)
      const blockers = computeGoalBlockers({
        estimatePartial:
          estimateOutcome?.status === "Blocked" &&
          (estimateOutcome.actionableResourceIds?.length ?? 0) > 0,
        estimateReason:
          estimateOutcome?.status === "Blocked"
            ? estimateOutcome.reason
            : undefined,
        unreachedPrerequisites: detail.dependsOn
          .filter(
            (dependencyGoalId) =>
              dependencyReachedById.get(dependencyGoalId) === false
          )
          .map((dependencyGoalId) => ({
            goalId: dependencyGoalId,
            prerequisite: dependencyLabelById.get(dependencyGoalId),
          })),
        playerDataUnavailable:
          catalogReady &&
          isPlayerDataUnavailable({ attainment, rosterLoaded, playerUnit }),
        catalogDataUnavailable: !catalogReady,
        implicitReasons: implicitPrerequisiteBlockers({
          detail,
          playerUnit,
          prerequisiteGoals,
          ready: prerequisiteGoalsReady && catalogReady && rosterLoaded,
          unitName: getEntityName(detail.entityType, detail.entityId),
        }),
      })

      result.set(goalId, {
        progress,
        remaining,
        blockers,
        coveredBy: siblings?.coveredBy ?? null,
        levelRequirement: computeLevelRequirementProgress({
          detail,
          playerUnit,
          chainedFrom: planNet?.levelChainedFrom,
          levelRules,
        }),
      })
    })
    return result
  }, [
    goalIds,
    goals.goalsById,
    prerequisiteGoalsReady,
    playerCharacters,
    playerMows,
    inventoryUpgrades,
    inventoryItems,
    abilityInventory,
    playerCharacterById,
    playerMowById,
    inventoryShardByEntity,
    catalogReady,
    charactersById,
    mowsById,
    upgradesById,
    ascensionCostsById,
    unlockShardCostsById,
    mowUpgradeCostsByLevel,
    characterAbilityCostsByLevel,
    getCharacter,
    getEntityName,
    estimatesByGoalId,
    rankSlotsByGoalId,
    abilityMaterialsByGoalId,
    planNetByGoalId,
    levelRules,
  ])
}

const emptyById = new Map<string, never>()

export function useGoalsOverviewMetrics(
  ...args: Parameters<typeof useComputedGoalsOverviewMetrics>
): ReadonlyMap<string, GoalOverviewMetrics> {
  return useStableMap(useComputedGoalsOverviewMetrics(...args))
}
