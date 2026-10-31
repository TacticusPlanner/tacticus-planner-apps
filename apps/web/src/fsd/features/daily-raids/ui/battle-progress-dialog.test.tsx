import { beforeEach, describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"

import { render, screen, waitFor } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import { BattleProgressDialog } from "./battle-progress-dialog"

const { saved, update } = vi.hoisted(() => ({
  saved: {
    battles: [] as {
      battleId: string
      medals: number
      lightningVictory: boolean | null
      milestone: "None" | "Bronze" | "Silver" | "Gold" | null
    }[],
    revision: 4,
  },
  update: vi.fn(),
}))

vi.mock("@/entities/player-data-override", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/player-data-override")>()),
  battleProgressQueries: {
    current: () => ({
      queryKey: ["player-data-overrides", "battle-progress", "current"],
      queryFn: () => Promise.resolve(saved),
    }),
  },
  updateBattleProgressOverrides: update,
}))

const battle = (id: string, campaignGroupId: string, battleIndex: number) => ({
  id,
  campaignGroupId,
  type: campaignGroupId.startsWith("elite") ? "Elite" : "Standard",
  challenge: false,
  nodeNumber: battleIndex + 1,
  battleIndex,
})

const eventBattle = (id: string, battleIndex: number) => ({
  ...battle(id, "eventCampaign1", battleIndex),
  lightningVictoryTurns: 4,
  rewards: {
    guaranteed: [],
    potential: [],
    medals: [{ medals: 3, id: "xpCommon", min: 1, max: 1 }],
    milestones: [
      { milestone: "Bronze", id: "upgHpC015", min: 1, max: 1 },
      { milestone: "Silver", id: "xpCommon", min: 2, max: 2 },
      { milestone: "Gold", id: "gold", min: 100, max: 100 },
    ],
  },
})

beforeEach(async () => {
  update.mockReset()
  update.mockImplementation((body: typeof saved) =>
    Promise.resolve({ ...body, revision: body.revision + 1 })
  )
  saved.battles = []
  await seedGameCatalog({
    "campaign-definitions": [
      {
        id: "campaign1",
        groupId: "campaign1",
        releaseType: "standard",
        types: ["Standard"],
        coreCharacters: [],
        battleIds: [],
      },
      {
        id: "eventCampaign1",
        groupId: "eventCampaign1",
        releaseType: "event",
        types: ["Standard", "Extremis"],
        coreCharacters: [],
        battleIds: [],
      },
      {
        id: "elite2",
        groupId: "elite2",
        releaseType: "standard",
        types: ["Elite"],
        coreCharacters: [],
        battleIds: [],
      },
    ],
    "campaign-battles": [
      eventBattle("AMS01", 0),
      eventBattle("AMS02", 1),
      battle("I01", "campaign1", 0),
      battle("FoCE1", "elite2", 0),
      battle("FoCE2", "elite2", 1),
      battle("FoCE3", "elite2", 2),
      battle("FoCE4", "elite2", 3),
    ],
  })
  await seedPlayerData({
    "campaign-progress": [
      {
        tacticusCampaignId: "elite2",
        type: "Elite",
        highestCompletedBattleIndex: 2,
      },
    ],
    "campaign-events-progress": [
      {
        tacticusCampaignId: "eventCampaign1",
        type: "Standard",
        completedBattleCount: 1,
        completedChallengeBattlesIds: [],
      },
    ],
  })
})

