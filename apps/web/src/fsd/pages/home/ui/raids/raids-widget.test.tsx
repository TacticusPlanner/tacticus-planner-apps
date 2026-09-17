import { describe, expect, it, vi } from "vitest"
import type { BattleId } from "@workspace/game-domain"

import { render, screen } from "@/test/render"

import { RaidsWidget } from "./raids-widget"

const { navigateMock, useDailyRaidsMock, useProjectsMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useDailyRaidsMock: vi.fn(),
  useProjectsMock: vi.fn(),
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
vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>()
  return { ...actual, useProjects: () => useProjectsMock() }
})
vi.mock("@/features/daily-raids", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/daily-raids")>()
  return { ...actual, useDailyRaids: () => useDailyRaidsMock() }
})

const readyProjects = {
  activeProjectId: "p1",
  defaultProjectId: undefined,
  fetchState: { status: "success" },
  loading: false,
  projects: [{ projectId: "p1" }],
  retry: vi.fn(),
}

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
  it("shows no-projects guidance when the account has no projects", () => {
    useProjectsMock.mockReturnValue({
      activeProjectId: undefined,
      defaultProjectId: undefined,
      fetchState: { status: "success" },
      loading: false,
      projects: [],
    })
    useDailyRaidsMock.mockReturnValue({ status: "no-project" })

    render(<RaidsWidget />)

    expect(screen.getByTestId("home-raids-no-projects")).toBeInTheDocument()
  })

  it("shows a distinct error with retry when the project list fails to load, not no-projects guidance", () => {
    const retry = vi.fn()
    useProjectsMock.mockReturnValue({
      activeProjectId: undefined,
      defaultProjectId: undefined,
      fetchState: { status: "error" },
      loading: false,
      projects: [],
      retry,
    })
    useDailyRaidsMock.mockReturnValue({ status: "no-project" })

    render(<RaidsWidget />)

    expect(screen.getByTestId("home-raids-error")).toBeInTheDocument()
    expect(
      screen.queryByTestId("home-raids-no-projects")
    ).not.toBeInTheDocument()

    screen.getByRole("button", { name: "home.projects.retry" }).click()
    expect(retry).toHaveBeenCalled()
  })

  it("shows a loading state", () => {
    useProjectsMock.mockReturnValue(readyProjects)
    useDailyRaidsMock.mockReturnValue({ status: "loading" })

    render(<RaidsWidget />)

    expect(screen.getByTestId("home-raids-loading")).toBeInTheDocument()
  })

  it("shows a loading state, not no-projects guidance, while the project list is still resolving", () => {
    // While useProjects() is pending, activeProjectId/defaultProjectId are both undefined, so
    // useDailyRaids(undefined) reports "no-project" even though the account may well have
    // projects — the widget must not flash the no-projects message during this window.
    useProjectsMock.mockReturnValue({
      activeProjectId: undefined,
      defaultProjectId: undefined,
      fetchState: { status: "idle" },
      loading: true,
      projects: [],
    })
    useDailyRaidsMock.mockReturnValue({ status: "no-project" })

    render(<RaidsWidget />)

    expect(screen.getByTestId("home-raids-loading")).toBeInTheDocument()
    expect(
      screen.queryByTestId("home-raids-no-projects")
    ).not.toBeInTheDocument()
  })

  it("shows an empty state when there is nothing to raid", () => {
    useProjectsMock.mockReturnValue(readyProjects)
    useDailyRaidsMock.mockReturnValue({ status: "no-farmable" })

    render(<RaidsWidget />)

    expect(screen.getByTestId("home-raids-empty")).toBeInTheDocument()
  })

  it("flattens entries to one row per location, merging goals that share a node", () => {
    useProjectsMock.mockReturnValue(readyProjects)
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
    useProjectsMock.mockReturnValue(readyProjects)
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

  it("navigates to Today when activated", () => {
    useProjectsMock.mockReturnValue(readyProjects)
    useDailyRaidsMock.mockReturnValue({ status: "no-farmable" })

    render(<RaidsWidget />)

    screen.getByTestId("home-raids-widget").click()
    expect(navigateMock).toHaveBeenCalledWith("/dailies/raids/today")
  })
})
