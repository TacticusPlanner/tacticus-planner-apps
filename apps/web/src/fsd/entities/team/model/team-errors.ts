import { apiIssue } from "@/shared/api"

import { TEAM_RULE_CODES } from "./team-modes"
import { teamIssues } from "./types"
import type { Team, TeamList, TeamRuleCode } from "./types"

/** The rule codes of a refused save (400 `teamRulesBroken`, codes under `rules`), else null. */
export function teamRulesBroken(error: unknown): TeamRuleCode[] | null {
  const issue = apiIssue(error, teamIssues.rulesBroken)
  if (!issue) return null
  const rules = issue.extensions.rules
  if (!Array.isArray(rules)) return []
  return TEAM_RULE_CODES.filter((code) => rules.includes(code))
}

/** Whether a save was refused because another team has the name. */
export function isTeamNameTaken(error: unknown) {
  return apiIssue(error, teamIssues.nameTaken) !== null
}

/** Whether a create was refused at the team limit. */
export function isTeamLimitReached(error: unknown) {
  return apiIssue(error, teamIssues.limitReached) !== null
}

/** The team as it stands when an update was stale (409 `teamRevisionStale`), else null. */
export function staleTeam(error: unknown): Team | null {
  const issue = apiIssue(error, teamIssues.revisionStale)
  const current = issue?.current as Partial<Team> | undefined
  return typeof current?.id === "string" && typeof current.revision === "number"
    ? (current as Team)
    : null
}

/** The current list when a reorder was stale (409 `teamOrderStale`), else null. */
export function staleTeamOrder(error: unknown): TeamList | null {
  const issue = apiIssue(error, teamIssues.orderStale)
  const current = issue?.current as Partial<TeamList> | undefined
  return Array.isArray(current?.teams) ? (current as TeamList) : null
}
