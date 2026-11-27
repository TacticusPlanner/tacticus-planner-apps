import userEvent from "@testing-library/user-event"
import { useLocation } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { render, screen, waitFor, within } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { ItemPage } from "./item-page"
import { itemsOriginState } from "../../model/items/library-items"
import { ItemsListPage } from "./items-list-page"

vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))

const step = (goldCost: number, salvageCost: number) => ({
  goldCost,
  salvageCost,
  mythicSalvageCost: 0,
})

const item = (
  id: string,
  name: string,
  patch: Record<string, unknown> = {}
) => ({
  id,
  name,
  type: "I_Crit",
  rarity: "Epic",
  isRelic: false,
  isUniqueRelic: false,
  abilityId: null,
  allowedUnits: [],
  allowedFactions: ["Ultramarines", "Orks"],
  levels: [
    { stats: { critChance: 25, critDamage: 100 } },
    { stats: { critChance: 25, critDamage: 120 } },
    { stats: { critChance: 25, critDamage: 140 } },
  ],
  upgradeLevels: [step(0, 150), step(750, 90), step(1000, 120)],
  ...patch,
})

const equipment = [
  item("X_Crit_E001", "Test Knife"),
  item("X_Block_E001", "Test Shield", { type: "I_Block" }),
  item("X_Relic", "Test Relic", {
    rarity: "Mythic",
    isRelic: true,
    allowedUnits: ["ultraTitus"],
    allowedFactions: [],
  }),
]

const characters = [
  {
    id: "ultraTitus",
    name: "Titus",
    faction: "Ultramarines",
    initialRarity: "Legendary",
    equipmentSlots: ["I_Crit"],
    eligibleEquipment: [{ slot: "I_Crit", equipmentIds: ["X_Crit_E001"] }],
  },
]

function Path() {
  return <output data-testid="path">{useLocation().pathname}</output>
}

/** The item route, or a stand-in for the list once it redirects there. */
function ItemRoute() {
  return useLocation().pathname === "/library/items" ? (
    <p data-testid="list-route">list</p>
  ) : (
    <ItemPage />
  )
}

async function renderAt(path: string, page: "list" | "item") {
  await seedGameCatalog({ equipment, characters })
  render(
    <>
      {page === "list" ? <ItemsListPage /> : <ItemRoute />}
      <Path />
    </>,
    {
      route: page === "list" ? "/library/items" : "/library/items/:entityId?",
      initialEntries: [path],
    }
  )
}

describe("Library Items", () => {
  it("lists every item by slot and filters to relics", async () => {
    const user = userEvent.setup()
    await renderAt("/library/items", "list")
    const list = await screen.findByTestId("library-items-list")
    expect(
      within(list)
        .getAllByTestId("library-item-card")
        .map((card) => card.dataset.itemId)
    ).toEqual(["X_Relic", "X_Crit_E001", "X_Block_E001"])
    await user.click(screen.getByRole("button", { name: "Filters" }))
    await user.click(await screen.findByRole("switch", { name: "Relics only" }))
    expect(screen.getAllByTestId("library-item-card")).toHaveLength(1)
    expect(screen.getByTestId("library-item-card")).toHaveAttribute(
      "href",
      "/library/items/X_Relic"
    )
  })

  it("goes back to the list with the filters it was opened from", async () => {
    await seedGameCatalog({ equipment, characters })
    render(<ItemRoute />, {
      route: "/library/items/:entityId?",
      initialEntries: [
        {
          pathname: "/library/items/X_Relic",
          state: itemsOriginState("?relic=1&group=rarity"),
        },
      ],
    })
    expect(
      await screen.findByRole("link", { name: /All items/ })
    ).toHaveAttribute("href", "/library/items?relic=1&group=rarity")
  })

  it("shows an item's stats and its cost ladder with the reclaim value", async () => {
    await renderAt("/library/items/X_Crit_E001", "item")
    const ladder = await screen.findByTestId("library-item-ladder")
    const lastRow = within(ladder).getAllByRole("row").at(-1)
    expect(lastRow).toHaveTextContent(/3\s*120\s*1,000\s*360\s*1,750/)
    expect(screen.getByTestId("library-item-stats")).toHaveTextContent("140")
  })

  it("links a relic's characters to their pages", async () => {
    await renderAt("/library/items/X_Relic", "item")
    const forSection = await screen.findByTestId("library-item-for")
    expect(within(forSection).getByRole("link")).toHaveAttribute(
      "href",
      "/library/characters/ultraTitus"
    )
  })

  it("goes back to the list for an item the game data doesn't have", async () => {
    await renderAt("/library/items/nope", "item")
    await waitFor(() =>
      expect(screen.getByTestId("path").textContent).toBe("/library/items")
    )
  })
})
