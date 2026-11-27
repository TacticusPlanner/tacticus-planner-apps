import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"

import { InventoryAscensionTab } from "./inventory-ascension-tab"

const rarityAmounts = (entries: [string, number][]) =>
  entries.map(([rarity, amount]) => ({ rarity, amount }))

const inventory = {
  xpBooks: [
    { xpBookId: "xp0", amount: 3 },
    { xpBookId: "xp4", amount: 2 },
  ],
  abilityBadges: {
    imperial: rarityAmounts([["Epic", 30]]),
    xenos: [],
    chaos: [],
  },
  orbs: { imperial: [], xenos: rarityAmounts([["Rare", 5]]), chaos: [] },
  forgeBadges: rarityAmounts([["Legendary", 4]]),
  components: {
    imperial: { amount: 12 },
    xenos: { amount: 0 },
    chaos: { amount: 3 },
  },
  requisitionOrdersRegular: 7,
  requisitionOrdersBlessed: 1,
  resetStones: 2,
}

const readRetry = vi.fn()
const needsRetry = vi.fn()
let read: { status: string; data?: typeof inventory | null } = {
  status: "ready",
}
let needsState = { loading: false, isError: false }
let xpBookRarity: string | undefined = "Legendary"

const needs = {
  abilityBadges: { Imperial: { Epic: { need: 32, short: 2 } } },
  orbs: { Xenos: { Rare: { need: 8, short: 3 } } },
  forgeBadges: {},
  components: { Imperial: { need: 10, short: 0 } },
  xp: { need: 20_000, short: 9001 },
  upgrades: new Map(),
}
const emptyNeeds = {
  abilityBadges: {},
  orbs: {},
  forgeBadges: {},
  components: {},
  xp: { need: 0, short: 0 },
  upgrades: new Map(),
}

vi.mock("@/shared/local-data", () => ({
  usePlayerChunk: () => ({ ...read, retry: readRetry }),
}))

vi.mock("@/features/goal-planning", () => ({
  usePlanItemNeeds: () => ({
    needs: needsState.loading || needsState.isError ? emptyNeeds : needs,
    ...needsState,
    retry: needsRetry,
  }),
}))

vi.mock("@/entities/goal-farming", () => ({
  useLevelRules: () => ({
    xpBooks: {
      Common: { id: "xp0", xp: 10, gold: 0 },
      Uncommon: { id: "xp1", xp: 50, gold: 0 },
      Rare: { id: "xp2", xp: 250, gold: 0 },
      Epic: { id: "xp3", xp: 1000, gold: 0 },
      Legendary: { id: "xp4", xp: 4000, gold: 0 },
      Mythic: { id: "xp5", xp: 12_000, gold: 0 },
    },
  }),
}))

vi.mock("@/entities/planning-setting", () => ({
  usePlanningSettings: () => ({ settings: { xpBookRarity: xpBookRarity } }),
  normalizeXpBookRarity: (rarity: string | undefined) =>
    rarity === "Legendary" || rarity === "Mythic" ? rarity : "Legendary",
  PlanningSettingsDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="planning-settings-dialog" /> : null,
}))

vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))

vi.mock("@/features/player-data-sync", () => ({
  usePlayerDataSyncStatus: () => ({
    isSyncing: false,
    syncDisabled: false,
    syncNow: vi.fn(),
  }),
}))

describe("InventoryAscensionTab", () => {
  beforeEach(() => {
    read = { status: "ready", data: inventory }
    needsState = { loading: false, isError: false }
    xpBookRarity = "Legendary"
    readRetry.mockClear()
    needsRetry.mockClear()
  })

  it("adds the XP books up and prices what the goals still need in the planned rarity", async () => {
    render(<InventoryAscensionTab />)

    const xp = screen.getByTestId("inventory-xp-books")
    expect(within(xp).getByText("8,030")).toBeInTheDocument()
    expect(within(xp).getByText("20,000")).toBeInTheDocument()
    expect(within(xp).getByText("9,001")).toBeInTheDocument()
    expect(xp).toHaveTextContent(
      "About 3 Legendary books short. XP is planned in Legendary books."
    )

    await userEvent.click(
      within(xp).getByRole("button", { name: "Change book rarity" })
    )
    expect(screen.getByTestId("planning-settings-dialog")).toBeInTheDocument()
  })

  it("shows badges and orbs by alliance and rarity, with have / need and what is short", () => {
    render(<InventoryAscensionTab />)

    const badges = screen.getByTestId("inventory-ability-badges")
    const imperial = within(badges).getByRole("row", { name: /Imperial/ })
    expect(imperial).toHaveTextContent(
      "Epic Imperial ability badge30 / 322 short"
    )

    const components = screen.getByTestId("inventory-components")
    expect(components).toHaveTextContent("Imperial component12 / 10")
    expect(components).not.toHaveTextContent("short")

    const other = screen.getByTestId("inventory-other-resources")
    expect(other).toHaveTextContent("Requisition orders7")
    expect(other).toHaveTextContent("Blessed requisition orders1")
    expect(other).toHaveTextContent("Reset stones2")
  })

  it("shows a skeleton while the inventory is read and asks for a sync before the first one", () => {
    read = { status: "loading" }
    const { unmount } = render(<InventoryAscensionTab />)
    expect(screen.getByTestId("inventory-loading")).toBeInTheDocument()
    unmount()

    read = { status: "ready", data: null }
    render(<InventoryAscensionTab />)
    expect(screen.getByTestId("inventory-empty")).toHaveTextContent(
      "No inventory yet"
    )
  })

  it("offers a retry when the inventory cannot be read", async () => {
    read = { status: "error" }
    render(<InventoryAscensionTab />)

    await userEvent.click(
      screen.getByRole("button", { name: /Retry|Try again/ })
    )
    expect(readRetry).toHaveBeenCalled()
  })

  it("keeps the held counts when the goals' needs fail, with a retry", async () => {
    needsState = { loading: false, isError: true }
    render(<InventoryAscensionTab />)

    const orbs = screen.getByTestId("inventory-orbs")
    const xenos = within(orbs).getByRole("row", { name: /Xenos/ })
    expect(xenos).toHaveTextContent("Rare Xenos orb5")
    expect(xenos).not.toHaveTextContent("short")

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(needsRetry).toHaveBeenCalled()
  })

  it("shows the Xenos orbs the goals still need", () => {
    render(<InventoryAscensionTab />)

    const orbs = screen.getByTestId("inventory-orbs")
    expect(within(orbs).getByRole("row", { name: /Xenos/ })).toHaveTextContent(
      "Rare Xenos orb5 / 83 short"
    )
  })

  it("falls back to Legendary books when the stored book rarity is unknown", () => {
    xpBookRarity = "Shiny"
    render(<InventoryAscensionTab />)

    expect(screen.getByTestId("inventory-xp-books")).toHaveTextContent(
      "XP is planned in Legendary books."
    )
  })
})
