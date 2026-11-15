import { beforeEach, describe, expect, it } from "vitest"
import type { CampaignBattleStorageModel } from "@workspace/game-catalog"

import { renderHook, waitFor } from "@/test/render"
import { seedPlayerData } from "@/test/seed"

import { useEligibleCampaignBattles } from "./use-eligible-campaign-battles"

const battle = (id: string, battleIndex: number) =>
  ({
    id,
    campaignGroupId: "elite2",
    type: "Elite",
    challenge: false,
    nodeNumber: battleIndex + 1,
    battleIndex,
  }) as unknown as CampaignBattleStorageModel

const battles = [battle("FoCE1", 0), battle("FoCE2", 1), battle("FoCE3", 2)]

function renderEligible() {
  return renderHook(() => useEligibleCampaignBattles(battles, []))
}

beforeEach(async () => {
  await seedPlayerData({
    "live-progress": { battleAttempts: [], activeCampaignEventId: null },
    "campaign-events-progress": [],
    // FoCE2 is the frontier: reached, never beaten.
    "campaign-progress": [
      {
        tacticusCampaignId: "elite2",
        type: "Elite",
        highestCompletedBattleIndex: 1,
      },
    ],
  })
})

describe("useEligibleCampaignBattles", () => {
  it("offers the frontier as a manual battle", async () => {
    const { result } = renderEligible()

    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.availableBattles.map(({ id }) => id)).toEqual([
      "FoCE1",
      "FoCE2",
    ])
    expect([...result.current.manualBattleIds]).toEqual(["FoCE2"])
  })
})
