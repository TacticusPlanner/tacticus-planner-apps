import userEvent from "@testing-library/user-event"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
} from "@workspace/game-catalog"
import { describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"

import {
  testCatalogCharacter,
  testItem,
} from "../../model/items/items-fixtures"
import type { OwnedItems } from "../../model/items/owned-items"
import { ItemsReclaimTab } from "./items-reclaim-tab"

const asItem = (item: ReturnType<typeof testItem>) =>
  item as unknown as EquipmentStorageModel
const knife = asItem(testItem("X_Crit_R001", { name: "Knife", rarity: "Rare" }))
const relic = asItem(
  testItem("X_Relic", { name: "Relic Blade", rarity: "Mythic", isRelic: true })
)

const owned: OwnedItems<EquipmentStorageModel> = {
  pieces: [
    {
      item: knife,
      levels: [
        { level: 3, spare: 1, wearers: [] },
        { level: 1, spare: 4, wearers: [] },
      ],
      spare: 5,
      worn: 0,
    },
    {
      item: relic,
      levels: [{ level: 1, spare: 1, wearers: [] }],
      spare: 1,
      worn: 0,
    },
  ],
  characters: [],
  unknownCopies: 0,
}

vi.mock("./items-outlet", () => ({
  useItemsOutlet: () => ({
    owned,
    suggestions: { characters: [], relics: [] },
    itemsById: new Map([knife, relic].map((i) => [i.id, i])),
    charactersById: new Map([
      [
        "a",
        testCatalogCharacter(
          "a",
          ["I_Crit"],
          [knife.id]
        ) as unknown as CharacterStorageModel,
      ],
      [
        "b",
        testCatalogCharacter(
          "b",
          ["I_Crit"],
          [knife.id]
        ) as unknown as CharacterStorageModel,
      ],
    ]),
  }),
}))

const renderTab = () =>
  render(<ItemsReclaimTab />, {
    route: "/my-game/items/reclaim",
    initialEntries: ["/my-game/items/reclaim"],
  })

describe("ItemsReclaimTab", () => {
  it("sums what the safe copies return and says why each stack is safe", async () => {
    renderTab()
    // Two characters could use a knife: the Lv 3 copy and one Lv 1 copy are kept.
    expect(
      await screen.findByTestId("items-reclaim-safe-count")
    ).toHaveTextContent("3 items")
    const stacks = screen.getAllByTestId("item-reclaim-stack")
    expect(stacks).toHaveLength(1)
    expect(stacks[0]).toHaveTextContent("Reclaim 3 of 4")
    expect(stacks[0]).toHaveTextContent(
      "You hold 5; 2 characters could still use one"
    )
  })

  it("shows the kept stacks too once 'Safe only' is off", async () => {
    const user = userEvent.setup()
    renderTab()
    await user.click(await screen.findByTestId("items-reclaim-safe-chip"))
    const stacks = screen.getAllByTestId("item-reclaim-stack")
    expect(stacks.map((stack) => stack.dataset.itemId)).toEqual([
      "X_Relic",
      "X_Crit_R001",
      "X_Crit_R001",
    ])
    expect(
      within(stacks[0] as HTMLElement).getByText("Keep all 1")
    ).toBeVisible()
  })
})
