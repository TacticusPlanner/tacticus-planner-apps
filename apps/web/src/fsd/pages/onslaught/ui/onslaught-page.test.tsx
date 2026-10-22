import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "@/shared/api"
import { render, screen, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

const getProgress = vi.fn()
const saveProgress = vi.fn()
const mobile = vi.hoisted(() => ({ value: false }))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))

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

import { useTourPageSteps } from "@/shared/tour"

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
      { path: "/my-game/onslaught", element: <OnslaughtPage /> },
      {
        path: "/my-game/campaigns",
        element: <div data-testid="campaigns-page" />,
      },
    ],
    { initialEntries: ["/my-game/onslaught"] }
  )
  const view = render(<RouterProvider router={router} />, {
    auth: { authenticated: true },
  })
  return { ...view, router }
}

const saveBar = () => screen.queryByTestId("unsaved-changes-bar")

describe("OnslaughtPage", () => {
  beforeEach(async () => {
    mobile.value = false
    await seedGameCatalog({ "onslaught-rewards": [{ id: "Stone-1" }] })
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
      "Shards per run at this position"
    )
    expect(screen.getByTestId("imperial-onslaught-yield")).toHaveTextContent(
      "2-3"
    )
    expect(screen.getByTestId("onslaught-progress-help")).toHaveTextContent(
      /^Pick the sector and tier you are currently farming/
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

    await user.click(screen.getByTestId("unsaved-changes-save"))
    await waitFor(() => expect(saveProgress).toHaveBeenCalledTimes(1))
    expect(saveProgress.mock.calls[0]?.[0]).toEqual({
      ...progress,
      imperial: { sector: "Iron", tier: 4, isSet: true },
    })
    expect(
      await screen.findByText("Onslaught progress saved.")
    ).toBeInTheDocument()
    // The saved values are the new baseline, and there is no Save button outside the bar.
    expect(saveBar()).toBeNull()
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull()

    await user.click(screen.getByTestId("imperial-onslaught-complete"))
    await user.click(screen.getByTestId("unsaved-changes-save"))
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
    await user.click(screen.getByTestId("xenos-onslaught-complete"))
    await user.click(screen.getByTestId("unsaved-changes-save"))

    expect(
      await screen.findByText(
        "Onslaught progress changed elsewhere. Latest values loaded; apply your change again."
      )
    ).toBeInTheDocument()
    expect(screen.getByTestId("imperial-onslaught-sector")).toHaveTextContent(
      "Adamantine"
    )
    expect(screen.getByTestId("xenos-onslaught-complete")).not.toBeChecked()
    expect(saveBar()).toBeNull()
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
      "Not set"
    )
    expect(screen.getByTestId("imperial-onslaught-sector")).toHaveTextContent(
      "Not set"
    )
    expect(screen.getByTestId("imperial-onslaught-tier")).toBeDisabled()
    expect(screen.getByTestId("imperial-onslaught-complete")).toBeDisabled()
    expect(screen.getByTestId("imperial-onslaught-yield")).toHaveTextContent(
      "Choose the sector this alliance is in to see its shards per run."
    )
    // An unset alliance is never highlighted as being at Stone 1 in the reference table.
    expect(screen.queryByRole("img", { name: "Imperial" })).toBeNull()

    await user.click(screen.getByTestId("imperial-onslaught-sector"))
    await user.click(screen.getByRole("option", { name: /Silver · Tier 1/ }))
    expect(screen.queryByTestId("imperial-onslaught-not-set")).toBeNull()
    expect(screen.getByTestId("imperial-onslaught-tier")).toHaveTextContent(
      "Tier 1"
    )

    await user.click(screen.getByTestId("unsaved-changes-save"))
    await waitFor(() => expect(saveProgress).toHaveBeenCalledTimes(1))
    expect(saveProgress.mock.calls[0]?.[0]).toEqual({
      imperial: { sector: "Silver", tier: 1, isSet: true },
      xenos: unset,
      chaos: unset,
      revision: 0,
    })
  })

  it("shows the bar only while the draft differs from the saved progress", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId("onslaught-page")
    expect(saveBar()).toBeNull()

    await user.click(screen.getByTestId("imperial-onslaught-tier"))
    await user.click(screen.getByRole("option", { name: /Gold · Tier 3/ }))
    expect(saveBar()).toBeInTheDocument()

    await user.click(screen.getByTestId("imperial-onslaught-tier"))
    await user.click(screen.getByRole("option", { name: /Gold · Tier 2/ }))
    expect(saveBar()).toBeNull()
  })

  it("discards every edit", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId("onslaught-page")
    await user.click(screen.getByTestId("imperial-onslaught-tier"))
    await user.click(screen.getByRole("option", { name: /Gold · Tier 3/ }))
    await user.click(screen.getByTestId("xenos-onslaught-complete"))

    await user.click(screen.getByTestId("unsaved-changes-discard"))
    expect(screen.getByTestId("imperial-onslaught-tier")).toHaveTextContent(
      "Tier 2"
    )
    expect(screen.getByTestId("xenos-onslaught-complete")).not.toBeChecked()
    expect(saveBar()).toBeNull()
    expect(saveProgress).not.toHaveBeenCalled()
  })

  it("disables both bar actions while saving", async () => {
    const user = userEvent.setup()
    saveProgress.mockReturnValueOnce(new Promise(() => {}))
    renderPage()
    await screen.findByTestId("onslaught-page")
    await user.click(screen.getByTestId("xenos-onslaught-complete"))
    await user.click(screen.getByTestId("unsaved-changes-save"))

    await waitFor(() =>
      expect(screen.getByTestId("unsaved-changes-save")).toBeDisabled()
    )
    expect(screen.getByTestId("unsaved-changes-discard")).toBeDisabled()
  })

  it("shows the translated error, never the API text, and keeps the edits", async () => {
    const user = userEvent.setup()
    saveProgress.mockRejectedValueOnce(
      new ApiError(400, "Raw server validation text")
    )
    renderPage()
    await screen.findByTestId("onslaught-page")
    await user.click(screen.getByTestId("xenos-onslaught-complete"))
    await user.click(screen.getByTestId("unsaved-changes-save"))

    expect(
      await screen.findByText(
        "Couldn't save Onslaught progress. Your changes are still here; try again."
      )
    ).toBeInTheDocument()
    expect(screen.queryByText("Raw server validation text")).toBeNull()
    expect(screen.getByTestId("xenos-onslaught-complete")).toBeChecked()
    expect(saveBar()).toBeInTheDocument()
  })

  it("asks before leaving with unsaved edits", async () => {
    const user = userEvent.setup()
    const { router } = renderPage()
    await screen.findByTestId("onslaught-page")
    await user.click(screen.getByTestId("xenos-onslaught-complete"))

    void router.navigate("/my-game/campaigns")
    expect(await screen.findByText("Leave without saving?")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Stay" }))
    expect(screen.getByTestId("onslaught-page")).toBeInTheDocument()
    expect(screen.getByTestId("xenos-onslaught-complete")).toBeChecked()

    void router.navigate("/my-game/campaigns")
    await user.click(await screen.findByRole("button", { name: "Leave" }))
    expect(await screen.findByTestId("campaigns-page")).toBeInTheDocument()
  })

  it("navigates without asking when there are no edits", async () => {
    const { router } = renderPage()
    await screen.findByTestId("onslaught-page")
    void router.navigate("/my-game/campaigns")
    expect(await screen.findByTestId("campaigns-page")).toBeInTheDocument()
  })

  describe("tour", () => {
    it.each([
      ["desktop", false],
      ["mobile", true],
    ])(
      "every %s step targets an element on the page",
      async (_form, isMobile) => {
        mobile.value = isMobile
        renderPage()
        await screen.findByTestId("onslaught-page")
        const steps = vi.mocked(useTourPageSteps).mock.lastCall?.[0]
        const formSteps =
          (isMobile ? steps?.mobile : undefined) ?? steps?.desktop
        expect(formSteps?.length).toBeGreaterThan(0)
        for (const step of formSteps ?? []) {
          expect(
            document.querySelector(step.target as string),
            String(step.target)
          ).not.toBeNull()
        }
      }
    )
  })
})
