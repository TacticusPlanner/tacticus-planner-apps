import { describe, expect, it } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import type { NavItem } from "./nav-items"
import type { NavigationEntry, NavigationGroup } from "./navigation-search"
import { chipPick, listPick, listRowCount } from "./navigation-search-analytics"

const raids = { path: "/dailies/raids" } as NavItem
const recentRaids: NavigationEntry = {
  kind: "section",
  key: "recent:/dailies/raids",
  item: raids,
  to: "/dailies/raids",
}
const pageRaids: NavigationEntry = { ...recentRaids, key: "/dailies/raids" }
const collection: NavigationEntry = {
  kind: "collectionSearch",
  key: "collection:calgar",
  query: "calgar",
  to: "/my-game/collection?q=calgar",
}
const groups: NavigationGroup[] = [
  { id: "recent", entries: [recentRaids] },
  { id: "pages", entries: [pageRaids] },
  { id: "characters", entries: [collection] },
]

describe("navigation search picks", () => {
  it("tells a recent page from the same page in the list, by its place in the whole list", () => {
    expect(listPick(groups, recentRaids)).toEqual({
      itemKind: "recentPage",
      target: "/dailies/raids",
      group: "recent",
      position: 1,
    })
    expect(listPick(groups, pageRaids)).toEqual({
      itemKind: "page",
      target: "/dailies/raids",
      group: "pages",
      position: 2,
    })
  })

  it("never reports Find in Collection's query", () => {
    expect(listPick(groups, collection)).toEqual({
      itemKind: "collectionSearch",
      target: "",
      group: "characters",
      position: 3,
    })
  })

  it("counts the unit chip ahead of the action chips", () => {
    expect(chipPick("sync", ["createGoal", "sync"], true)).toEqual({
      itemKind: "action",
      target: "sync",
      group: "chips",
      position: 3,
    })
    expect(
      chipPick(
        {
          createGoalFor: {
            entityType: "Mow",
            entityId: "adMechOnager" as UnitId,
          },
        },
        ["createGoal"],
        true
      )
    ).toEqual({
      itemKind: "unitGoal",
      target: "adMechOnager",
      group: "chips",
      position: 1,
    })
  })

  it("counts the rows of every group", () => {
    expect(listRowCount(groups)).toBe(3)
  })
})
