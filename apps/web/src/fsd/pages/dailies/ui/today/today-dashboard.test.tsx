import userEvent from "@testing-library/user-event"
import { battleIdSchema } from "@workspace/game-domain"
import { describe, expect, it, vi } from "vitest"

import type { DailyRaidsViewModel } from "@/features/daily-raids"
import { render, screen, within } from "@/test/render"
import { battle, offPlanBattle, ready } from "@/test/fixtures/daily-raids"

import { TodayDashboard } from "./today-dashboard"

// The shop card and the campaign event tile read their own data; their behaviour has its own tests.
vi.mock("../today-shops", () => ({
  TodayShops: () => (
    <section aria-label="Shop recommendations" data-testid="today-shops" />
  ),
}))
vi.mock("../campaign-event-status", () => ({
  CampaignEventTile: () => <div data-testid="campaign-event-status" />,
}))

function renderDashboard(raids: DailyRaidsViewModel) {
  return render(<TodayDashboard raids={raids} />)
}

function withOnslaught() {
  const base = ready()
  return ready({
    today: {
      ...base.today,
      onslaughtEntries: [{ goalId: "g1", runs: 1.2, expectedShards: 6 }],
    },
    todaysAttempts: [{ battleId: battle, attemptsUsed: 6, attemptsLeft: 4 }],
  })
}

