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
})
