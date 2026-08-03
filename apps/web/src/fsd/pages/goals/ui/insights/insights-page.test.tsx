import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@/test/render"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (
    querier: () => unknown,
    deps: unknown[] = [],
    defaultResult?: unknown
  ) => {
    const [value, setValue] = useState<unknown>(defaultResult)
    useEffect(() => {
      const result = querier()
      if (result instanceof Promise) {
        let active = true
        void result.then((resolved) => {
          if (active) setValue(resolved)
        })
        return () => {
          active = false
        }
      }
      setValue(result)
      return undefined
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}))

vi.mock("@/entities/planning-setting", () => ({
  usePlanningSettings: () => ({
    settings: { dailyEnergy: 288, revision: 1 },
    save: vi.fn(),
  }),
}))

vi.mock("@/entities/player-data-override", () => ({
  onslaughtProgressQueries: {
    current: () => ({
      queryKey: ["player-data-overrides", "onslaught"],
      queryFn: () =>
        Promise.resolve({
          imperial: { sector: "Stone", tier: 1 },
          xenos: { sector: "Stone", tier: 1 },
          chaos: { sector: "Stone", tier: 1 },
          revision: 1,
        }),
    }),
  },
  getOnslaughtProgress: () =>
    Promise.resolve({
      imperial: { sector: "Stone", tier: 1 },
      xenos: { sector: "Stone", tier: 1 },
      chaos: { sector: "Stone", tier: 1 },
      revision: 1,
    }),
  progressForAlliance: (progress: Record<string, unknown>, alliance: string) =>
    progress[alliance.toLowerCase()],
  onslaughtReward: () => ({ min: 2, max: 3, mythic: false }),
}))

const account = { homeAccountId: "acc-1", username: "test@example.com" }

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: [account],
    instance: { getActiveAccount: () => account },
  }),
  useIsAuthenticated: () => true,
}))

const characters = new Map([
  [
    "hero1",
    {
      id: "hero1",
      name: "Hero One",
      faction: "Ultramarines",
      initialRarity: "Common",
      shardLocations: [],
      rankUpUpgrades: [{ rank: "Stone1", upgradeIds: ["h1"] }],
    },
  ],
])

const upgrades = [
  {
    id: "h1",
    label: "Health Node",
    rarity: "Common",
    stat: "health",
    craftable: false,
    recipe: null,
    farmLocations: [
      {
        battleId: "B1",
        type: "Normal",
        challenge: false,
        guaranteed: true,
        chanceId: null,
        numerator: null,
        denominator: null,
        effectiveRate: null,
      },
    ],
  },
]

const battles = [
  {
    id: "B1",
    campaignGroupId: "campaign1",
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    energyCost: 10,
  },
]

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () => characters,
  getMowsMap: () => new Map(),
  getUpgrades: () => upgrades,
  getCampaignBattles: () => battles,
  getCampaignDefinitions: () => [],
  getAscensionCostsMap: () => new Map(),
  getUnlockShardCostsMap: () => new Map(),
  getOnslaughtRewards: () => [],
}))

vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacter: () => Promise.resolve(undefined),
  getPlayerMow: () => Promise.resolve(undefined),
  getInventoryUpgrades: () => undefined,
  getInventoryOrbs: () => undefined,
  getInventoryShard: () => Promise.resolve(undefined),
  getLiveProgress: () => undefined,
}))

const listProjects = vi.fn()
const listProjectGoals = vi.fn()
let projectList: Array<{
  projectId: string
  name: string
  description: null
  color: null
  status: "Active"
  isActivePlan: boolean
  isDefault: boolean
  revision: number
  createdAt: string
  updatedAt: string
}> = []

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  useProjects: () => ({
    projects: projectList,
    activeProjectId: projectList.find((project) => project.isActivePlan)
      ?.projectId,
    defaultProjectId: projectList.find((project) => project.isDefault)
      ?.projectId,
    fetchState: { status: "success", projects: projectList },
    loading: false,
    retry: vi.fn(),
  }),
  listProjects: (...args: unknown[]) => listProjects(...args),
  listProjectGoals: (...args: unknown[]) => listProjectGoals(...args),
  projectQueries: {
    list: () => ({
      queryKey: ["projects", "list"],
      queryFn: () => listProjects(),
    }),
    goals: (projectId: string) => ({
      queryKey: ["projects", projectId, "goals"],
      queryFn: () => listProjectGoals(projectId),
    }),
  },
}))

const getGoal = vi.fn()

vi.mock("@/entities/goal", () => ({
  getGoal: (...args: unknown[]) => getGoal(...args),
  goalQueries: {
    detail: (goalId: string) => ({
      queryKey: ["goals", "detail", goalId],
      queryFn: () => getGoal(goalId),
    }),
  },
}))

vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

import { InsightsPage } from ".//insights-page"

const rankGoal = {
  goalId: "goal-1",
  entityType: "Character",
  entityId: "hero1",
  goalType: "Rank",
  status: "Active",
  notes: null,
  aggregateId: null,
  milestonesTotal: 0,
  milestonesCompleted: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

const rankGoalDetail = {
  ...rankGoal,
  config: {
    rank: {
      start: 0,
      startPointFive: false,
      startAppliedUpgrades: 0,
      end: 1,
      endPointFive: false,
      endAppliedUpgrades: 0,
    },
    progression: null,
    ability: null,
    farmingStrategy: "TotalUpgrades",
    ascensionFarming: null,
    farmingLocationIds: null,
  },
  milestones: [],
  snapshot: null,
  events: [],
  dependsOn: [],
}

describe("InsightsPage", () => {
  beforeEach(() => {
    projectList = []
    listProjects.mockReset()
    listProjectGoals.mockReset()
    getGoal.mockReset()
  })

  it("shows the no-project empty state when the profile has no projects", async () => {
    listProjects.mockResolvedValue({ projects: [] })
    listProjectGoals.mockResolvedValue({ goals: [] })

    render(
      <TooltipProvider>
        <InsightsPage />
      </TooltipProvider>
    )

    expect(await screen.findByTestId("insights-page-empty")).toBeInTheDocument()
  })

  it("aggregates the active plan's Rank goal into the upgrades-by-rarity total", async () => {
    projectList = [
      {
        projectId: "proj-1",
        name: "My Plan",
        description: null,
        color: null,
        status: "Active",
        isActivePlan: true,
        isDefault: true,
        revision: 0,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ]
    listProjects.mockResolvedValue({ projects: projectList })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: rankGoal, priority: 1 }],
    })
    getGoal.mockResolvedValue(rankGoalDetail)

    render(
      <TooltipProvider>
        <InsightsPage />
      </TooltipProvider>
    )

    await waitFor(() =>
      expect(screen.getByTestId("insights-summary")).toBeInTheDocument()
    )
    expect((await screen.findAllByText("1")).length).toBeGreaterThan(0)
  })
})