describe("TodayDashboard", () => {
  it("renders the five cards in reading order: plan, bonus, shops, Onslaught, attempts", () => {
    renderDashboard(withOnslaught())

    const order = [
      "today-plan-card",
      "bonus-card",
      "today-shops",
      "today-onslaught",
      "todays-attempts",
    ].map((testId) => screen.getByTestId(testId))
    for (let index = 1; index < order.length; index++) {
      expect(
        order[index - 1]!.compareDocumentPosition(order[index]!) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy()
    }
    expect(
      screen.getByRole("region", { name: "Today's plan" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "Bonus raids" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "Onslaught" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "Today's attempts" })
    ).toBeInTheDocument()
  })

  it("lays the grid out with container queries: 2 tracks from 42rem, 4 from 84rem, the plan spanning two", () => {
    renderDashboard(ready())

    expect(screen.getByTestId("today-page")).toHaveClass("@container")
    expect(screen.getByTestId("today-grid")).toHaveClass(
      "@[42rem]:grid-cols-2",
      "@[84rem]:grid-cols-4",
      "items-start"
    )
    expect(screen.getByTestId("today-plan-area")).toHaveClass(
      "@[42rem]:col-span-2"
    )
  })

  it("puts the bonus card in the plan's place at the energy limit, with its caption and every entry", () => {
    renderDashboard(ready({ dailyEnergy: 288, realEnergyUsedToday: 300 }))

    expect(screen.queryByTestId("today-plan-card")).not.toBeInTheDocument()
    const planArea = within(screen.getByTestId("today-plan-area"))
    const bonus = planArea.getByTestId("bonus-card")
    expect(bonus).toHaveAttribute("data-limit", "reached")
    expect(
      within(bonus).getByTestId("bonus-energy-limit-reached")
    ).toHaveTextContent("Daily energy limit reached")
    // 2 plan entries + 4 bonus entries, all shown.
    expect(within(bonus).getByTestId("raid-card-g2-B4")).toBeInTheDocument()
    expect(
      within(bonus).queryByRole("button", { name: "Show more" })
    ).not.toBeInTheDocument()
  })

  it("puts the bonus card in the plan's place below the limit when the plan is empty, still truncated and uncaptioned", () => {
    const base = ready()
    renderDashboard(ready({ today: { ...base.today, entries: [] } }))

    expect(screen.queryByTestId("today-plan-card")).not.toBeInTheDocument()
    const planArea = within(screen.getByTestId("today-plan-area"))
    const bonus = planArea.getByTestId("bonus-card")
    expect(bonus).not.toHaveAttribute("data-limit")
    expect(
      within(bonus).queryByTestId("bonus-energy-limit-reached")
    ).not.toBeInTheDocument()
    expect(
      within(bonus).queryByTestId("raid-card-g2-B4")
    ).not.toBeInTheDocument()
    expect(
      within(bonus).getByRole("button", { name: "Show more" })
    ).toBeInTheDocument()
    // Not repeated beside the plan area.
    expect(screen.getAllByTestId("bonus-card")).toHaveLength(1)
  })

  it("puts the bonus card in the plan's place when every plan node is raided out below the limit", () => {
    // Both plan entries sit on B1, which has no real attempts left; the bonus raids are on B2.
    const base = ready()
    renderDashboard(
      ready({
        attemptsLeftByBattle: new Map([[battle, 0]]),
        bonus: {
          ...base.bonus,
          entries: base.bonus.entries.map((entry) => ({
            ...entry,
            battleId: offPlanBattle,
          })),
        },
      })
    )

    expect(screen.queryByTestId("today-plan-card")).not.toBeInTheDocument()
    const bonus = within(screen.getByTestId("today-plan-area")).getByTestId(
      "bonus-card"
    )
    expect(bonus).not.toHaveAttribute("data-limit")
    expect(screen.getAllByTestId("bonus-card")).toHaveLength(1)
  })

  it("shows the top 3 bonus entries, Show more reveals the rest and Show less hides them again", async () => {
    const user = userEvent.setup()
    renderDashboard(ready())

    const bonus = within(screen.getByTestId("bonus-card"))
    expect(bonus.getByText("if energy is left")).toBeInTheDocument()
    expect(bonus.queryByTestId("raid-card-g2-B4")).not.toBeInTheDocument()
    await user.click(bonus.getByRole("button", { name: "Show more" }))
    expect(bonus.getByTestId("raid-card-g2-B4")).toBeInTheDocument()
    await user.click(bonus.getByRole("button", { name: "Show less" }))
    expect(bonus.queryByTestId("raid-card-g2-B4")).not.toBeInTheDocument()
  })

  it("leaves the bonus card out when no entry qualifies, so Shops moves up", () => {
    const base = ready()
    renderDashboard(ready({ bonus: { ...base.bonus, entries: [] } }))

    expect(screen.queryByTestId("bonus-card")).not.toBeInTheDocument()
    const sideColumn = screen.getByTestId("today-shops").parentElement!
    expect(sideColumn.firstElementChild).toBe(screen.getByTestId("today-shops"))
  })

  it("leaves the Onslaught card and tile out when no goal needs a run", () => {
    renderDashboard(ready())

    expect(screen.queryByTestId("today-onslaught")).not.toBeInTheDocument()
    expect(screen.queryByTestId("glance-onslaught")).not.toBeInTheDocument()
    const sideColumn = screen.getByTestId("todays-attempts").parentElement!
    expect(sideColumn.firstElementChild).toBe(
      screen.getByTestId("todays-attempts")
    )
  })

  it("keeps the plan card and Shops while the raids load, and nothing else", () => {
    renderDashboard({ status: "loading" })

    expect(
      within(screen.getByTestId("today-plan-card")).getByTestId(
        "dailies-loading"
      )
    ).toBeInTheDocument()
    expect(screen.getByTestId("today-shops")).toBeInTheDocument()
    expect(screen.queryByTestId("bonus-card")).not.toBeInTheDocument()
    expect(screen.queryByTestId("today-onslaught")).not.toBeInTheDocument()
    expect(screen.queryByTestId("todays-attempts")).not.toBeInTheDocument()
  })

  it("shows the plan's error state inside the plan card, not as a card of its own", () => {
    renderDashboard({ status: "error" })

    const error = within(screen.getByTestId("today-plan-card")).getByTestId(
      "dailies-error"
    )
    expect(error).not.toHaveAttribute("data-slot", "card")
  })

  it("heads the plan card with its visible node count", () => {
    renderDashboard(ready())

    // Two plan entries at B1, which has attempts left.
    expect(
      within(screen.getByTestId("today-plan-card")).getByText(
        "2 nodes · goal priority order"
      )
    ).toBeInTheDocument()
  })

  it("lists today's attempts as compact rows with a header total", () => {
    const nodes = ["N1", "N2", "N3"].map((id) => battleIdSchema.parse(id))
    renderDashboard(
      ready({
        todaysAttempts: [
          { battleId: battle, attemptsUsed: 6, attemptsLeft: 4 },
          { battleId: offPlanBattle, attemptsUsed: 6, attemptsLeft: 0 },
          ...[10, 5, 2].map((attemptsUsed, index) => ({
            battleId: nodes[index]!,
            attemptsUsed,
            attemptsLeft: 0,
          })),
        ],
      })
    )

    const card = within(screen.getByTestId("todays-attempts"))
    // 6 + 6 + 10 + 5 + 2 = 29 attempts over 5 nodes.
    expect(card.getByText("5 nodes · 29")).toBeInTheDocument()
    const row = card.getByTestId(`todays-attempt-${offPlanBattle}`)
    expect(row).toHaveAccessibleName(
      "Adamantium, Death Guard Extremis 3, 6 attempts"
    )
    expect(within(row).getByText("6 attempts")).toBeInTheDocument()
  })

  it("shows an explicit empty state for today's attempts", () => {
    renderDashboard(ready({ todaysAttempts: [] }))

    expect(
      within(screen.getByTestId("todays-attempts")).getByText(
        "No real attempts recorded yet today."
      )
    ).toBeInTheDocument()
  })

  it("lists today's Onslaught runs with the whole tokens on the card", () => {
    renderDashboard(withOnslaught())

    const card = within(screen.getByTestId("today-onslaught"))
    expect(card.getByTestId("today-onslaught-bellator")).toBeInTheDocument()
    // 1.2 expected runs need 2 whole tokens.
    expect(card.getByText("2")).toBeInTheDocument()
  })
})
