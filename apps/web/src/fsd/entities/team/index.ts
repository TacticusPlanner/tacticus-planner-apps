// Public API of the team entity: the personal teams' types, API queries and mutations, the mode
// list and the team rules the editor and the page share with the API (design D1, D3).
export {
  type Team,
  type TeamFields,
  type TeamMode,
  type TeamRuleCode,
} from "./model/types"
export {
  EXCLUSIVE_MODES,
  SIZE_LIMITED_MODES,
  TEAM_LIMITS,
  TEAM_MODES,
  TEAM_RULE_CODES,
  isTeamMode,
  unitModesClash,
} from "./model/team-modes"
export { teamQueries } from "./api/team.queries"
export {
  useCreateTeam,
  useDeleteTeam,
  useReorderTeams,
  useTeams,
  useUpdateTeam,
} from "./model/use-teams"
export {
  isTeamLimitReached,
  isTeamNameTaken,
  staleRevision,
  staleTeamOrder,
  teamRulesBroken,
} from "./model/team-errors"
export {
  allowedFactions,
  charactersConcerned,
  coreCount,
  coreMowCount,
  evaluateTeamRules,
  sharedIncursionFactions,
  type TeamRuleFacts,
} from "./lib/team-rules"
export { buildTeamRuleFacts, isEliteCampaign } from "./lib/team-rule-facts"
export {
  DEFAULT_RARITY_CAP,
  capRosterUnit,
  underCap,
  type UnderCap,
} from "./lib/rarity-cap"
export { teamModeIcon } from "./lib/team-mode-icon"
export { useTeamRuleFacts } from "./model/use-team-rule-facts"
export { useTeamModeLabel, useTeamRuleText } from "./model/use-team-copy"
export {
  teamUnitView,
  useTeamRoster,
  type TeamRoster,
  type TeamRosterUnit,
} from "./model/use-team-roster"
export { TeamUnitPortrait, type TeamUnitView } from "./ui/team-unit-portrait"
export { TeamIssueList } from "./ui/team-issue-list"
