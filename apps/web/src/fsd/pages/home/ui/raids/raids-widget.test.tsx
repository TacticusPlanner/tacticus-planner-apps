import { describe, expect, it, vi } from "vitest"
import type { BattleId } from "@workspace/game-domain"

import { render, screen } from "@/test/render"

import { RaidsWidget } from "./raids-widget"

const { navigateMock, useDailyRaidsMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useDailyRaidsMock: vi.fn(),
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}))
vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigateMock,
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

    render(<RaidsWidget />)

    expect(screen.getByTestId("home-raids-no-goals")).toBeInTheDocument()
  })

  it("shows a distinct error when the plan fails to load, not no-goals guidance", () => {
    useDailyRaidsMock.mockReturnValue({ status: "error" })

    render(<RaidsWidget />)

    expect(screen.getByTestId("home-raids-schedule-error")).toBeInTheDocument()
    expect(screen.queryByTestId("home-raids-no-goals")).not.toBeInTheDocument()
  })

  it("shows a loading state", () => {
    useDailyRaidsMock.mockReturnValue({ status: "loading" })

    render(<RaidsWidget />)

    expect(screen.getByTestId("home-raids-loading")).toBeInTheDocument()
  })

  it("shows an empty state when there is nothing to raid", () => {
    useDailyRaidsMock.mockReturnValue({ status: "no-farmable" })

    render(<RaidsWidget />)

    expect(screen.getByTestId("home-raids-empty")).toBeInTheDocument()
  })

  it("flattens entries to one row per location, merging goals that share a node", () => {
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: {
        entries: [
          entry({
            goalId: "goal-a",
            battleId: "node-1" as BattleId,
            raidsPerformed: 2,
          }),
          entry({
            goalId: "goal-b",
            battleId: "node-1" as BattleId,
            raidsPerformed: 3,
          }),
          entry({
            goalId: "goal-a",
            battleId: "node-2" as BattleId,
            raidsPerformed: 1,
          }),
        ],
      },
      attemptsLeftByBattle: new Map(),
      locationsByBattleId: new Map(),
      resourceLabels: new Map([["upgrade-1", "Upgrade"]]),
      resourceVisuals: new Map(),
    })

    render(<RaidsWidget />)

    expect(screen.getByTestId("home-raid-location-node-1")).toBeInTheDocument()
    expect(screen.getByTestId("home-raid-location-node-2")).toBeInTheDocument()
    // node-1 shows the combined 5x across both goals, not two separate rows.
    expect(screen.getAllByTestId(/home-raid-location-node-1/)).toHaveLength(1)
  })

  it("excludes a location whose real attempts today are exhausted", () => {
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: { entries: [entry({ battleId: "node-1" as BattleId })] },
      attemptsLeftByBattle: new Map([["node-1" as BattleId, 0]]),
      locationsByBattleId: new Map(),
      resourceLabels: new Map(),
      resourceVisuals: new Map(),
    })

    render(<RaidsWidget />)

    expect(screen.getByTestId("home-raids-empty")).toBeInTheDocument()
  })

  it("reads a location exactly as Today does — campaign name, then tier and node", () => {
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: { entries: [entry({ battleId: "node-1" as BattleId })] },
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

    render(<RaidsWidget />)

    const row = screen.getByTestId("home-raid-location-node-1")
    expect(row).toHaveTextContent("Indomitus")
    expect(row).toHaveTextContent("Elite 3")
    expect(row).not.toHaveTextContent("Indomitus E 3")
  })

  it("omits the second line entirely for a location the catalog has no descriptor for", () => {
    useDailyRaidsMock.mockReturnValue({
      status: "ready",
      today: { entries: [entry({ battleId: "node-1" as BattleId })] },
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

    render(<RaidsWidget />)

    const lines = screen
      .getByTestId("home-raid-location-node-1")
      .querySelectorAll(".truncate")
    expect([...lines].map((line) => line.textContent)).toEqual(["node-1"])
  })

  it("navigates to Today when activated", () => {
    useDailyRaidsMock.mockReturnValue({ status: "no-farmable" })

    render(<RaidsWidget />)

    screen.getByTestId("home-raids-widget").click()
    expect(navigateMock).toHaveBeenCalledWith("/dailies/raids")
  })
})
