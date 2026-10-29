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
  return buildTodayView(ready(overrides))
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

const glance = () => screen.getByRole("region", { name: "Today at a glance" })
const tileLabels = () =>
  within(glance())
    .getAllByRole("term")
    .map((term) => term.textContent)
// A tile's value is the definition right after its term.
const tileValue = (label: string) =>
  within(glance())
    .queryAllByRole("term")
    .find((term) => term.textContent === label)?.nextElementSibling

describe("TodayGlance", () => {
  it("is a labelled region of tiles in order: energy, Onslaught, campaign event", () => {
    render(<TodayGlance view={withOnslaught()} />)

    expect(glance()).toBeInTheDocument()
    expect(tileLabels()).toEqual([
      "Daily energy used",
      "Onslaught",
      "Campaign event",
    ])
    // Real energy used today of the daily energy, not a percentage.
    expect(tileValue("Daily energy used")).toHaveTextContent("120 / 288")
    expect(tileValue("Daily energy used")).not.toHaveTextContent("%")
    // 1.2 + 0.5 = 1.7 expected runs, rounded up to 2 whole tokens.
    expect(tileValue("Onslaught")).toHaveTextContent("2 tokens")
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
    expect(tile).toHaveClass("ring-energy-over/40", "dark:ring-energy-over/40")
    expect(within(tile).getByText("663 / 638")).toBeInTheDocument()
    const bar = screen.getByTestId("energy-usage-bar")
    expect(bar).toHaveAttribute("aria-valuenow", "100")
    expect(bar).toHaveAttribute("aria-valuetext", "104% of daily energy used")
    expect(bar.querySelector("[data-slot='progress-indicator']")).toHaveClass(
      "bg-energy-over"
    )
  })

  it("keeps the Onslaught tile over the limit", () => {
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
  })

  it("shows only the energy used when the daily energy is 0 (no limit)", () => {
    render(
      <TodayGlance
        view={viewOf({ dailyEnergy: 0, realEnergyUsedToday: 400 })}
      />
    )

    expect(tileValue("Daily energy used")).toHaveTextContent(/^400$/)
  })

  it("shows the energy tile even when there is no plan", () => {
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

  it("folds into one dense card of label / value rows below 42rem, and into tiles from 42rem", () => {
    render(<TodayGlance view={withOnslaught()} />)

    const list = glance().querySelector("dl")!
    // One card around every row, rows split by dividers.
    expect(list).toHaveClass("bg-card", "ring-1", "divide-y")
    expect(list).toHaveClass(
      "@[42rem]:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]",
      "@[42rem]:bg-transparent",
      "@[42rem]:ring-0",
      "@[42rem]:divide-y-0"
    )
    // Each tile is a flat row until it gets its own card back from 42rem.
    const tile = screen.getByTestId("energy-usage")
    expect(tile).toHaveClass("flex-row", "ring-0", "bg-transparent")
    expect(tile).toHaveClass(
      "@[42rem]:flex-col",
      "@[42rem]:ring-1",
      "@[42rem]:bg-card"
    )
  })

  it("has no daily reset or countdown tile", () => {
    render(<TodayGlance view={withOnslaught()} />)

    expect(screen.queryByText(/reset|refresh/i)).not.toBeInTheDocument()
  })
})
