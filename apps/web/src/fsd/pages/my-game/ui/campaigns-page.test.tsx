import { beforeEach, describe, expect, it } from "vitest"

import { render, screen } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

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
})
