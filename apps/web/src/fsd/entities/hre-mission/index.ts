// Hero Release Event domain: missions and objectives, progress, pace, reward rules and team plans.
// Shared by the Dailies HRE tab and the HRE team recommendations.
export {
  type HreInstance,
  listHreInstances,
  resolveHreSelection,
  selectHreInstance,
} from "./model/hre-instance"
export { type HreShardSource } from "./model/hre-shard-sources"
export { useHreShardSources } from "./model/use-hre-shard-sources"
export {
  HRE_OBJECTIVE_KINDS,
  type HreMission,
  type HreObjective,
  type HreObjectiveKind,
  hreAllDone,
  hreMission,
} from "./model/hre-missions"
export {
  type HreCampaignPlan,
  type HreTokenMode,
  type HreTokenNeedRow,
  campaignObjectiveState,
  isTokenObjective,
  nextCampaignMission,
  nextTokenReserve,
  remainingCampaignBattles,
  selectCampaignPlan,
  spareTokens,
  tokenNeedRows,
} from "./model/hre-objectives"
export {
  type HreOwnedInput,
  type HreOwnedStep,
  type HrePace,
  bracketRange,
  hreDaysLeft,
  hrePaceFor,
  ownedFrom,
  stepGap,
  stepsFor,
} from "./model/hre-pace"
export {
  DEFAULT_HRE_PROGRESS,
  HRE_PROGRESS_ORDER,
  type HreProgress,
  advanceMission,
  clampProgress,
  isMissionComplete,
  missionStatus,
  normalizeHreProgress,
  parseHreProgress,
  switchMission,
} from "./model/hre-progress"
export {
  type HreRarityStepId,
  hreStepProgression,
} from "./model/hre-reward-tables"
export {
  type HreRewardRules,
  type HreRules,
  toHreRules,
} from "./model/hre-rules"
export {
  type HreTeamPlan,
  type HreTeamRule,
  selectTeamPlans,
} from "./model/hre-team-plan"
