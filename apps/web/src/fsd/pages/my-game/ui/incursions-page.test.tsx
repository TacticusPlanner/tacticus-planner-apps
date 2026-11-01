import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"
import { incursionsFixture } from "@workspace/game-catalog/testing"

import { render, screen, within } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import { IncursionsPage } from "./incursions-page"

async function renderPage(data: unknown = incursionsFixture) {
  await seedGameCatalog({ incursions: data, npcs: [] })
  await seedPlayerData({ mows: [{ unitId: "tauBroadside" }] })
  const router = createMemoryRouter(
    [{ path: "/my-game/incursions", element: <IncursionsPage /> }],
    { initialEntries: ["/my-game/incursions"] }
  )
  return render(<RouterProvider router={router} />, {
    auth: { authenticated: true },
  })
}

describe("IncursionsPage", () => {
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
})
