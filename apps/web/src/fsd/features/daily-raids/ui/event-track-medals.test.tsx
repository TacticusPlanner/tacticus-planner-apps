import { beforeEach, describe, expect, it, vi } from "vitest"

import userEvent from "@testing-library/user-event"

import { render, screen } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import { EventTrackMedals } from "./event-track-medals"

const { saved } = vi.hoisted(() => ({
  saved: {
    battles: [] as {
      battleId: string
      medals: number
      lightningVictory: boolean | null
      milestone: "None" | "Bronze" | "Silver" | "Gold" | null
    }[],
    revision: 1,
  },
}))

vi.mock("@/shared/feature-flags", () => ({
  useFeatureFlag: (flag: string) => flag === "ManualBattles",
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

describe("EventTrackMedals", () => {
  it("sums the rewards of beaten battles that fell short of the best result", async () => {
    saved.battles = [
      {
        battleId: "AMS01",
        medals: 3,
        lightningVictory: null,
        milestone: "Silver",
      },
    ]
    render(<EventTrackMedals groupId="eventCampaign1" type="Standard" />, {
      auth: { authenticated: true },
    })

    expect(
      await screen.findByTestId("event-track-medals-eventCampaign1-Standard")
    ).toHaveTextContent("1 battle has unclaimed rewards")
    expect(screen.getByTestId("one-time-reward-gold")).toHaveTextContent("100")
  })

  it("treats beaten battles as fully claimed by default and opens the dialog", async () => {
    const user = userEvent.setup()
    render(<EventTrackMedals groupId="eventCampaign1" type="Standard" />, {
      auth: { authenticated: true },
    })

    expect(
      await screen.findByTestId("event-track-medals-eventCampaign1-Standard")
    ).toHaveTextContent("All one-time rewards claimed")
    await user.click(
      screen.getByTestId("event-track-medals-open-eventCampaign1-Standard")
    )
    expect(
      await screen.findByTestId("battle-progress-row-AMS02")
    ).toBeInTheDocument()
  })
})
