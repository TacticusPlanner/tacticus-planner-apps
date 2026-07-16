import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"

const getProgress = vi.fn()
const saveProgress = vi.fn()
const account = { homeAccountId: "account-1" }

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
      .mockImplementation(
        (_instance: unknown, _account: unknown, value: unknown) =>
          Promise.resolve(value)
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

    await user.click(screen.getByTestId("save-onslaught-progress"))
    await waitFor(() => expect(saveProgress).toHaveBeenCalledTimes(1))
    expect(saveProgress.mock.calls[0]?.[0]).toEqual(progress)
  })
})
