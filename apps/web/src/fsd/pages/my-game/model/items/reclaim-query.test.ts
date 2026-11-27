import { describe, expect, it } from "vitest"

import { testItem } from "./items-fixtures"
import type { ReclaimStack } from "./reclaim"
import {
  DEFAULT_RECLAIM_QUERY,
  filterReclaimStacks,
  groupReclaimStacks,
  readReclaimQuery,
  writeReclaimQuery,
} from "./reclaim-query"

const stack = (
  id: string,
  type: string,
  level: number,
  safe: number
): ReclaimStack => ({
  item: testItem(id, { type, name: id }),
  level,
  spare: 3,
  safe,
  reserved: 0,
  reason: { kind: "covered", rarity: "Rare" },
  value: { gold: 0, salvage: 0, mythicSalvage: 0 },
})

const stacks = [
  stack("knife", "I_Crit", 1, 2),
  stack("sword", "I_Crit", 4, 0),
  stack("shield", "I_Block", 2, 1),
]

const ids = (patch: Partial<typeof DEFAULT_RECLAIM_QUERY>) =>
  filterReclaimStacks(
    stacks,
    { ...DEFAULT_RECLAIM_QUERY, ...patch },
    { nameOf: (item) => item.name, locale: "en" }
  ).map((s) => s.item.id)

describe("reclaim query", () => {
  it("keeps 'Safe only' on unless the URL turns it off", () => {
    expect(readReclaimQuery(new URLSearchParams())).toEqual(
      DEFAULT_RECLAIM_QUERY
    )
    const params = writeReclaimQuery(new URLSearchParams(), {
      safe: false,
      upgraded: true,
    })
    expect(params.toString()).toBe("safe=0&upgraded=1")
    expect(readReclaimQuery(params)).toEqual({
      q: "",
      safe: false,
      upgraded: true,
    })
  })

  it("filters safe, upgraded and searched stacks", () => {
    expect(ids({})).toEqual(["knife", "shield"])
    expect(ids({ safe: false })).toEqual(["knife", "sword", "shield"])
    expect(ids({ safe: false, upgraded: true })).toEqual(["sword", "shield"])
    expect(ids({ q: "SHI" })).toEqual(["shield"])
  })

  it("groups stacks by slot in their order", () => {
    expect(
      groupReclaimStacks(stacks).map((g) => [g.slot, g.stacks.length])
    ).toEqual([
      ["I_Crit", 2],
      ["I_Block", 1],
    ])
  })
})
