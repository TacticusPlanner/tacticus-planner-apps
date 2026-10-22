import { describe, expect, it } from "vitest"

import {
  COLLECTION_ORIGIN_PATH,
  readUnitOrigin,
  unitLibraryPath,
  unitNeighbours,
  unitOriginState,
} from "./unit-origin"

describe("unit origin", () => {
  it("reads an origin from history state and ignores anything else", () => {
    const origin = { kind: "list" as const, ids: ["a", "b"] }
    expect(readUnitOrigin(unitOriginState(origin))).toEqual(origin)
    expect(readUnitOrigin(null)).toBeUndefined()
    expect(readUnitOrigin({ unitOrigin: { kind: "elsewhere", ids: [] } })).toBe(
      undefined
    )
  })

  it("reads a Collection origin", () => {
    const origin = { kind: "collection" as const, ids: ["a"] }
    expect(readUnitOrigin(unitOriginState(origin))).toEqual(origin)
  })

  it("finds the neighbours and position in the origin's order", () => {
    expect(unitNeighbours(["a", "b", "c"], "b")).toEqual({
      index: 1,
      total: 3,
      previousId: "a",
      nextId: "c",
    })
    expect(unitNeighbours(["a", "b", "c"], "a").previousId).toBeUndefined()
    expect(unitNeighbours(["a", "b", "c"], "c").nextId).toBeUndefined()
    expect(unitNeighbours(["a", "b"], "z")).toEqual({ index: -1, total: 2 })
  })
})

describe("unit paths", () => {
  it("opens a character in the Library's characters section", () => {
    expect(unitLibraryPath("character", "ultraTitus")).toBe(
      "/library/characters/ultraTitus"
    )
  })

  it("opens a Machine of War in the Library's Machines of War section", () => {
    expect(unitLibraryPath("mow", "ultraDreadnought")).toBe(
      "/library/machines-of-war/ultraDreadnought"
    )
  })

  it("returns to My Game's Collection", () => {
    expect(COLLECTION_ORIGIN_PATH).toBe("/my-game/collection")
  })
})
