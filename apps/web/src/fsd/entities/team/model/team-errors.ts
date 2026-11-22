import { apiIssue } from "@/shared/api"

import { isTeamMode, TEAM_RULE_CODES, withKnownIssues } from "./team-modes"
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")

const isNullableNumber = (value: unknown) =>
  value === null || typeof value === "number"

const isNullableString = (value: unknown) =>
  value === null || typeof value === "string"

/** Whether a 409's `current` is a whole team, so the editor and the cache can take it as one. */
function isTeam(value: unknown): value is Team {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.revision === "number" &&
    typeof value.name === "string" &&
    typeof value.position === "number" &&
    Array.isArray(value.modes) &&
    value.modes.every(isTeamMode) &&
    isStringList(value.characterIds) &&
    isNullableNumber(value.flexStartIndex) &&
    isStringList(value.mowIds) &&
    isNullableNumber(value.mowFlexStartIndex) &&
    isNullableString(value.campaignGroupId) &&
    isStringList(value.incursionMowIds) &&
    isNullableString(value.notes) &&
    isNullableString(value.rarityCap) &&
    isStringList(value.issues)
  )
}

/** The team as it stands when an update was stale (409 `teamRevisionStale`), else null: an incomplete one is
 *  dropped, and the normal refetch recovers. */
export function staleTeam(error: unknown): Team | null {
  const current = apiIssue(error, teamIssues.revisionStale)?.current
  return isTeam(current) ? withKnownIssues(current) : null
}

/** The team's current revision from a stale update (409 `teamRevisionStale`), else null. Read even when the rest
 *  of `current` is incomplete, so the editor's next save is based on it rather than failing as stale again. */
export function staleRevision(error: unknown): number | null {
  const current = apiIssue(error, teamIssues.revisionStale)?.current
  return isRecord(current) && typeof current.revision === "number"
    ? current.revision
    : null
}

/** The current list when a reorder was stale (409 `teamOrderStale`), else null, also when any team in it is
 *  incomplete. */
export function staleTeamOrder(error: unknown): TeamList | null {
  const current = apiIssue(error, teamIssues.orderStale)?.current
  return isRecord(current) &&
    Array.isArray(current.teams) &&
    current.teams.every(isTeam)
    ? { ...current, teams: current.teams.map(withKnownIssues) }
    : null
}
