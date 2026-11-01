import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { incursionsFixture } from "@workspace/game-catalog/testing"

import { render, screen, waitFor, within } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

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

async function renderPage(
  data: unknown = incursionsFixture,
  authenticated = true
) {
  await seedGameCatalog({ incursions: data, npcs: [] })
  await seedPlayerData({ mows: [{ unitId: "tauBroadside" }] })
  const router = createMemoryRouter(
    [{ path: "/my-game/incursions", element: <IncursionsPage /> }],
    { initialEntries: ["/my-game/incursions"] }
  )
  return render(<RouterProvider router={router} />, {
    auth: { authenticated },
  })
}

describe("IncursionsPage", () => {
  beforeEach(() => {
    getProgress.mockReset().mockResolvedValue({
      progress: [{ mowId: "tauBroadside", tiersCleared: 1 }],
      revision: 4,
    })
    saveProgress
      .mockReset()
      .mockImplementation((value: { revision: number }) =>
        Promise.resolve({ ...value, revision: value.revision + 1 })
      )
  })

  it("lists every MoW newest first with the event rules and ownership", async () => {
    await renderPage()

    expect(await screen.findByTestId("incursions-rules")).toHaveTextContent(
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
  })

  it("shows a tier's totals and run map, and switches tiers", async () => {
    const user = userEvent.setup()
    getProgress.mockResolvedValue({ progress: [], revision: 0 })
    await renderPage()

    await user.click(
      await screen.findByTestId("incursion-tauBroadside-trigger")
    )
    const item = within(screen.getByTestId("incursion-tauBroadside"))
    expect(item.getByTestId("incursion-tier-summary")).toHaveTextContent(
      "12 battles"
    )
    expect(item.getByTestId("incursion-best-path")).toHaveTextContent(
      "Up to 32 shards per clear"
    )
    expect(item.getAllByTestId("incursion-step-choice").length).toBeGreaterThan(
      0
    )
    expect(item.getByTestId("incursion-node-7")).toHaveAttribute(
      "data-kind",
      "chest"
    )

    await user.click(item.getByTestId("incursion-tier-select"))
    await user.click(await screen.findByRole("option", { name: "Mythic 1" }))
    expect(item.getByTestId("incursion-best-path")).toHaveTextContent(
      "Up to 18 shards and 6 mythic shards per clear"
    )
  })

  it("says so when the catalog has no Incursions yet", async () => {
    await renderPage([])

    expect(await screen.findByTestId("incursions-empty")).toBeInTheDocument()
  })

  it("opens on the next tier, shows what's left and saves the tiers cleared", async () => {
    const user = userEvent.setup()
    await renderPage()

    expect(
      await screen.findByTestId("incursion-tauBroadside-cleared")
    ).toHaveTextContent("1/2 cleared")
    expect(
      screen.getByTestId("incursion-necroReanimator-cleared")
    ).toHaveTextContent("0/1 cleared")
    await user.click(screen.getByTestId("incursion-tauBroadside-trigger"))
    const item = within(screen.getByTestId("incursion-tauBroadside"))
    expect(item.getByTestId("incursion-best-path")).toHaveTextContent(
      "Up to 18 shards and 6 mythic shards per clear"
    )
    expect(item.getByTestId("incursion-progress-remaining")).toHaveTextContent(
      "18 shards and 6 mythic shards left in the tiers you haven't cleared"
    )

    await user.click(item.getByTestId("incursion-progress-select"))
    await user.click(await screen.findByRole("option", { name: "None yet" }))
    expect(item.getByTestId("incursion-progress-remaining")).toHaveTextContent(
      "50 shards and 6 mythic shards left"
    )
    await user.click(await screen.findByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(saveProgress).toHaveBeenCalledWith({ progress: [], revision: 4 })
    )
    expect(await screen.findByTestId("incursions-message")).toHaveTextContent(
      "Incursion progress saved."
    )
  })

  it("asks a signed-out visitor to sign in instead of showing progress", async () => {
    await renderPage(incursionsFixture, false)

    expect(await screen.findByTestId("incursions-sign-in")).toBeInTheDocument()
    expect(
      screen.queryByTestId("incursion-tauBroadside-cleared")
    ).not.toBeInTheDocument()
    expect(getProgress).not.toHaveBeenCalled()
  })
})
