import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

// Minimal stand-in for dexie-react-hooks' real `useLiveQuery` — mirrors
// pages/lookup/.../character-lookup-page.test.tsx's version. The query fns it calls are mocked
// directly below, so it only needs to handle a synchronous value and a resolving promise.
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

const account = { homeAccountId: "acc-1", username: "test@example.com" }

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: [account],
    instance: { getActiveAccount: () => account },
  }),
  // true so useGoalPrefill actually calls getPlayerCharacter (below) — its per-test mocked
  // resolution is how these tests control whether the selected character reads as locked/owned.
  useIsAuthenticated: () => true,
}))

const characters = new Map([
  [
    "hero1",
    {
      id: "hero1",
      name: "Hero One",
      faction: "Ultramarines",
      rankUpUpgrades: [
        { rank: "Stone1", upgradeIds: ["h1"] },
        { rank: "Stone2", upgradeIds: ["h2"] },
      ],
    },
  ],
])

const upgrades = [
  {
    id: "h1",
    label: "Health Base",
    rarity: "Common",
    stat: "Health",
    craftable: false,
    recipe: [],
    // Farmable at a guaranteed-drop node so the estimate preview (plan §16 phase 4) has something to
    // compute for the default Stone1 -> Stone2 range selectCharacter() lands on.
    farmLocations: [
      {
        battleId: "B1",
        guaranteed: true,
        effectiveRate: null,
        numerator: null,
        denominator: null,
      },
    ],
  },
  {
    id: "h2",
    label: "Health Two",
    rarity: "Common",
    stat: "Health",
    craftable: false,
    recipe: [],
    farmLocations: [],
  },
]

const battles = [
  {
    id: "B1",
    campaignGroupId: "CG1",
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    energyCost: 10,
  },
]

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () => characters,
  getUpgrades: () => upgrades,
  getCampaignBattles: () => battles,
}))

const getPlayerCharacter = vi.fn()
const getInventoryUpgrades = vi.fn()

vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacter: (...args: unknown[]) => getPlayerCharacter(...args),
  getInventoryUpgrades: (...args: unknown[]) => getInventoryUpgrades(...args),
}))

const createCombinedGoals = vi.fn()
const listProjects = vi.fn()

vi.mock("@/entities/goal", () => ({
  createCombinedGoals: (...args: unknown[]) => createCombinedGoals(...args),
}))

vi.mock("@/entities/project", () => ({
  listProjects: (...args: unknown[]) => listProjects(...args),
}))

vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

import { CreateGoalSheet } from "./create-goal-sheet"

async function selectCharacter() {
  fireEvent.click(
    screen.getByRole("combobox", {
      name: "goals.create.characterPlaceholder",
    })
  )
  fireEvent.click(await screen.findByText("Hero One"))
}

describe("CreateGoalSheet", () => {
  beforeEach(() => {
    createCombinedGoals.mockReset()
    listProjects.mockReset()
    listProjects.mockResolvedValue({ projects: [] })

    // Owned, nothing applied yet — numerically identical missingUpgrades/estimate math to an
    // undefined playerCharacter, but not locked, so most tests exercise the plain (no
    // auto-suggestion) composer path. Locked-character tests override this per test.
    getPlayerCharacter.mockReset()
    getPlayerCharacter.mockResolvedValue({
      rank: "Stone1",
      progressionIndex: "Common:None",
      appliedUpgradeSlots: [],
    })
    getInventoryUpgrades.mockReset()
    getInventoryUpgrades.mockReturnValue(undefined)
  })

  it("creates a Rank goal for the selected character and closes on success", async () => {
    createCombinedGoals.mockResolvedValue({ goals: [{ goalId: "goal-1" }] })
    const onOpenChange = vi.fn()
    const onCreated = vi.fn()
    render(
      <CreateGoalSheet open onOpenChange={onOpenChange} onCreated={onCreated} />
    )

    await selectCharacter()
    // Wait for useGoalPrefill's getPlayerCharacter() to resolve (owned, per the beforeEach mock) —
    // before it resolves, isLocked reads its pre-resolution default (locked), which would also
    // include an auto-suggested Unlock in the submission this test isn't testing for.
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-review").querySelectorAll("li")
      ).toHaveLength(1)
    })
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [, , request] = createCombinedGoals.mock.calls[0]
    expect(request).toMatchObject({
      entityType: "Character",
      entityId: "hero1",
      projectId: undefined,
    })
    expect(request.goals).toHaveLength(1)
    expect(request.goals[0]).toMatchObject({
      goalType: "Rank",
      dependsOnIndex: [],
    })
    expect(request.goals[0].config.rank).toMatchObject({ start: 0, end: 1 })

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onCreated).toHaveBeenCalledTimes(1)
  })

  it("keeps the sheet open and resets the form when 'create another' is checked", async () => {
    createCombinedGoals.mockResolvedValue({ goals: [{ goalId: "goal-1" }] })
    const onOpenChange = vi.fn()
    render(
      <CreateGoalSheet open onOpenChange={onOpenChange} onCreated={vi.fn()} />
    )

    await selectCharacter()
    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    // Wait for the actual reset (not just the createCombinedGoals call) — the mocked call
    // registers synchronously, before its resolved promise lets handleSubmit's resetForm() run.
    await vi.waitFor(() => {
      expect(
        screen.getByRole("combobox", {
          name: "goals.create.characterPlaceholder",
        })
      ).toHaveTextContent("goals.create.characterPlaceholder")
    })
    expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("shows the ApiError message when creation fails", async () => {
    createCombinedGoals.mockRejectedValue(new Error("boom"))
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-error")).toHaveTextContent(
        "goals.create.genericError"
      )
    })
  })

  it("shows an estimated completion date in the preview once the required material is farmable", async () => {
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()

    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-estimate")).toBeInTheDocument()
    })
  })

  it("submits only the explicitly toggled types, with no config target for Unlock", async () => {
    createCombinedGoals.mockResolvedValue({ goals: [] })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    // Rank is on by default; turn it off and turn Unlock on instead.
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Unlock"))
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [, , request] = createCombinedGoals.mock.calls[0]
    expect(request.goals).toEqual([
      { goalType: "Unlock", config: {}, dependsOnIndex: [] },
    ])
  })

  it("auto-suggests and includes Unlock for a locked character, with Rank depending on it, and lists it in the review", async () => {
    getPlayerCharacter.mockResolvedValue(undefined)
    createCombinedGoals.mockResolvedValue({ goals: [] })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()

    const review = await screen.findByTestId("create-goal-review")
    expect(review).toHaveTextContent("goals.create.goalTypes.Unlock")
    expect(review).toHaveTextContent("goals.create.suggestions.unlockRequired")

    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [, , request] = createCombinedGoals.mock.calls[0]
    expect(request.goals).toHaveLength(2)
    expect(request.goals[0]).toMatchObject({
      goalType: "Unlock",
      dependsOnIndex: [],
    })
    expect(request.goals[1]).toMatchObject({
      goalType: "Rank",
      dependsOnIndex: [0],
    })
  })
})
