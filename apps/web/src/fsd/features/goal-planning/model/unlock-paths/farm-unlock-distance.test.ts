import { describe, expect, it } from "vitest"
import type { BattleId } from "@workspace/game-domain"

import { farmUnlockDistance } from "./farm-unlock-distance"

const battleId = "IndomitusElite25" as BattleId

describe("farmUnlockDistance", () => {
  it("counts the campaigns to clear first with the node's own battles", () => {
    expect(
      farmUnlockDistance({
        kind: "campaign",
        battleId,
        battlesToGo: 7,
        prerequisiteBattles: 12,
        lockReasons: [],
        started: true,
      })
    ).toEqual({ kind: "campaign", battles: 19, started: true })
  })

  it("has no battle count for a campaign event's node", () => {
    expect(farmUnlockDistance({ kind: "event", battleId })).toEqual({
      kind: "event",
    })
  })
})
