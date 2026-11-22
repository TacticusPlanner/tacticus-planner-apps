import type { ApiSchemas as S } from "@/shared/api"

/** A saved team as the API serves it (`GET teams`), with the rules it breaks under `issues`. */
export type Team = S["TeamResponse"]

/** The caller's teams in their saved order. */
export type TeamList = S["ListTeamsResponse"]

/** A game mode a team is built for. */
export type TeamMode = S["TeamMode"]

/** A team rule, named as the API names it on a read's `issues` and a refused save's `rules`. */
export type TeamRuleCode = S["TeamRuleCode"]

/** The fields a create sends; an update adds the revision it was based on. */
export type TeamFields = S["CreateTeamRequest"]

/** The issue codes the teams endpoints answer with. */
export const teamIssues = {
  rulesBroken: "teamRulesBroken",
  nameTaken: "teamNameTaken",
  limitReached: "teamLimitReached",
  revisionStale: "teamRevisionStale",
  orderStale: "teamOrderStale",
} as const
