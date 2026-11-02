import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"
import { incursionsFixture } from "@workspace/game-catalog/testing"

import { render, screen } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { IncursionTile } from "./incursion-tile"

describe("IncursionTile", () => {
  it("features the newest MoW, nudges to track progress and opens Incursions", async () => {
    await seedGameCatalog({ incursions: incursionsFixture as unknown })
    render(
      <MemoryRouter>
        <IncursionTile nowMs={Date.parse("2026-10-03T12:00:00Z")} />
      </MemoryRouter>
    )

    const tile = screen.getByTestId("home-incursion")
    expect(tile).toHaveAttribute("href", "/my-game/incursions")
    expect(tile).toHaveTextContent("Track your progress")
    expect(await screen.findByTestId("home-incursion-mow")).toHaveTextContent(
      "Newest:"
    )
  })

  it("counts down to the end of the running Incursion", async () => {
    const run = {
      occurrenceId: "occ-incursion",
      definitionId: "incursion",
      confirmed: true,
      startUtc: "2026-10-02T08:00:00Z",
      endUtc: "2026-10-07T08:00:00Z",
      parameters: null,
    }
    await seedGameCatalog({
      incursions: incursionsFixture as unknown,
      "events-calendar": { "2026-10-02": [run] },
    })
    render(
      <MemoryRouter>
        <IncursionTile nowMs={Date.parse("2026-10-03T12:00:00Z")} />
      </MemoryRouter>
    )

    expect(
      await screen.findByTestId("home-incursion-countdown")
    ).toHaveTextContent("Ends in 3 days 20 hr")
  })
})
