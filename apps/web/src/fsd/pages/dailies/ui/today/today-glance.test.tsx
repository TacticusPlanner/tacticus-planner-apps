import { describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"
import { ready } from "@/test/fixtures/daily-raids"

import { TodayGlance } from "./today-glance"
import { buildTodayView } from "./today-view-model"

// The campaign event tile reads its own data; its behaviour has its own tests.
vi.mock("../campaign-event-status", () => ({
  CampaignEventTile: () => (
    <div data-testid="campaign-event-status">
      <dt>Campaign event</dt>
      <dd>Not active</dd>
    </div>
  ),
}))

type ReadyOverrides = Parameters<typeof ready>[0]

function viewOf(overrides: ReadyOverrides = {}) {
  return buildTodayView(ready(overrides), { showAllBonus: false })
}

function withOnslaught(overrides: ReadyOverrides = {}) {
  const base = ready()
  return viewOf({
    today: {
      ...base.today,
      onslaughtEntries: [
        { goalId: "g1", runs: 1.2, expectedShards: 6 },
        { goalId: "g2", runs: 0.5, expectedShards: 2 },
      ],
    },
    ...overrides,
  })
}

const tileLabels = () =>
  within(screen.getByTestId("today-glance"))
    .getAllByRole("term")
    .map((term) => term.textContent)

describe("TodayGlance", () => {
  it("is a labelled region of tiles in order: energy, planned, Onslaught, campaign event", () => {
    render(<TodayGlance view={withOnslaught()} />)

    expect(
      screen.getByRole("region", { name: "Today at a glance" })
    ).toBeInTheDocument()
    expect(tileLabels()).toEqual([
      "Daily energy used",
      "Planned today",
      "Onslaught",
      "Campaign event",
    ])
    expect(screen.getByTestId("glance-planned")).toHaveTextContent(
      "42 energy · 7 raid attempts"
    )
    // 1.2 + 0.5 = 1.7 expected runs, rounded up to 2 whole tokens.
    expect(screen.getByTestId("glance-onslaught")).toHaveTextContent("2 tokens")
  })

  it("keeps the real percentage over 100 while the bar stops at 100, and switches to its over-limit state", () => {
    // 663 / 638 = 103.9%, shown as 104%.
    render(
      <TodayGlance
        view={withOnslaught({ dailyEnergy: 638, realEnergyUsedToday: 663 })}
      />
    )

    const tile = screen.getByTestId("energy-usage")
    expect(within(tile).getByRole("term")).toHaveTextContent(
      "Energy limit reached"
    )
    expect(within(tile).getByRole("term")).toHaveClass("text-energy-over")
    expect(tile).toHaveClass("ring-energy-over/40")
    expect(within(tile).getByText("104%")).toBeInTheDocument()
    const bar = screen.getByTestId("energy-usage-bar")
    expect(bar).toHaveAttribute("aria-valuenow", "100")
    expect(bar).toHaveAttribute("aria-valuetext", "104% of daily energy used")
    expect(bar.querySelector("[data-slot='progress-indicator']")).toHaveClass(
      "bg-energy-over"
    )
  })

  it("puts Onslaught in the planned slot over the limit, with no separate Onslaught tile", () => {
    render(
      <TodayGlance
        view={withOnslaught({ dailyEnergy: 288, realEnergyUsedToday: 288 })}
      />
    )

    expect(tileLabels()).toEqual([
      "Energy limit reached",
      "Onslaught",
      "Campaign event",
    ])
    expect(screen.queryByTestId("glance-planned")).not.toBeInTheDocument()
  })

  it("hides the planned tile when there is no plan", () => {
    const base = ready()
    render(
      <TodayGlance view={viewOf({ today: { ...base.today, entries: [] } })} />
    )

    expect(tileLabels()).toEqual(["Daily energy used", "Campaign event"])
  })

  it("shows only the campaign event while the raids load", () => {
    render(<TodayGlance view={undefined} />)

    expect(tileLabels()).toEqual(["Campaign event"])
  })

  it("has no daily reset or countdown tile", () => {
    render(<TodayGlance view={withOnslaught()} />)

    expect(screen.queryByText(/reset|refresh/i)).not.toBeInTheDocument()
  })
})
