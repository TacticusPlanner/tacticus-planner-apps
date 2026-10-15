import type { PlannedToken } from "./token-plan"

export interface TokenGroup {
  teamId: string
  teamName: string
  /** The plan index of the group's first token. */
  start: number
  tokens: PlannedToken[]
}

/** Consecutive planned tokens of the same team, in plan order (spec: Token plan list). */
export function groupTokensByTeam(
  tokens: readonly PlannedToken[]
): TokenGroup[] {
  const groups: TokenGroup[] = []
  for (const [index, token] of tokens.entries()) {
    const last = groups.at(-1)
    if (last && last.teamId === token.teamId) {
      last.tokens.push(token)
    } else {
      groups.push({
        teamId: token.teamId,
        teamName: token.teamName,
        start: index,
        tokens: [token],
      })
    }
  }
  return groups
}
