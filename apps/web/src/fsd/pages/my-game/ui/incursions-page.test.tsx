import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { incursionsFixture } from "@workspace/game-catalog/testing"

import { render, screen, waitFor, within } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const getProgress = vi.fn()
const saveProgress = vi.fn()

vi.mock("@/entities/player-data-override", () => ({
  playerDataOverrideKey: ["player-data-overrides"],
  updateIncursionProgressOverrides: (...args: unknown[]) =>
    saveProgress(...args),
  incursionProgressQueries: {
    current: () => ({
      queryKey: ["player-data-overrides", "incursions-progress", "current"],
      queryFn: () => getProgress(),
    }),
  },
}))

import { IncursionsPage } from "./incursions-page"
import { IncursionMowPage } from "./incursions/incursion-mow-page"
import { IncursionTierPage } from "./incursions/incursion-tier-page"
import { IncursionsOverview } from "./incursions/incursions-overview"

async function renderPage({
  data = incursionsFixture as unknown,
  authenticated = true,
  at = "/my-game/incursions",
}: { data?: unknown; authenticated?: boolean; at?: string } = {}) {
  await seedGameCatalog({ incursions: data, npcs: [] })
  await seedPlayerData({ mows: [{ unitId: "tauBroadside" }] })
  const router = createMemoryRouter(
    [
      {
        path: "/my-game/incursions",
        element: <IncursionsPage />,
        children: [
          { index: true, element: <IncursionsOverview /> },
          { path: ":mowId", element: <IncursionMowPage /> },
          { path: ":mowId/:tier", element: <IncursionTierPage /> },
        ],
      },
    ],
    { initialEntries: [at] }
  )
  render(<RouterProvider router={router} />, { auth: { authenticated } })
  return router
}

