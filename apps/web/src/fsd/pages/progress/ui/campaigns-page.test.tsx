import { render, screen } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

const data = {
  definitions: [
    {
      id: "campaign1",
      groupId: "campaign1",
      releaseType: "standard",
      types: ["Standard"],
      coreCharacters: [],
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
      highestCompletedBattleIndex: 2,
    },
    {
      tacticusCampaignId: "elite1",
      type: "Elite",
      highestCompletedBattleIndex: 0,
    },
  ],
  characters: [],
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock("dexie-react-hooks", () => ({ useLiveQuery: () => data }))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCampaignBattles: vi.fn(),
  getCampaignDefinitions: vi.fn(),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getCampaignProgress: vi.fn(),
  getPlayerCharacters: vi.fn(),
}))

import { CampaignsPage } from "./campaigns-page"

describe("CampaignsPage", () => {
  it("renders synchronized campaign summaries without editing controls", () => {
    render(<CampaignsPage />)

    expect(screen.getByTestId("campaigns-page")).toBeInTheDocument()
    expect(screen.getAllByText("3/3").length).toBeGreaterThan(0)
    expect(screen.getAllByText("1/2").length).toBeGreaterThan(0)
    expect(screen.queryByRole("slider")).not.toBeInTheDocument()
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument()
  })
})
