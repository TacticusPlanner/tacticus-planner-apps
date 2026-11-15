import type { PlannedToken } from "./token-plan"
import { groupTokensByTeam } from "./token-groups"

/** Consecutive tokens of one team that play the next battle of the same lane and clear the same
 *  cells, folded into one row of the Token plan (spec: Token plan list). */
export interface TokenBattleRun {
  /** The plan index of the run's first token. */
  start: number
  tokens: PlannedToken[]
}

function sameCells(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index])
}

/**
 * Splits a team group's tokens (`start` being the first one's plan index) into runs of
 * consecutive battles of one lane that clear the same cells; a token that breaks the chain starts
 * a new run, so a run of one token is a plain row.
 */
export function groupTokenBattleRuns(
  tokens: readonly PlannedToken[],
  start: number
): TokenBattleRun[] {
  const runs: TokenBattleRun[] = []
  for (const [offset, token] of tokens.entries()) {
    const last = runs.at(-1)
    const previous = last?.tokens.at(-1)
    if (
      last &&
      previous &&
      previous.laneId === token.laneId &&
      previous.battleIndex + 1 === token.battleIndex &&
      sameCells(previous.clearedIds, token.clearedIds)
    ) {
      last.tokens.push(token)
    } else {
      runs.push({ start: start + offset, tokens: [token] })
    }
  }
  return runs
}

/** Whether any team group in these slices of the plan folds into a row of several battles, i.e.
 *  whether the Token plan has anything for Expand all to open. */
export function hasFoldedBattleRuns(
  tokens: readonly PlannedToken[],
  slices: readonly { start: number; count: number }[]
): boolean {
  return slices.some(({ start, count }) =>
    groupTokensByTeam(tokens.slice(start, start + count)).some((group) =>
      groupTokenBattleRuns(group.tokens, start + group.start).some(
        (run) => run.tokens.length > 1
      )
    )
  )
}
