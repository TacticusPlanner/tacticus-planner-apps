import { describe, expect, it } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import { searchUnits, type UnitListItem } from "./unit-list.model"

const unit = (id: string, name: string, searchNames?: string[]) =>
  ({
    id: id as UnitId,
    name,
    searchNames,
    factionId: "DeathGuard",
    factionName: "Death Guard",
    alliance: "Chaos",
  }) as UnitListItem

describe("searchUnits", () => {
  const items = [
    unit("deathRotbone", "Nauseous", ["Nauseous Rotbone"]),
    unit("deathTyphus", "Typhus"),
  ]

  it("matches the displayed name or any of the unit's other names", () => {
    expect(searchUnits(items, "nau").map((item) => item.id)).toEqual([
      "deathRotbone",
    ])
    expect(searchUnits(items, "rotbone").map((item) => item.id)).toEqual([
      "deathRotbone",
    ])
    expect(searchUnits(items, "typh").map((item) => item.id)).toEqual([
      "deathTyphus",
    ])
  })

  it("keeps everything for a blank query", () => {
    expect(searchUnits(items, " ")).toHaveLength(2)
  })
})
