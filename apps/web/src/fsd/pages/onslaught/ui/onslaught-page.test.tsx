import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"

const getProgress = vi.fn()
const saveProgress = vi.fn()
const account = { homeAccountId: "account-1" }
const apiErrors = vi.hoisted(() => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  },
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: [account],
    instance: { getActiveAccount: () => account },
  }),
  useIsAuthenticated: () => true,
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/shared/api", () => ({ ApiError: apiErrors.ApiError }))

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (query: () => unknown) => query(),
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getOnslaughtRewards: () => [{ id: "Stone-1" }],
}))

vi.mock("@/entities/player-data-override", () => ({
  getOnslaughtProgress: (...args: unknown[]) => getProgress(...args),
  updateOnslaughtProgress: (...args: unknown[]) => saveProgress(...args),
  onslaughtProgressQueries: {
    current: () => ({
      queryKey: ["player-data-overrides", "onslaught"],
      queryFn: () => getProgress(),
    }),
  },
  onslaughtAlliances: ["Imperial", "Xenos", "Chaos"],
  onslaughtSectors: [
    "Stone",
    "Iron",
    "Bronze",
    "Silver",
    "Gold",
    "Diamond",
    "Adamantine",
  ],
  onslaughtTiers: [1, 2, 3, 4],
  rewardKeys: ["Common", "Legendary", "Mythic"],
  onslaughtReward: (
    _rewards: unknown,
    _sector: string,
    _tier: number,
    key: string
  ) => ({
    min: key === "Mythic" ? 1 : 2,
    max: key === "Mythic" ? 2 : 3,
    mythic: key === "Mythic",
  }),
}))

import { OnslaughtPage } from "./onslaught-page"

const progress = {
  imperial: { sector: "Gold", tier: 2 },
  xenos: { sector: "Diamond", tier: 3 },
  chaos: { sector: "Silver", tier: 1 },
  revision: 4,
}

describe("OnslaughtPage", () => {
  beforeEach(() => {
    getProgress.mockReset().mockResolvedValue(progress)
    saveProgress
      .mockReset()
      .mockImplementation((value: typeof progress) =>
        Promise.resolve({ ...value, revision: value.revision + 1 })
      )
  })

  it("loads alliance progress, renders the reward reference, and saves the revisioned values", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <OnslaughtPage />
      </MemoryRouter>
    )

    expect(await screen.findByTestId("onslaught-page")).toBeInTheDocument()
    expect(screen.getByTestId("imperial-onslaught-sector")).toHaveTextContent(
      "Gold"
    )
    expect(screen.getByText("Gold 2")).toBeInTheDocument()

    await user.click(screen.getByTestId("imperial-onslaught-sector"))
    await user.click(screen.getByRole("option", { name: /Iron tier 2/ }))
    await user.click(screen.getByTestId("imperial-onslaught-tier"))
    await user.click(screen.getByRole("option", { name: /Iron tier 4/ }))

    expect(screen.getByTestId("imperial-onslaught-sector")).toHaveTextContent(
      "Iron"
    )
    expect(screen.getByTestId("imperial-onslaught-tier")).toHaveTextContent(
      "onslaught.tierComplete"
    )

    await user.click(screen.getByTestId("save-onslaught-progress"))
    await waitFor(() => expect(saveProgress).toHaveBeenCalledTimes(1))
    expect(saveProgress.mock.calls[0]?.[0]).toEqual({
      ...progress,
      imperial: { sector: "Iron", tier: 4 },
    })
    expect(await screen.findByText("onslaught.saved")).toBeInTheDocument()

    await user.click(screen.getByTestId("save-onslaught-progress"))
    await waitFor(() => expect(saveProgress).toHaveBeenCalledTimes(2))
    expect(saveProgress.mock.calls[1]?.[0]).toMatchObject({ revision: 5 })
  })

  it("reloads the latest values after a stale-revision conflict", async () => {
    const user = userEvent.setup()
    const refreshed = {
      ...progress,
      imperial: { sector: "Adamantine", tier: 4 },
      revision: 9,
    }
    getProgress.mockResolvedValueOnce(progress).mockResolvedValueOnce(refreshed)
    saveProgress.mockRejectedValueOnce(
      new apiErrors.ApiError(409, "stale revision")
    )
    render(
      <MemoryRouter>
        <OnslaughtPage />
      </MemoryRouter>
    )

    expect(await screen.findByTestId("onslaught-page")).toBeInTheDocument()
    await user.click(screen.getByTestId("save-onslaught-progress"))

    expect(await screen.findByText("onslaught.conflict")).toBeInTheDocument()
    expect(screen.getByTestId("imperial-onslaught-sector")).toHaveTextContent(
      "Adamantine"
    )
  })
})
