import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

const flags = vi.hoisted(() => ({ manualBattles: false }))
vi.mock("@/shared/feature-flags", () => ({
  useFeatureFlag: (flag: string) =>
    flag === "ManualBattles" && flags.manualBattles,
}))

const { saved } = vi.hoisted(() => ({
  saved: {
    battles: [] as {
      battleId: string
      medals: number
      lightningVictory: boolean | null
      milestone: null
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

const data = {
  definitions: [
    {
      id: "campaign1",
      groupId: "campaign1",
      releaseType: "standard",
      types: ["Standard"],
      coreCharacters: ["unitA", "unitB"],
      battleIds: [],
    },
    {
      id: "elite1",
      groupId: "elite1",
      releaseType: "standard",
      types: ["Elite"],
      coreCharacters: [],
      battleIds: [],
    },
    {
      id: "mirror1",
      groupId: "mirror1",
      releaseType: "standard",
      types: ["Mirror"],
      coreCharacters: [],
      battleIds: [],
    },
  ],
  battles: [
    ...Array.from({ length: 3 }, (_, index) => ({
      id: `I${index}`,
      campaignGroupId: "campaign1",
      type: "Standard",
      challenge: false,
      battleIndex: index,
      lightningVictoryTurns: 5,
    })),
    ...Array.from({ length: 2 }, (_, index) => ({
      id: `IE${index}`,
      campaignGroupId: "elite1",
      type: "Elite",
      challenge: false,
    })),
    ...Array.from({ length: 3 }, (_, index) => ({
      id: `IM${index}`,
      campaignGroupId: "mirror1",
      type: "Mirror",
      challenge: false,
    })),
  ],
  progress: [
    {
      tacticusCampaignId: "campaign1",
      type: "Standard",
      highestCompletedBattleIndex: 3,
    },
    {
      tacticusCampaignId: "elite1",
      type: "Elite",
      highestCompletedBattleIndex: 1,
    },
  ],
  characters: [{ unitId: "unitA" }],
}

import { CampaignsPage } from "./campaigns-page"

beforeEach(async () => {
  flags.manualBattles = false
  saved.battles = []
  await seedGameCatalog({
    "campaign-definitions": data.definitions,
    "campaign-battles": data.battles,
  })
  await seedPlayerData({
    "campaign-progress": data.progress,
    characters: data.characters,
  })
})

describe("CampaignsPage", () => {
  it("renders synchronized campaign summaries without editing controls", async () => {
    render(<CampaignsPage />)

    expect(await screen.findByTestId("campaigns-page")).toBeInTheDocument()
    expect(screen.getAllByText("3/3").length).toBeGreaterThan(0)
    expect(screen.getAllByText("1/2").length).toBeGreaterThan(0)
    expect(screen.queryByRole("slider")).not.toBeInTheDocument()
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument()
  })

  it("shows the core characters the player owns, matched by roster unitId", async () => {
    render(<CampaignsPage />)

    expect(await screen.findByAltText("unitA")).toBeInTheDocument()
    expect(screen.queryByAltText("unitB")).not.toBeInTheDocument()
  })

  it("counts medals and Lightning Victories in completion once manual battles are on", async () => {
    flags.manualBattles = true
    saved.battles = [
      { battleId: "I0", medals: 1, lightningVictory: false, milestone: null },
    ]
    render(<CampaignsPage />, { auth: { authenticated: true } })

    const medals = await screen.findByTestId("campaign-medals-campaign1")
    // Beaten I0–I2 default to 3 medals + LV; I0 recorded at 1 medal, no LV.
    expect(medals).toHaveTextContent("7/9")
    expect(medals).toHaveTextContent("2/3")
    // (7 + 2) / (9 + 3)
    expect(screen.getAllByText("75%").length).toBeGreaterThan(0)
  })
})
