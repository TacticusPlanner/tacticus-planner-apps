import { describe, expect, it } from "vitest"

import { groupTokenBattleRuns } from "./token-battle-runs"
import type { PlannedToken } from "./token-plan"

function token(
  battleIndex: number,
  overrides: Partial<PlannedToken> = {}
): PlannedToken {
  return {
    laneId: "alpha",
    battleIndex,
    teamId: "melee",
    teamName: "Melee",
    clearedIds: [0, 1],
    points: 100,
    runningPoints: 0,
    maybe: false,
    playableNow: true,
    ...overrides,
  }
}

describe("groupTokenBattleRuns", () => {
  it("folds consecutive battles clearing the same cells into one run", () => {
    const runs = groupTokenBattleRuns([token(0), token(1), token(2)], 4)
    expect(runs).toHaveLength(1)
    expect(runs[0]?.start).toBe(4)
    expect(runs[0]?.tokens.map((entry) => entry.battleIndex)).toEqual([0, 1, 2])
  })

  it("starts a new run on other cells, a skipped battle or another lane", () => {
    const runs = groupTokenBattleRuns(
      [
        token(0),
        token(1, { clearedIds: [0] }),
        token(3, { clearedIds: [0] }),
        token(4, { clearedIds: [0], laneId: "beta" }),
      ],
      0
    )
    expect(runs.map((run) => [run.start, run.tokens.length])).toEqual([
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ])
  })

  it("keeps a replayed battle apart", () => {
    const runs = groupTokenBattleRuns([token(2), token(2)], 0)
    expect(runs).toHaveLength(2)
  })
})
