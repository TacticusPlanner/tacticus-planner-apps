import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"

import { ApiError } from "@/shared/api"

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

const strings: Record<string, string> = {
  "onslaught.position": "{{sector}} · Tier {{tier}}",
  "onslaught.positionComplete": "{{sector}} · Sector complete",
  "onslaught.tierNumber": "Tier {{tier}}",
}
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      let text =
        strings[key] ??
        key.replace(/^onslaught\.sectors\./, "").replace(/^alliances\./, "")
      for (const [name, value] of Object.entries(options ?? {})) {
        text = text.replace(`{{${name}}}`, String(value))
      }
      return text
    },
  }),
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
      queryKey: ["player-data-overrides", "onslaught", "current"],
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
  imperial: { sector: "Gold", tier: 2, isSet: true },
  xenos: { sector: "Diamond", tier: 3, isSet: true },
  chaos: { sector: "Silver", tier: 1, isSet: true },
  revision: 4,
}

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: "/progress/onslaught", element: <OnslaughtPage /> },
      { path: "/home", element: <div data-testid="home-page" /> },
    ],
    { initialEntries: ["/progress/onslaught"] }
  )
  const view = render(<RouterProvider router={router} />)
  return { ...view, router }
}

const saveButton = () => screen.getByTestId("save-onslaught-progress")

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
    renderPage()

    expect(await screen.findByTestId("onslaught-page")).toBeInTheDocument()
    expect(screen.getByTestId("imperial-onslaught-sector")).toHaveTextContent(
      "Gold"
    )
    expect(screen.getByText("Gold · Tier 2")).toBeInTheDocument()
    expect(screen.getByTestId("imperial-onslaught-tier")).toHaveTextContent(
      "Tier 2"
    )
    expect(screen.getByTestId("imperial-onslaught-yield")).toHaveTextContent(
      "onslaught.yieldPerRun"
    )
    expect(screen.getByTestId("imperial-onslaught-yield")).toHaveTextContent(
      "2-3"
    )
    expect(screen.getByTestId("onslaught-progress-help")).toHaveTextContent(
      "onslaught.help"
    )
    expect(screen.queryByTestId("imperial-onslaught-not-set")).toBeNull()

    await user.click(screen.getByTestId("imperial-onslaught-sector"))
    await user.click(screen.getByRole("option", { name: /Iron · Tier 2/ }))
    // Gold -> Iron moves down a sector, so Iron is marked complete.
    expect(screen.getByTestId("imperial-onslaught-complete")).toBeChecked()
    await user.click(screen.getByTestId("imperial-onslaught-tier"))
    // The Tier select offers only the farmable tiers; completion is a separate checkbox.
    expect(screen.getAllByRole("option")).toHaveLength(3)
    await user.click(screen.getByRole("option", { name: /Iron · Tier 2/ }))
    expect(screen.getByTestId("imperial-onslaught-complete")).not.toBeChecked()
    expect(screen.getByTestId("imperial-onslaught-tier")).toHaveTextContent(
      "Tier 2"
    )
    await user.click(screen.getByTestId("imperial-onslaught-complete"))

    expect(screen.getByTestId("imperial-onslaught-sector")).toHaveTextContent(
      "Iron"
    )
    expect(screen.getByTestId("imperial-onslaught-complete")).toBeChecked()
    expect(screen.getByTestId("imperial-onslaught-tier")).toHaveTextContent(
      "Tier 3"
    )

    await user.click(screen.getByTestId("save-onslaught-progress"))
    await waitFor(() => expect(saveProgress).toHaveBeenCalledTimes(1))
    expect(saveProgress.mock.calls[0]?.[0]).toEqual({
      ...progress,
      imperial: { sector: "Iron", tier: 4, isSet: true },
    })
    expect(await screen.findByText("onslaught.saved")).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()

    // The next save carries the revision the first one returned.
    await user.click(screen.getByTestId("imperial-onslaught-complete"))
    await user.click(saveButton())
    await waitFor(() => expect(saveProgress).toHaveBeenCalledTimes(2))
    expect(saveProgress.mock.calls[1]?.[0]).toMatchObject({ revision: 5 })
  }, 10_000)

  it("resets the tier when the sector changes", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId("onslaught-page")

    await user.click(screen.getByTestId("imperial-onslaught-sector"))
    await user.click(screen.getByRole("option", { name: /Diamond · Tier 2/ }))
    expect(screen.getByTestId("imperial-onslaught-tier")).toHaveTextContent(
      "Tier 1"
    )

    await user.click(screen.getByTestId("imperial-onslaught-sector"))
    await user.click(screen.getByRole("option", { name: /Gold · Tier 1/ }))
    // Moving down lands on the completed lower sector.
    expect(screen.getByTestId("imperial-onslaught-complete")).toBeChecked()
    expect(screen.getByTestId("imperial-onslaught-tier")).toHaveTextContent(
      "Tier 3"
    )

    // Unchecking returns to tier 3; moving up starts the new sector at tier 1, unchecked.
    await user.click(screen.getByTestId("imperial-onslaught-complete"))
    expect(screen.getByTestId("imperial-onslaught-complete")).not.toBeChecked()
    expect(screen.getByTestId("imperial-onslaught-tier")).toHaveTextContent(
      "Tier 3"
    )
    await user.click(screen.getByTestId("imperial-onslaught-complete"))
    await user.click(screen.getByTestId("imperial-onslaught-sector"))
    await user.click(
      screen.getByRole("option", { name: /Diamond · Sector complete/ })
    )
    expect(screen.getByTestId("imperial-onslaught-complete")).not.toBeChecked()
    expect(screen.getByTestId("imperial-onslaught-tier")).toHaveTextContent(
      "Tier 1"
    )
  })

  it("reloads the latest values after a stale-revision conflict", async () => {
    const user = userEvent.setup()
    const refreshed = {
      ...progress,
      imperial: { sector: "Adamantine", tier: 4, isSet: true },
      revision: 9,
    }
    getProgress.mockResolvedValueOnce(progress).mockResolvedValueOnce(refreshed)
    saveProgress.mockRejectedValueOnce(new ApiError(409, "stale revision"))
    renderPage()

    expect(await screen.findByTestId("onslaught-page")).toBeInTheDocument()
    await user.click(screen.getByTestId("imperial-onslaught-complete"))
    await user.click(saveButton())

    expect(await screen.findByText("onslaught.conflict")).toBeInTheDocument()
    expect(screen.getByTestId("imperial-onslaught-sector")).toHaveTextContent(
      "Adamantine"
    )
    // The reloaded values replace the draft, so there is nothing left to save.
    expect(saveButton()).toBeDisabled()
  })

  it("shows unsaved alliances as not set and only marks an edited one as set", async () => {
    const user = userEvent.setup()
    const unset = { sector: "Stone", tier: 1, isSet: false }
    getProgress.mockResolvedValue({
      imperial: unset,
      xenos: unset,
      chaos: unset,
      revision: 0,
    })
    renderPage()

    expect(await screen.findByTestId("onslaught-page")).toBeInTheDocument()
    expect(screen.getByTestId("imperial-onslaught-not-set")).toHaveTextContent(
      "onslaught.notSet"
    )
    expect(screen.getByTestId("imperial-onslaught-sector")).toHaveTextContent(
      "onslaught.notSet"
    )
    expect(screen.getByTestId("imperial-onslaught-tier")).toBeDisabled()
    expect(screen.getByTestId("imperial-onslaught-complete")).toBeDisabled()
    expect(screen.getByTestId("imperial-onslaught-yield")).toHaveTextContent(
      "onslaught.notSetHint"
    )
    // An unset alliance is never highlighted as being at Stone 1 in the reference table.
    expect(screen.queryByRole("img", { name: "Imperial" })).toBeNull()

    await user.click(screen.getByTestId("imperial-onslaught-sector"))
    await user.click(screen.getByRole("option", { name: /Silver · Tier 1/ }))
    expect(screen.queryByTestId("imperial-onslaught-not-set")).toBeNull()
    expect(screen.getByTestId("imperial-onslaught-tier")).toHaveTextContent(
      "Tier 1"
    )

    await user.click(screen.getByTestId("save-onslaught-progress"))
    await waitFor(() => expect(saveProgress).toHaveBeenCalledTimes(1))
    expect(saveProgress.mock.calls[0]?.[0]).toEqual({
      imperial: { sector: "Silver", tier: 1, isSet: true },
      xenos: unset,
      chaos: unset,
      revision: 0,
    })
  })

  describe("unsaved changes", () => {
    const pickTier = async (
      user: ReturnType<typeof userEvent.setup>,
      name: RegExp
    ) => {
      await user.click(screen.getByTestId("imperial-onslaught-tier"))
      await user.click(screen.getByRole("option", { name }))
    }

    it("enables Save only while the values differ from the saved ones", async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByTestId("onslaught-page")
      expect(saveButton()).toBeDisabled()

      await pickTier(user, /Gold · Tier 3/)
      expect(saveButton()).toBeEnabled()

      // Changing the value back leaves nothing to save.
      await pickTier(user, /Gold · Tier 2/)
      expect(saveButton()).toBeDisabled()
    })

    it("asks before leaving with unsaved edits", async () => {
      const user = userEvent.setup()
      const { router } = renderPage()
      await screen.findByTestId("onslaught-page")
      await pickTier(user, /Gold · Tier 3/)

      void router.navigate("/home")
      expect(
        await screen.findByText("onslaught.leave.title")
      ).toBeInTheDocument()
      await user.click(
        screen.getByRole("button", { name: "onslaught.leave.stay" })
      )
      expect(screen.getByTestId("onslaught-page")).toBeInTheDocument()
      expect(screen.getByTestId("imperial-onslaught-tier")).toHaveTextContent(
        "Tier 3"
      )

      void router.navigate("/home")
      await user.click(
        await screen.findByRole("button", { name: "onslaught.leave.leave" })
      )
      expect(await screen.findByTestId("home-page")).toBeInTheDocument()
    })

    it("navigates without asking when there are no edits", async () => {
      const { router } = renderPage()
      await screen.findByTestId("onslaught-page")
      void router.navigate("/home")
      expect(await screen.findByTestId("home-page")).toBeInTheDocument()
    })

    it("navigates without asking once the edits are saved", async () => {
      const user = userEvent.setup()
      const { router } = renderPage()
      await screen.findByTestId("onslaught-page")
      await pickTier(user, /Gold · Tier 3/)
      await user.click(saveButton())
      expect(await screen.findByText("onslaught.saved")).toBeInTheDocument()

      void router.navigate("/home")
      expect(await screen.findByTestId("home-page")).toBeInTheDocument()
    })
  })
})
