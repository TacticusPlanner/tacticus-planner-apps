import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import { UnclaimedEventRewards } from "./unclaimed-event-rewards"

const { saved } = vi.hoisted(() => ({
  saved: {
    battles: [] as {
      battleId: string
      medals: number
      lightningVictory: boolean | null
      milestone: "Bronze" | "Silver" | "Gold" | null
    }[],
    revision: 1,
  },
}))

vi.mock("@/entities/player-data-override", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/player-data-override")>()),
  battleProgressQueries: {
    current: () => ({
      queryKey: ["player-data-overrides", "battle-progress", "current"],
      queryFn: () => Promise.resolve(saved),
    }),
  },
}))

const eventBattle = (id: string, nodeNumber: number) => ({
  id,
  campaignGroupId: "eventCampaign1",
  type: "Standard",
  challenge: false,
  nodeNumber,
  battleIndex: nodeNumber - 1,
  lightningVictoryTurns: 4,
  rewards: {
    guaranteed: [],
    potential: [],
    medals: [{ medals: 3, id: "xpCommon", min: 1, max: 1 }],
    milestones: [{ milestone: "Gold", id: "gold", min: 100, max: 100 }],
  },
})

beforeEach(async () => {
  saved.battles = []
  await seedGameCatalog({
    "campaign-definitions": [
      {
        id: "eventCampaign1",
        groupId: "eventCampaign1",
        releaseType: "event",
        types: ["Standard"],
        coreCharacters: [],
        battleIds: [],
      },
    ],
    "campaign-battles": [eventBattle("AMS01", 1), eventBattle("AMS02", 2)],
  })
  await seedPlayerData({
    "campaign-events-progress": [
      {
        tacticusCampaignId: "eventCampaign1",
        type: "Standard",
        completedBattleCount: 2,
        completedChallengeBattlesIds: [],
      },
    ],
  })
})

describe("UnclaimedEventRewards", () => {
  it("sums the unclaimed milestone rewards of the beaten event battles", async () => {
    saved.battles = [
      {
        battleId: "AMS01",
        medals: 3,
        lightningVictory: true,
        milestone: "Gold",
      },
    ]
    render(<UnclaimedEventRewards />, { auth: { authenticated: true } })

    const track = await screen.findByTestId(
      "unclaimed-event-rewards-eventCampaign1-Standard"
    )
    expect(track).toHaveTextContent("1 battle")
    expect(screen.getByTestId("one-time-reward-gold")).toHaveTextContent("100")
  })

  it("renders nothing when every beaten battle is claimed", async () => {
    saved.battles = ["AMS01", "AMS02"].map((battleId) => ({
      battleId,
      medals: 3,
      lightningVictory: true,
      milestone: "Gold" as const,
    }))
    const { container } = render(<UnclaimedEventRewards />, {
      auth: { authenticated: true },
    })

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(container).toBeEmptyDOMElement()
  })
})
