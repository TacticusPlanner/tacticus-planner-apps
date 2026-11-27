import userEvent from "@testing-library/user-event"
import type { EquipmentStorageModel } from "@workspace/game-catalog"
import { describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"

import { testItem, testOwnedCharacter } from "../../model/items/items-fixtures"
import type { OwnedItems } from "../../model/items/owned-items"
import { ItemsPiecesTab } from "./items-pieces-tab"

const sword = testItem("X_Crit_E001", {
  name: "Power Sword",
  rarity: "Epic",
  levels: 6,
  allowedFactions: ["Ultramarines"],
}) as unknown as EquipmentStorageModel
const shield = testItem("X_Block_L001", {
  name: "Storm Shield",
  type: "I_Block",
  rarity: "Legendary",
}) as unknown as EquipmentStorageModel

const owned: OwnedItems<EquipmentStorageModel> = {
  pieces: [
    {
      item: sword,
      levels: [
        { level: 4, spare: 0, wearers: ["ultraTitus"] },
        { level: 1, spare: 2, wearers: [] },
      ],
      spare: 2,
      worn: 1,
    },
    {
      item: shield,
      levels: [{ level: 1, spare: 1, wearers: [] }],
      spare: 1,
      worn: 0,
    },
  ],
  characters: [
    testOwnedCharacter("ultraTitus", ["I_Crit"], ["X_Crit_E001"], {
      worn: [{ slotIndex: 0, itemId: "X_Crit_E001", level: 4 }],
    }),
  ],
  unknownCopies: 3,
}

vi.mock("./items-outlet", () => ({
  useItemsOutlet: () => ({
    owned,
    itemsById: new Map([
      [sword.id, sword],
      [shield.id, shield],
    ]),
    charactersById: new Map(),
  }),
}))

vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => (_type: string, id: string) =>
    id === "ultraTitus" ? "Marneus Calgar" : id,
}))

const renderTab = (search = "") =>
  render(<ItemsPiecesTab />, {
    route: "/my-game/items/pieces",
    initialEntries: [`/my-game/items/pieces${search}`],
  })

describe("ItemsPiecesTab", () => {
  it("lists every owned item with its levels, spares and wearers", async () => {
    renderTab()
    const cards = await screen.findAllByTestId("item-piece")
    expect(cards.map((card) => card.dataset.itemId)).toEqual([
      "X_Crit_E001",
      "X_Block_L001",
    ])
    expect(cards[0]).toHaveAccessibleName("Power Sword: 2 spare, 1 worn")
    expect(
      within(cards[0] as HTMLElement).getByText("Lv 4")
    ).toBeInTheDocument()
    expect(screen.getByTestId("items-unknown-copies")).toHaveTextContent(
      "3 copies"
    )
  })

  it("keeps spares only and offers to clear a search that matches nothing", async () => {
    const user = userEvent.setup()
    renderTab("?spares=1&q=zzz")
    const noMatch = await screen.findByTestId("items-pieces-no-match")
    await user.click(
      within(noMatch).getByRole("button", { name: "Clear filters" })
    )
    expect(await screen.findAllByTestId("item-piece")).toHaveLength(2)
  })

  it("opens an item's details with its stats and upgrade costs", async () => {
    const user = userEvent.setup()
    renderTab("?layout=table")
    await user.click(await screen.findByRole("button", { name: /Power Sword/ }))
    const dialog = await screen.findByTestId("items-piece-details")
    expect(within(dialog).getByTestId("items-piece-owned")).toHaveTextContent(
      "Marneus Calgar"
    )
    expect(within(dialog).getByTestId("items-piece-upgrade")).toHaveTextContent(
      "Lv 4"
    )
  })
})
