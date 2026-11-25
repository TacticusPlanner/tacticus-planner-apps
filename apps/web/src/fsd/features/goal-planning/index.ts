// Goals planning: goal data and actions, attainment, blockers, estimates, insights and projects
// composed by `pages/goals`.
export { useGoals } from "./model/goals-data/use-goals"
export {
  useGoalActions,
  type CascadeTarget,
} from "./model/goals-data/use-goal-actions"
export { isGoalsListLoading } from "./model/goals-data/goals-list-loading"
export { useGoalsMobileModes } from "./model/goals-data/use-goals-mobile-modes"
export { useGoalsPageReorder } from "./model/goals-data/use-goals-page-reorder"
export {
  displacedForPriority,
  goalMenuMoves,
  type GoalMenuMoves,
} from "./model/goal-order/menu-moves"
export {
  projectGoalsAlreadyFirst,
  projectInFlightGoalIds,
} from "./model/goal-order/project-moves"
export { useMoveProjectGoals } from "./model/goal-order/use-move-project-goals"
export { moveGoalsChoices } from "./model/goal-order/move-goals-choices"
export { MoveProjectGoalsDialog } from "./ui/goal-order/move-project-goals-dialog"
export {
  useGoalsSelection,
  type GoalSelectionPreset,
} from "./model/goals-data/use-goals-selection"
export {
  useGoalEditParam,
  useGoalsListFilters,
} from "./model/goals-data/use-goals-url-state"
export {
  NO_BLOCKERS,
  UNKNOWN_PROGRESS,
} from "./model/attainment/goal-overview-metrics-defaults"
export {
  type GoalProgress,
  type GoalTargetPreview,
} from "./model/attainment/goal-progress"
export { type LevelRequirementProgress } from "./model/attainment/level-requirement-progress"
export {
  useGoalAttainment,
  useGoalAttainmentState,
} from "./model/attainment/use-goal-attainment"
export {
  useGoalsOverviewMetrics,
  type GoalOverviewMetrics,
} from "./model/attainment/use-goals-overview-metrics"
export {
  blockerReasonText,
  computeGoalBlockers,
  type GoalBlockers,
} from "./model/blockers/goal-blockers"
export { computePlanInsights } from "./model/insights/plan-insights-calc"
export { usePlanInsights } from "./model/insights/use-plan-insights"
export {
  type PlanCampaignLockReason,
  type PlanCampaignProgression,
  type PlanInsightsBlocker,
  type PlanInsightsBottleneck,
  type PlanFarmingSpot,
  type PlanInsightsExcludedGoal,
  type PlanInsightsGoalOutlook,
  type PlanInsightsTotals,
  type PlanMissingResources,
} from "./model/insights/use-plan-insights.domain"
export {
  useFarmUnlockPaths,
  type FarmUnlockPathViewModel,
} from "./model/unlock-paths/use-farm-unlock-paths"
export { isOnlyMemberOf } from "./model/projects/project-removal"
export { useGoalsProjectScope } from "./model/projects/use-goals-project-scope"
export { useProjectsByGoalId } from "./model/projects/use-projects-by-goal-id"
export {
  isSeasonFitMode,
  seasonCutoffGoalId,
  SEASON_FIT_MODES,
  type GoalSeasonFit,
  type SeasonFitMode,
  type SeasonFitOffset,
} from "./model/season-fit/season-fit"
export { type SeasonFitSeason } from "./model/season-fit/season-windows"
export {
  useSeasonFit,
  type ActiveSeasonFit,
  type SeasonFitState,
} from "./model/season-fit/use-season-fit"
export {
  deadlineCutoffGoalId,
  eventEndCutoffGoalId,
  deadlineFitTone,
  type DeadlineFitSummary,
  type DeadlineGoalFit,
} from "./model/deadline-fit/deadline-fit"
export {
  useProjectDeadlineFit,
  useProjectCardOutlooks,
  type ProjectCardProgress,
  type ProjectDeadlineFit,
  type ProjectFitCount,
} from "./model/deadline-fit/use-project-deadline-fit"
export {
  orderRowsByDuration,
  orderRowsByFinishDate,
  orderRowsByGlobalPriority,
} from "./model/shared/goal-row-order"
export { expandedRows, groupRows, rowGroupId } from "./model/shared/row-groups"
export { useCollapsedGroups } from "./model/shared/use-collapsed-groups"
export { goalRowFromSummary, type GoalRow } from "./model/shared/types"
export { useGoalCatalog } from "./model/shared/use-goal-catalog"
export { useStableMap } from "./model/shared/use-stable-map"
export { MobileReorderBar } from "./ui/mobile-reorder-bar"
export { OrderConflictBanner } from "./ui/order-conflict-banner"
// Planning helpers the goal creation and edit forms (features/goal-create) read.
export { buildPreviewGoalDetails } from "./model/estimate/per-project-estimate"
export { usePerProjectEstimates } from "./model/estimate/use-per-project-estimates"
export { farmingStrategyAvailability } from "./model/farming/farming-strategy-availability"
export { useGoalLocationGroups } from "./model/farming/use-goal-location-groups"
export { projectConflictText } from "./model/projects/project-conflict-copy"
export { goalSlotConflict } from "./model/projects/project-membership"
export { type ProjectRemovalUnavailableReason } from "./model/projects/project-removal"
export { useInlineProjectCreate } from "./model/projects/use-inline-project-create"
export { useGoalSlotConflict } from "./model/projects/use-project-goal-conflicts"
export {
  abilityLevelsByRarity,
  getGoalValidationIssue,
  getGoalValidationIssues,
  goalKindsForEntity,
  isAtMaxAbility,
  isAtMaxProgression,
  isAtMaxRank,
} from "./model/shared/goal-validation"
export {
  chunkOrUndefined,
  readyData,
  toByUnitId,
  toXpBooks,
} from "./model/shared/read-data"
export { type GoalProject } from "./model/shared/types"
// Goal creation and edit: the create-goal sheet and its app-wide launcher, plus the goal edit
// dialog that reuses the same form family.
export { CreateGoalSheet } from "./ui/create-goal/create-goal-sheet"
export { CreateGoalLauncherProvider } from "./model/goal-creation-form/create-goal-launcher"
export {
  useCreateGoalLauncher,
  type CreateGoalPrefill,
} from "./model/goal-creation-form/create-goal-launcher-context"
export { GoalEditDialog } from "./ui/goal-edit/goal-edit-dialog"
export { AddToAnotherProjectDialog } from "./ui/projects/add-to-another-project-dialog"
export { GoalProjectBadges, GoalUnitIcon } from "./ui/shared/goal-visuals"
// Bulk goal creation: one shared target for several units at once (Collection's select mode).
export { BulkGoalDialog } from "./ui/bulk-create/bulk-goal-dialog"
export {
  bulkUnitKey,
  type BulkGoalUnit,
} from "./model/bulk-create/bulk-goal-plan"
