import userEvent from "@testing-library/user-event"
import type { EquipmentStorageModel } from "@workspace/game-catalog"
import { describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"

import { testItem, testOwnedCharacter } from "../../model/items/items-fixtures"
import type { ItemSuggestions } from "../../model/items/suggestions"
import { ItemsSuggestionsTab } from "./items-suggestions-tab"

const asItem = (item: ReturnType<typeof testItem>) =>
  item as unknown as EquipmentStorageModel
const knife = asItem(testItem("X_Crit_R001", { name: "Knife", rarity: "Rare" }))
const sword = asItem(testItem("X_Crit_E001", { name: "Sword", rarity: "Epic" }))
const armour = asItem(
  testItem("X_Def_R001", { name: "Carapace", type: "I_Defensive" })
)
const relic = asItem(
  testItem("X_Relic", {
    name: "Relic Blade",
    rarity: "Mythic",
    isRelic: true,
    allowedUnits: ["ultraTitus"],
  })
)

const suggestions: ItemSuggestions<EquipmentStorageModel> = {
  characters: [
    {
      characterId: "ultraTitus",
      faction: "Ultramarines",
      rarity: "Legendary",
      suggestions: [
        {
          slotIndex: 0,
          slotType: "I_Crit",
          locked: false,
          current: { itemId: knife.id, level: 3 },
          next: { itemId: sword.id, level: 1 },
          reason: { kind: "rarity", from: "Rare", to: "Epic" },
          gain: 100,
        },
        {
          slotIndex: 2,
          slotType: "I_Defensive",
          locked: true,
          next: { itemId: armour.id, level: 2 },
          reason: { kind: "empty" },
          gain: 302,
        },
      ],
    },
  ],
  relics: [
    {
      item: relic,
      copies: [{ level: 4, spare: 1 }],
      wearers: [{ characterId: "ultraTitus", status: "needsMythic" }],
    },
  ],
}

vi.mock("./items-outlet", () => ({
  useItemsOutlet: () => ({
    owned: {
      pieces: [],
      characters: [testOwnedCharacter("ultraTitus", ["I_Crit"], [])],
      unknownCopies: 0,
    },
    suggestions,
    itemsById: new Map([knife, sword, armour, relic].map((i) => [i.id, i])),
    charactersById: new Map(),
  }),
}))

vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => (_type: string, id: string) =>
    id === "ultraTitus" ? "Marneus Calgar" : id,
}))

const renderTab = (search = "") =>
  render(<ItemsSuggestionsTab />, {
    route: "/my-game/items/suggestions",
    initialEntries: [`/my-game/items/suggestions${search}`],
  })

describe("ItemsSuggestionsTab", () => {
  it("shows each suggestion with its reason, and slots not open yet only on request", async () => {
    const user = userEvent.setup()
    renderTab()
    const card = await screen.findByTestId("item-suggestion-character")
    expect(within(card).getByText("Marneus Calgar")).toBeInTheDocument()
    expect(within(card).getAllByTestId("item-suggestion")).toHaveLength(1)
    expect(card).toHaveTextContent("Swap Knife Lv 3 for Sword Lv 1")
    expect(card).toHaveTextContent("Epic beats Rare")

    await user.click(screen.getByTestId("items-suggestions-unlocked-chip"))
    const rows = within(
      screen.getByTestId("item-suggestion-character")
    ).getAllByTestId("item-suggestion")
    expect(rows).toHaveLength(2)
    expect(rows[1]).toHaveTextContent("Equip Carapace Lv 2")
    expect(rows[1]).toHaveTextContent("Once the third slot opens")
  })

  it("lists spare relics with who could wear them", async () => {
    renderTab()
    const relics = await screen.findByTestId("items-unworn-relics")
    expect(relics).toHaveTextContent("Relic Blade")
    expect(relics).toHaveTextContent("Needs Mythic")
  })

  it("offers to clear a search that matches no one", async () => {
    const user = userEvent.setup()
    renderTab("?q=nobody")
    const noMatch = await screen.findByTestId("items-suggestions-no-match")
    await user.click(
      within(noMatch).getByRole("button", { name: "Clear search" })
    )
    expect(
      await screen.findByTestId("item-suggestion-character")
    ).toBeInTheDocument()
  })
})
