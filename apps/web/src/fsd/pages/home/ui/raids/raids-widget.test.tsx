import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { BattleId } from "@workspace/game-domain"

import { render, screen } from "@/test/render"

import { RaidsWidget } from "./raids-widget"

const { useDailyRaidsMock } = vi.hoisted(() => ({
  useDailyRaidsMock: vi.fn(),
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}))
vi.mock("@/features/daily-raids", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/daily-raids")>()
  return { ...actual, useDailyRaids: () => useDailyRaidsMock() }
})

function entry(overrides: Record<string, unknown> = {}) {
  return {
    goalId: "goal-a",
    resourceId: "upgrade-1",
    battleId: "node-1" as BattleId,
    raidsPerformed: 2,
    itemsFarmed: 2,
    energySpent: 12,
    dailyAttempts: 5,
    ...overrides,
  }
}

describe("RaidsWidget", () => {
  it("shows no-goals guidance when the account has no active goals", () => {
    useDailyRaidsMock.mockReturnValue({ status: "no-goals" })

    render(<RaidsWidget />, { route: "/" })

    expect(screen.getByTestId("home-raids-no-goals")).toBeInTheDocument()
  })

  it("shows a distinct error when the plan fails to load, not no-goals guidance", () => {
    useDailyRaidsMock.mockReturnValue({ status: "error" })

    render(<RaidsWidget />, { route: "/" })

    expect(screen.getByTestId("home-raids-schedule-error")).toBeInTheDocument()
    expect(screen.queryByTestId("home-raids-no-goals")).not.toBeInTheDocument()
  })

  it("shows a loading state", () => {
    useDailyRaidsMock.mockReturnValue({ status: "loading" })

    render(<RaidsWidget />, { route: "/" })

    expect(screen.getByTestId("home-raids-loading")).toBeInTheDocument()
  })

  it("shows an empty state when there is nothing to raid", () => {
    useDailyRaidsMock.mockReturnValue({ status: "no-farmable" })

    render(<RaidsWidget />, { route: "/" })

    expect(screen.getByTestId("home-raids-empty")).toBeInTheDocument()
  })

  it("flattens entries to one row per location, merging goals that share a node", () => {
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: {
        entries: [
          entry({
            goalId: "goal-a",
            battleId: "node-1",
            raidsPerformed: 2,
          }),
          entry({
            goalId: "goal-b",
            battleId: "node-1",
            raidsPerformed: 3,
          }),
          entry({
            goalId: "goal-a",
            battleId: "node-2",
            raidsPerformed: 1,
          }),
        ],
      },
      bonus: { entries: [] },
      raidsLeftToday: { entries: [] },
      attemptsLeftByBattle: new Map(),
      locationsByBattleId: new Map(),
      resourceLabels: new Map([["upgrade-1", "Upgrade"]]),
      resourceVisuals: new Map(),
    })

    render(<RaidsWidget />, { route: "/" })

    expect(screen.getByTestId("home-raid-location-node-1")).toBeInTheDocument()
    expect(screen.getByTestId("home-raid-location-node-2")).toBeInTheDocument()
    // node-1 shows the combined 5x across both goals, not two separate rows.
    expect(screen.getAllByTestId(/home-raid-location-node-1/)).toHaveLength(1)
  })

  it("lists Today's entries only below the energy limit, so it follows the filtered Today and not Bonus or the Plan", () => {
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: { entries: [entry({ battleId: "node-1" })] },
      bonus: { entries: [entry({ battleId: "node-bonus" })] },
      planDays: [{ entries: [entry({ battleId: "node-plan" })] }],
      raidsLeftToday: { entries: [] },
      attemptsLeftByBattle: new Map(),
      locationsByBattleId: new Map(),
      resourceLabels: new Map(),
      resourceVisuals: new Map(),
    })

    render(<RaidsWidget />, { route: "/" })

    expect(screen.getByTestId("home-raid-location-node-1")).toBeInTheDocument()
    expect(
      screen.queryByTestId("home-raid-location-node-bonus")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("home-raid-location-node-plan")
    ).not.toBeInTheDocument()
  })

  it("excludes a location whose real attempts today are exhausted", () => {
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: { entries: [entry({ battleId: "node-1" })] },
      bonus: { entries: [] },
      raidsLeftToday: { entries: [] },
      attemptsLeftByBattle: new Map([["node-1" as BattleId, 0]]),
      locationsByBattleId: new Map(),
      resourceLabels: new Map(),
      resourceVisuals: new Map(),
    })

    render(<RaidsWidget />, { route: "/" })

    expect(screen.getByTestId("home-raids-empty")).toBeInTheDocument()
  })

  it("lists Bonus Raids with a limit caption once today's energy spend reaches the daily limit", () => {
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: { entries: [entry({ battleId: "node-1" })] },
      bonus: { entries: [entry({ battleId: "node-bonus" })] },
      // Every raid still open today: the plan's own material keeps its remaining farming.
      raidsLeftToday: {
        entries: [
          entry({ battleId: "node-plan-left" }),
          entry({ battleId: "node-bonus" }),
          entry({ battleId: "node-spent" }),
        ],
      },
      dailyEnergy: 288,
      realEnergyUsedToday: 300,
      attemptsLeftByBattle: new Map([["node-spent" as BattleId, 0]]),
      locationsByBattleId: new Map(),
      resourceLabels: new Map(),
      resourceVisuals: new Map(),
    })

    render(<RaidsWidget />, { route: "/" })

    expect(
      screen.getByTestId("home-raids-energy-limit-reached")
    ).toHaveTextContent("home.raids.limitReached")
    expect(
      screen.getByTestId("home-raid-location-node-bonus")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("home-raid-location-node-plan-left")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("home-raid-location-node-1")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("home-raid-location-node-spent")
    ).not.toBeInTheDocument()
  })

  it("shows the limit caption and the empty message when no bonus raid is left", () => {
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: { entries: [entry({ battleId: "node-1" })] },
      bonus: { entries: [] },
      dailyEnergy: 288,
      realEnergyUsedToday: 288,
      raidsLeftToday: { entries: [] },
      attemptsLeftByBattle: new Map(),
      locationsByBattleId: new Map(),
      resourceLabels: new Map(),
      resourceVisuals: new Map(),
    })

    render(<RaidsWidget />, { route: "/" })

    expect(
      screen.getByTestId("home-raids-energy-limit-reached")
    ).toBeInTheDocument()
    expect(screen.getByTestId("home-raids-empty")).toBeInTheDocument()
    expect(
      screen.queryByTestId("home-raid-location-node-1")
    ).not.toBeInTheDocument()
  })

  it("keeps the plan with no limit caption below the daily limit", () => {
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: { entries: [entry({ battleId: "node-1" })] },
      bonus: { entries: [entry({ battleId: "node-bonus" })] },
      dailyEnergy: 288,
      realEnergyUsedToday: 120,
      raidsLeftToday: { entries: [] },
      attemptsLeftByBattle: new Map(),
      locationsByBattleId: new Map(),
      resourceLabels: new Map(),
      resourceVisuals: new Map(),
    })

    render(<RaidsWidget />, { route: "/" })

    expect(
      screen.queryByTestId("home-raids-energy-limit-reached")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("home-raid-location-node-1")).toBeInTheDocument()
    expect(
      screen.queryByTestId("home-raid-location-node-bonus")
    ).not.toBeInTheDocument()
  })

  it("reads a location exactly as Today does — campaign name, then tier and node", () => {
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: { entries: [entry({ battleId: "node-1" })] },
      bonus: { entries: [] },
      raidsLeftToday: { entries: [] },
      attemptsLeftByBattle: new Map(),
      locationsByBattleId: new Map([
        [
          "node-1" as BattleId,
          {
            id: "node-1",
            campaignName: "Indomitus",
            nodeLabel: "Elite 3",
            shortLabel: "Indomitus E 3",
            challenge: false,
            icon: undefined,
          },
        ],
      ]),
      resourceLabels: new Map([["upgrade-1", "Upgrade"]]),
      resourceVisuals: new Map(),
    })

    render(<RaidsWidget />, { route: "/" })

    const row = screen.getByTestId("home-raid-location-node-1")
    expect(row).toHaveTextContent("Indomitus")
    expect(row).toHaveTextContent("Elite 3")
    expect(row).not.toHaveTextContent("Indomitus E 3")
  })

  it("omits the second line entirely for a location the catalog has no descriptor for", () => {
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: { entries: [entry({ battleId: "node-1" })] },
      bonus: { entries: [] },
      raidsLeftToday: { entries: [] },
      attemptsLeftByBattle: new Map(),
      locationsByBattleId: new Map([
        [
          "node-1" as BattleId,
          {
            id: "node-1",
            campaignName: "node-1",
            nodeLabel: "",
            shortLabel: "node-1",
            challenge: false,
            icon: undefined,
          },
        ],
      ]),
      resourceLabels: new Map([["upgrade-1", "Upgrade"]]),
      resourceVisuals: new Map(),
    })

    render(<RaidsWidget />, { route: "/" })

    const lines = screen
      .getByTestId("home-raid-location-node-1")
      .querySelectorAll(".break-words")
    expect([...lines].map((line) => line.textContent)).toEqual(["node-1"])
  })

  it("links to Today from the header instead of making the whole card a button", () => {
    useDailyRaidsMock.mockReturnValue({ status: "no-farmable" })

    render(<RaidsWidget />, { route: "/" })

    expect(screen.getByTestId("home-raids-widget")).not.toHaveAttribute("role")
    expect(screen.getByTestId("home-raids-open-today")).toHaveAttribute(
      "href",
      "/dailies/raids"
    )
  })

  it("shows the first 10 locations and reveals the rest on demand", async () => {
    const user = userEvent.setup()
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: {
        entries: Array.from({ length: 12 }, (_, index) =>
          entry({ battleId: `node-${index}` })
        ),
      },
      bonus: { entries: [] },
      raidsLeftToday: { entries: [] },
      attemptsLeftByBattle: new Map(),
      locationsByBattleId: new Map(),
      resourceLabels: new Map(),
      resourceVisuals: new Map(),
    })

    render(<RaidsWidget />, { route: "/" })

    expect(screen.getAllByTestId(/^home-raid-location-/)).toHaveLength(10)
    const toggle = screen.getByTestId("home-raids-toggle")
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(toggle).toHaveTextContent('home.raids.showMore:{"count":2}')

    await user.click(toggle)

    expect(screen.getAllByTestId(/^home-raid-location-/)).toHaveLength(12)
    expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(toggle).toHaveTextContent("home.raids.showLess")
  })
})
