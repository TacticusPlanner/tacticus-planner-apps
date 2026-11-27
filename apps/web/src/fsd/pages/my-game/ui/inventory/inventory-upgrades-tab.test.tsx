import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"

import { InventoryUpgradesTab } from "./inventory-upgrades-tab"

const upgrades = [
  {
    id: "bolt",
    label: "Bolt",
    rarity: "Common",
    stat: "Health",
    craftable: false,
    recipe: [],
    farmLocations: [
      {
        battleId: "campaign1-3",
        guaranteed: false,
        effectiveRate: 0.5,
        numerator: null,
        denominator: null,
        isMythic: false,
      },
    ],
  },
  {
    id: "sheet",
    label: "Sheet",
    rarity: "Common",
    stat: "Armour",
    craftable: false,
    recipe: [],
    farmLocations: [],
  },
  {
    id: "plate",
    label: "Plate",
    rarity: "Uncommon",
    stat: "Armour",
    craftable: true,
    recipe: [
      { material: "bolt", count: 2 },
      { material: "sheet", count: 1 },
    ],
    farmLocations: [],
  },
]

const battles = [
  {
    id: "campaign1-3",
    campaignGroupId: "campaign1",
    type: "Standard",
    challenge: false,
    nodeNumber: 3,
    battleIndex: 3,
    energyCost: 6,
    dailyAttempts: 3,
  },
]

let inventory: { upgradeId: string; amount: number }[] | null = []
let needsLoading = false

vi.mock("@/shared/local-data", () => ({
  toById: <T extends { id: string }>(records: T[]) =>
    new Map(records.map((record) => [record.id, record])),
  useCatalogDataset: (
    key: string,
    select?: (records: unknown[]) => unknown
  ) => {
    const records =
      key === "upgrades" ? upgrades : key === "campaign-battles" ? battles : []
    return {
      status: "ready",
      data: select ? select(records) : records,
      retry: vi.fn(),
    }
  },
  usePlayerChunk: () => ({ status: "ready", data: inventory, retry: vi.fn() }),
}))

vi.mock("@/features/goal-planning", () => ({
  usePlanItemNeeds: () => ({
    needs: {
      upgrades: new Map([
        ["plate", { need: 3, short: 2, goalIds: ["goal-1"] }],
        ["bolt", { need: 4, short: 0, goalIds: ["goal-1"] }],
      ]),
    },
    loading: needsLoading,
    isError: false,
    retry: vi.fn(),
  }),
}))

vi.mock("@/entities/goal", async (importActual) => ({
  ...(await importActual<typeof import("@/entities/goal")>()),
  useGlobalGoalPlan: () => ({
    goals: [
      {
        goalId: "goal-1",
        goalType: "Rank",
        entityType: "Character",
        entityId: "ultraTigurius",
      },
    ],
  }),
}))

vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))

vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => () => "Tigurius",
}))

vi.mock("@/features/player-data-sync", () => ({
  usePlayerDataSyncStatus: () => ({
    isSyncing: false,
    syncDisabled: false,
    syncNow: vi.fn(),
  }),
}))

function renderTab(search = "") {
  return render(<InventoryUpgradesTab />, {
    route: "/my-game/inventory/upgrades",
    initialEntries: [`/my-game/inventory/upgrades${search}`],
  })
}

describe("InventoryUpgradesTab", () => {
  beforeEach(() => {
    inventory = [
      { upgradeId: "bolt", amount: 5 },
      { upgradeId: "sheet", amount: 1 },
      { upgradeId: "plate", amount: 1 },
    ]
    needsLoading = false
  })

  it("asks for a sync before the first one", () => {
    inventory = null
    renderTab()

    expect(screen.getByTestId("inventory-empty")).toHaveTextContent(
      "No inventory yet"
    )
  })

  it("lists every material grouped by rarity with have / need and what is short", () => {
    renderTab()

    expect(
      screen.getByRole("heading", { name: /Uncommon/ })
    ).toBeInTheDocument()
    const plate = screen.getByRole("button", { name: /^Plate,/ })
    expect(plate).toHaveAccessibleName("Plate, have 1 of 3 needed")
    expect(plate).toHaveTextContent("1 / 3")
    expect(plate).toHaveTextContent("2 short")
    expect(screen.getByRole("button", { name: /^Sheet,/ })).toHaveTextContent(
      "1"
    )
  })

  it("narrows to what the goals need and offers to clear the filters when nothing matches", async () => {
    renderTab("?needed=1")

    expect(screen.getByRole("button", { name: /^Plate,/ })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /^Sheet,/ })
    ).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /Filters/ }))
    await userEvent.click(screen.getByRole("switch", { name: "Owned only" }))
    await userEvent.keyboard("{Escape}")
    expect(screen.getByRole("button", { name: /^Bolt,/ })).toBeInTheDocument()

    await userEvent.type(
      screen.getByRole("searchbox", { name: "Search upgrades" }),
      "nothing"
    )
    const empty = await screen.findByTestId("inventory-upgrades-no-match")
    await userEvent.click(
      within(empty).getByRole("button", { name: "Clear filters" })
    )
    expect(screen.getByRole("button", { name: /^Sheet,/ })).toBeInTheDocument()
  })

  it("shows a table with the craftable count", () => {
    renderTab("?layout=table&group=none")

    const row = screen.getByTestId("inventory-upgrade-row-plate")
    // Have 1, need 3, short 2, and 2 more can be made from 5 bolts and 1 sheet.
    expect(
      within(row)
        .getAllByRole("cell")
        .slice(3)
        .map((cell) => cell.textContent)
    ).toEqual(["1", "3", "2", "1"])
  })

  it("opens a material's recipe, farm locations and goals", async () => {
    renderTab()

    await userEvent.click(screen.getByRole("button", { name: /^Plate,/ }))
    const details = await screen.findByTestId("inventory-material-details")
    expect(
      within(details).getByRole("heading", { name: "Plate" })
    ).toBeVisible()
    const recipe = within(details).getByTestId("inventory-material-recipe")
    expect(recipe).toHaveTextContent("2 ×Bolthave 5")
    expect(recipe).toHaveTextContent("You can craft 1 now.")
    expect(
      within(details).getByRole("link", { name: /Tigurius · Rank/ })
    ).toHaveAttribute("href", "/plan/goals?goal=goal-1")

    await userEvent.keyboard("{Escape}")
    await userEvent.click(screen.getByRole("button", { name: /^Bolt,/ }))
    const farm = await screen.findByTestId("inventory-material-farm")
    expect(farm).toHaveTextContent("12 energy each")
  })

  it("holds the Needed filter off until the goals' needs are worked out", () => {
    needsLoading = true
    renderTab("?needed=1")

    expect(screen.getByRole("status")).toHaveTextContent(
      "Working out what your goals need"
    )
    expect(screen.getByRole("button", { name: /^Sheet,/ })).toBeInTheDocument()
    expect(
      screen.queryByTestId("inventory-upgrades-no-match")
    ).not.toBeInTheDocument()
  })

  it("hands focus back to the material when its details close", async () => {
    renderTab()

    const plate = screen.getByRole("button", { name: /^Plate,/ })
    await userEvent.click(plate)
    await screen.findByTestId("inventory-material-details")
    await userEvent.keyboard("{Escape}")
    expect(plate).toHaveFocus()
  })
})