describe("BattleProgressDialog", () => {
  it("opens on the planned battle's campaign and lists battles up to the frontier", async () => {
    render(
      <BattleProgressDialog battleId="FoCE2" onOpenChange={vi.fn()} open />,
      {
        auth: { authenticated: true },
      }
    )

    expect(
      await screen.findByTestId("battle-progress-row-FoCE1")
    ).toBeInTheDocument()
    expect(screen.getByTestId("battle-progress-row-FoCE3")).toHaveTextContent(
      "Not beaten yet"
    )
    expect(
      screen.queryByTestId("battle-progress-row-FoCE4")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("battle-progress-FoCE3-3")).toBeDisabled()
  })

  it("saves a battle below 3 medals with the saved revision and closes", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <BattleProgressDialog
        campaignGroupId="elite2"
        onOpenChange={onOpenChange}
        open
      />,
      { auth: { authenticated: true } }
    )

    await user.click(await screen.findByTestId("battle-progress-FoCE2-2"))
    await user.click(screen.getByTestId("battle-progress-save"))

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        battles: [
          {
            battleId: "FoCE2",
            medals: 2,
            lightningVictory: null,
            milestone: null,
          },
        ],
        revision: 4,
      })
    )
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("shows recorded medals and drops an entry set back to 3", async () => {
    saved.battles = [
      { battleId: "FoCE1", medals: 1, lightningVictory: null, milestone: null },
    ]
    const user = userEvent.setup()
    render(
      <BattleProgressDialog
        campaignGroupId="elite2"
        onOpenChange={vi.fn()}
        open
      />,
      { auth: { authenticated: true } }
    )

    expect(
      await screen.findByTestId("battle-progress-FoCE1-1")
    ).toHaveAttribute("data-state", "on")
    await user.click(screen.getByTestId("battle-progress-FoCE1-3"))
    await user.click(screen.getByTestId("battle-progress-save"))

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ battles: [], revision: 4 })
    )
  })

  it("defaults a beaten event battle to the best result and records what fell short", async () => {
    const user = userEvent.setup()
    render(
      <BattleProgressDialog
        campaignGroupId="eventCampaign1"
        campaignType="Standard"
        onOpenChange={vi.fn()}
        open
      />,
      { auth: { authenticated: true } }
    )

    expect(
      await screen.findByTestId("battle-progress-row-AMS01")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("battle-progress-row-AMS02")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("battle-progress-AMS01-3")).toHaveAttribute(
      "data-state",
      "on"
    )
    expect(
      screen.getByTestId("battle-progress-AMS01-lightning")
    ).toHaveAttribute("data-state", "on")
    expect(
      screen.getByTestId("battle-progress-AMS01-milestone-Gold")
    ).toHaveAttribute("data-state", "on")
    expect(
      screen.queryByTestId("battle-progress-rewards-AMS01")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("battle-progress-AMS01-best")
    ).not.toBeInTheDocument()

    await user.click(screen.getByTestId("battle-progress-AMS01-lightning"))
    await user.click(
      screen.getByTestId("battle-progress-AMS01-milestone-Silver")
    )

    expect(
      screen.getByTestId("battle-progress-rewards-AMS01")
    ).toBeInTheDocument()
    expect(screen.getByTestId("battle-progress-AMS01-best")).toBeInTheDocument()
    await user.click(screen.getByTestId("battle-progress-save"))
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        battles: [
          {
            battleId: "AMS01",
            medals: 3,
            lightningVictory: false,
            milestone: "Silver",
          },
        ],
        revision: 4,
      })
    )
  })

  it("restores the best result with Max", async () => {
    saved.battles = [
      {
        battleId: "AMS01",
        medals: 1,
        lightningVictory: false,
        milestone: "None",
      },
    ]
    const user = userEvent.setup()
    render(
      <BattleProgressDialog
        campaignGroupId="eventCampaign1"
        campaignType="Standard"
        onOpenChange={vi.fn()}
        open
      />,
      { auth: { authenticated: true } }
    )

    expect(
      await screen.findByTestId("battle-progress-AMS01-milestone-none")
    ).toHaveAttribute("data-state", "on")
    await user.click(screen.getByTestId("battle-progress-AMS01-best"))
    await user.click(screen.getByTestId("battle-progress-save"))
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ battles: [], revision: 4 })
    )
  })
})