describe("IncursionsPage", () => {
  beforeEach(() => {
    getProgress.mockReset().mockResolvedValue({
      // Common 1 cleared (battle 12 is its last step); battle 1 of Mythic 1 at 3 stars.
      battles: [
        { mowId: "tauBroadside", tierIndex: 0, battleId: "12", stars: 1 },
        { mowId: "tauBroadside", tierIndex: 12, battleId: "1", stars: 3 },
      ],
      revision: 4,
    })
    saveProgress
      .mockReset()
      .mockImplementation((value: { revision: number }) =>
        Promise.resolve({ ...value, revision: value.revision + 1 })
      )
  })

  it("lists every MoW newest first with the event rules, ownership and stars", async () => {
    const user = userEvent.setup()
    await renderPage()

    expect(await screen.findByTestId("incursions-rules")).not.toHaveTextContent(
      "run tokens"
    )
    await user.click(screen.getByTestId("incursions-rules-toggle"))
    expect(screen.getByTestId("incursions-rules")).toHaveTextContent(
      "You start with 2 run tokens and hold up to 3; one more arrives every 20 hours. Starting a run costs 1."
    )
    const rows = within(screen.getByTestId("incursions-list"))
      .getAllByTestId(/^incursion-[a-zA-Z]+$/)
      .map((row) => row.dataset.testid)
    expect(rows).toEqual([
      "incursion-necroReanimator",
      "incursion-tauBroadside",
    ])
    expect(
      screen.getByTestId("incursion-tauBroadside-owned")
    ).toHaveTextContent("Owned")
    expect(
      screen.getByTestId("incursion-necroReanimator-owned")
    ).toHaveTextContent("Not owned")
    expect(
      await screen.findByTestId("incursion-tauBroadside-cleared")
    ).toHaveTextContent("1/2 cleared")
    expect(
      screen.getByTestId("incursion-tauBroadside-stars")
    ).toHaveTextContent("4/81")
  })

  it("opens a MoW's tiers, grouped by rarity hardest first, with prev/next between MoWs", async () => {
    const user = userEvent.setup()
    const router = await renderPage()

    await user.click(await screen.findByTestId("incursion-tauBroadside-open"))
    const page = await screen.findByTestId("incursion-tauBroadside-page")
    expect(router.state.location.pathname).toBe(
      "/my-game/incursions/tauBroadside"
    )
    const tiers = within(page)
      .getAllByTestId(/^incursion-tier-\d+$/)
      .map((tier) => tier.dataset.testid)
    expect(tiers).toEqual(["incursion-tier-12", "incursion-tier-0"])
    expect(within(page).getByTestId("incursion-tier-12")).toHaveTextContent(
      "Tier 13"
    )
    expect(
      within(page).getByTestId("incursion-tier-12-stars")
    ).toHaveTextContent("3/45")
    expect(
      within(page).getByTestId("incursion-tauBroadside-team")
    ).toHaveTextContent("Sync your roster to see a suggested team")
    expect(screen.getByTestId("incursion-nav-position")).toHaveTextContent(
      "2 of 2"
    )
    expect(screen.getByTestId("incursion-nav-next")).toBeDisabled()

    await user.click(screen.getByTestId("incursion-nav-previous"))
    expect(
      await screen.findByTestId("incursion-necroReanimator-page")
    ).toBeInTheDocument()
    await user.click(screen.getByTestId("incursion-nav-back"))
    expect(await screen.findByTestId("incursions-list")).toBeInTheDocument()
  })

  it("opens a tier's run map and steps between tiers", async () => {
    const user = userEvent.setup()
    getProgress.mockResolvedValue({ battles: [], revision: 0 })
    const router = await renderPage({
      at: "/my-game/incursions/tauBroadside",
    })

    await user.click(await screen.findByTestId("incursion-tier-0-open"))
    expect(await screen.findByTestId("incursion-tier-title")).toHaveTextContent(
      "Tier 1"
    )
    expect(router.state.location.pathname).toBe(
      "/my-game/incursions/tauBroadside/1"
    )
    expect(screen.getByTestId("incursion-tier-summary")).toHaveTextContent(
      "12 battles"
    )
    expect(screen.getByTestId("incursion-best-path")).toHaveTextContent(
      "Up to 32 shards per clear"
    )
    expect(
      screen.getAllByTestId("incursion-step-choice").length
    ).toBeGreaterThan(0)
    expect(screen.getByTestId("incursion-map-node-9")).toHaveAccessibleName(
      "Battle 5"
    )
    await user.click(screen.getByTestId("incursion-map-node-7"))
    expect(screen.getByTestId("incursion-node-7")).toHaveAttribute(
      "data-kind",
      "chest"
    )
    expect(screen.getByTestId("incursion-nav-previous")).toBeDisabled()

    await user.click(screen.getByTestId("incursion-nav-next"))
    expect(await screen.findByTestId("incursion-tier-title")).toHaveTextContent(
      "Tier 13"
    )
    expect(screen.getByTestId("incursion-best-path")).toHaveTextContent(
      "Up to 18 shards and 6 mythic shards per clear"
    )
  })

  it("says so when the catalog has no Incursions yet", async () => {
    await renderPage({ data: [] })

    expect(await screen.findByTestId("incursions-empty")).toBeInTheDocument()
  })

  it("goes back to the list for an unknown MoW, and to the MoW for an unknown tier", async () => {
    const router = await renderPage({ at: "/my-game/incursions/nope" })
    expect(await screen.findByTestId("incursions-list")).toBeInTheDocument()

    await router.navigate("/my-game/incursions/tauBroadside/99")
    expect(
      await screen.findByTestId("incursion-tauBroadside-page")
    ).toBeInTheDocument()
  })

  it("shows what's left in a tier and saves battle stars set across tiers", async () => {
    const user = userEvent.setup()
    await renderPage({ at: "/my-game/incursions/tauBroadside/13" })

    // Mythic 1: battle 1 is raidable and 22 one-time shards remain.
    await user.click(await screen.findByTestId("incursion-map-node-0"))
    expect(screen.getByTestId("incursion-node-0-raidable")).toBeInTheDocument()
    expect(screen.getByTestId("incursion-tier-one-time")).toHaveTextContent(
      "22 one-time shards left in this tier"
    )
    expect(screen.getByTestId("incursion-tier-stars")).toHaveTextContent("3/45")

    // Common 1 is cleared, so a replay pays only its chests.
    await user.click(screen.getByTestId("incursion-nav-previous"))
    expect(
      await screen.findByTestId("incursion-replay-rewards")
    ).toBeInTheDocument()
    expect(screen.queryByTestId("incursion-best-path")).not.toBeInTheDocument()

    await user.click(screen.getByTestId("incursion-map-node-24"))
    await user.click(screen.getByTestId("incursion-node-24-stars-0"))
    expect(screen.getByTestId("incursion-best-path")).toBeInTheDocument()
    await user.click(screen.getByTestId("incursion-map-node-0"))
    await user.click(screen.getByTestId("incursion-node-0-stars-3"))
    // Moving between tiers keeps the unsaved stars without asking.
    await user.click(screen.getByTestId("incursion-nav-back"))
    expect(
      await screen.findByTestId("incursion-progress-remaining")
    ).toHaveTextContent("39 shards left")
    expect(screen.queryByText("Leave without saving?")).toBeNull()
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(saveProgress).toHaveBeenCalledWith({
        battles: [
          { mowId: "tauBroadside", tierIndex: 12, battleId: "1", stars: 3 },
          { mowId: "tauBroadside", tierIndex: 0, battleId: "1", stars: 3 },
        ],
        revision: 4,
      })
    )
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Incursion progress saved.")
    )
    expect(screen.queryByTestId("incursions-message")).toBeNull()
  })

  it("marks a whole tier at 3 stars and resets it", async () => {
    const user = userEvent.setup()
    getProgress.mockResolvedValue({ battles: [], revision: 0 })
    await renderPage({ at: "/my-game/incursions/tauBroadside/1" })

    await user.click(await screen.findByTestId("incursion-tier-mark-cleared"))
    expect(screen.getByTestId("incursion-tier-stars")).toHaveTextContent(
      "36/36"
    )
    expect(screen.getByTestId("incursion-tier-stars-full")).toBeInTheDocument()
    expect(screen.getByTestId("incursion-replay-rewards")).toBeInTheDocument()
    expect(screen.getByTestId("incursion-tier-mark-cleared")).toBeDisabled()

    await user.click(screen.getByTestId("incursion-tier-reset"))
    expect(screen.getByTestId("incursion-tier-stars")).toHaveTextContent("0/36")
    expect(screen.getByTestId("incursion-best-path")).toBeInTheDocument()
  })

  it("marks and resets a tier from the tier list, and shows its rewards", async () => {
    const user = userEvent.setup()
    getProgress.mockResolvedValue({ battles: [], revision: 0 })
    await renderPage({ at: "/my-game/incursions/tauBroadside" })

    await user.click(await screen.findByTestId("incursion-tier-0-mark-cleared"))
    expect(screen.getByTestId("incursion-tier-0-stars")).toHaveTextContent(
      "36/36"
    )
    expect(screen.getByTestId("incursion-tier-0")).toHaveAttribute(
      "data-cleared",
      "true"
    )
    await user.click(screen.getByTestId("incursion-tier-0-reset"))
    expect(screen.getByTestId("incursion-tier-0-stars")).toHaveTextContent(
      "0/36"
    )

    expect(
      screen.getByTestId("incursion-tier-0-rewards-shards")
    ).toBeInTheDocument()
    await user.click(screen.getByTestId("incursion-tier-0-rewards-all"))
    expect(
      await screen.findByTestId("incursion-tier-0-rewards-popover")
    ).toBeInTheDocument()
    expect(
      screen
        .getByTestId("incursion-tier-0-rewards-shards")
        .querySelector("[data-shard='regular']")
    ).not.toBeNull()
  })

  it("asks a signed-out visitor to sign in instead of showing progress", async () => {
    await renderPage({
      authenticated: false,
      at: "/my-game/incursions/tauBroadside/1",
    })

    expect(await screen.findByTestId("incursions-sign-in")).toBeInTheDocument()
    expect(
      screen.queryByTestId("incursion-tier-progress")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("incursion-node-0-stars-0")).toBeNull()
    expect(getProgress).not.toHaveBeenCalled()
  })
})
