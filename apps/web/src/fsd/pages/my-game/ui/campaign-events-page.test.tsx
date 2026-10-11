import { fireEvent, render, screen, waitFor } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getOverrides = vi.fn()
const saveOverrides = vi.fn()
const apiErrors = vi.hoisted(() => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  },
}))
const catalogData = {
  definitions: [
    {
      id: "eventCampaign1",
      groupId: "eventCampaign1",
      faction: "DeathGuard",
      releaseType: "event",
      coreCharacters: [],
      types: ["Standard", "Extremis"],
      battleIds: [],
    },
  ],
  battles: [
    ...Array.from({ length: 30 }, (_, index) => ({
      id: `AMS${String(index + 1).padStart(2, "0")}`,
      campaignGroupId: "eventCampaign1",
      type: "Standard",
      challenge: false,
      nodeNumber: index + 1,
    })),
    {
      id: "AMSC3B",
      campaignGroupId: "eventCampaign1",
      type: "Standard",
      challenge: true,
      nodeNumber: 3,
    },
    {
      id: "AMSC13B",
      campaignGroupId: "eventCampaign1",
      type: "Standard",
      challenge: true,
      nodeNumber: 13,
    },
    {
      id: "AMSC25B",
      campaignGroupId: "eventCampaign1",
      type: "Standard",
      challenge: true,
      nodeNumber: 25,
    },
  ],
  synced: [
    {
      tacticusCampaignId: "eventCampaign1",
      type: "Standard",
      completedBattleCount: 2,
      completedChallengeBattlesIds: ["AMSC3B"],
    },
  ],
  characters: [],
}

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock("@/shared/api", () => ({ ApiError: apiErrors.ApiError }))
vi.mock("dexie-react-hooks", () => ({ useLiveQuery: () => catalogData }))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCampaignBattles: vi.fn(),
  getCampaignDefinitions: vi.fn(),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getCampaignEventProgress: vi.fn(),
  getPlayerCharacters: vi.fn(),
}))
vi.mock("@/entities/player-data-override", () => ({
  campaignEventProgressQueries: {
    current: () => ({
      queryKey: ["player-data-overrides", "campaign-events", "current"],
      queryFn: () => getOverrides(),
    }),
  },
  updateCampaignEventProgressOverrides: (...args: unknown[]) =>
    saveOverrides(...args),
}))

import { CampaignEventsPage } from "./campaign-events-page"

describe("CampaignEventsPage", () => {
  beforeEach(() => {
    getOverrides.mockReset().mockResolvedValue({ progress: [], revision: 4 })
    saveOverrides
      .mockReset()
      .mockImplementation((request) =>
        Promise.resolve({ ...request, revision: request.revision + 1 })
      )
  })

  it("edits sequential progress and non-sequential challenge ids and adopts the saved revision", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CampaignEventsPage />
      </MemoryRouter>
    )

    expect(
      await screen.findByTestId("campaign-events-page")
    ).toBeInTheDocument()
    fireEvent.change(
      screen.getByLabelText("progress.events.regularProgress Standard"),
      { target: { value: "5" } }
    )
    await user.click(screen.getByRole("button", { name: "25B" }))
    await user.click(
      screen.getByRole("button", { name: "progress.events.save" })
    )

    await waitFor(() =>
      expect(saveOverrides).toHaveBeenCalledWith(
        {
          progress: [
            {
              campaignGroupId: "eventCampaign1",
              type: "Standard",
              completedBattleCount: 5,
              completedChallengeBattlesIds: ["AMSC3B", "AMSC25B"],
            },
          ],
          revision: 4,
        },
        expect.anything()
      )
    )

    await user.click(screen.getByRole("button", { name: "13B" }))
    await user.click(
      screen.getByRole("button", { name: "progress.events.save" })
    )
    await waitFor(() => expect(saveOverrides.mock.calls[1][0].revision).toBe(5))
  })

  it("refreshes current server progress after a stale revision", async () => {
    const user = userEvent.setup()
    getOverrides
      .mockReset()
      .mockResolvedValueOnce({ progress: [], revision: 4 })
      .mockResolvedValueOnce({
        progress: [
          {
            campaignGroupId: "eventCampaign1",
            type: "Standard",
            completedBattleCount: 7,
            completedChallengeBattlesIds: null,
          },
        ],
        revision: 9,
      })
    saveOverrides.mockRejectedValueOnce(new apiErrors.ApiError(409, "stale"))

    render(
      <MemoryRouter>
        <CampaignEventsPage />
      </MemoryRouter>
    )
    const input = await screen.findByLabelText(
      "progress.events.regularProgress Standard"
    )
    fireEvent.change(input, { target: { value: "5" } })
    await user.click(
      screen.getByRole("button", { name: "progress.events.save" })
    )

    expect(
      await screen.findByText("progress.events.conflict")
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText("progress.events.regularProgress Standard")
    ).toHaveValue(7)
    expect(getOverrides).toHaveBeenCalledTimes(2)
  })
})
