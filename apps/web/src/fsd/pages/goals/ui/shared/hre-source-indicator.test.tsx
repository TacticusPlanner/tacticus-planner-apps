import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import type { HreShardSource } from "@/entities/hre-mission"

import { HreSourceIndicator } from "./hre-source-indicator"

const running: HreShardSource = {
  characterId: "astraDaras",
  status: "running",
  eventKey: "occ-daras",
  startUtc: "2026-11-20T12:00:00Z",
  endUtc: "2026-12-04T12:00:00Z",
}
const upcoming: HreShardSource = {
  ...running,
  status: "upcoming",
  eventKey: "occ daras/2",
  startUtc: "2026-11-27T12:00:00Z",
  endUtc: "2026-12-11T12:00:00Z",
}

describe("HreSourceIndicator", () => {
  it("renders nothing without an HRE source", () => {
    render(<HreSourceIndicator isUnlock source={null} unitName="Daras" />)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("reads 'HRE live' while the event runs and links to it", async () => {
    render(<HreSourceIndicator isUnlock source={running} unitName="Daras" />, {
      route: "/plan/goals",
    })
    const trigger = screen.getByRole("button", { name: /^HRE live:/ })
    await userEvent.click(trigger)
    expect(
      await screen.findByText(
        /Unlock Daras in the Hero Release Event, running until Dec 4(, 2026)?\./
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Open HRE planner" })
    ).toHaveAttribute("href", "/dailies/hre?event=occ-daras")
  })

  it("names the start date before the event and says the hero unlocks there", async () => {
    render(<HreSourceIndicator isUnlock source={upcoming} unitName="Daras" />, {
      route: "/plan/goals",
    })
    await userEvent.click(
      screen.getByRole("button", { name: /^HRE Nov 27(, 2026)?:/ })
    )
    expect(
      await screen.findByText(
        /Daras can be unlocked in the Hero Release Event, Nov 27(, 2026)? – Dec 11(, 2026)?\./
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Open HRE planner" })
    ).toHaveAttribute("href", "/dailies/hre?event=occ%20daras%2F2")
  })

  it("speaks of shards for a goal that isn't an Unlock", async () => {
    render(
      <HreSourceIndicator isUnlock={false} source={running} unitName="Daras" />,
      { route: "/plan/goals" }
    )
    await userEvent.click(screen.getByRole("button", { name: /^HRE live:/ }))
    expect(
      await screen.findByText(
        /Daras shards come from the Hero Release Event, running until Dec 4(, 2026)?\./
      )
    ).toBeInTheDocument()
  })
})
