import { describe, expect, it } from "vitest"

import { rankEntities, unitOfPath } from "./entity-search"
import type { SearchEntity } from "./entity-search"

const entity = (
  kind: SearchEntity["kind"],
  name: string,
  searchNames: string[] = []
): SearchEntity => ({
  kind,
  id: name.replaceAll(" ", ""),
  name,
  searchNames,
  to: `/x/${kind}/${name}`,
})

describe("rankEntities", () => {
  it("groups matches by kind in a fixed order, best match first", () => {
    const ranked = rankEntities(
      [
        entity("npcs", "Ragnar's Wolf"),
        entity("characters", "Grey Ragnar"),
        entity("characters", "Ragnar Blackmane"),
        entity("mows", "Galatian"),
      ],
      "ragnar"
    )

    expect(ranked.map((group) => group.kind)).toEqual(["characters", "npcs"])
    expect(ranked[0]?.entries.map(({ entity: e }) => e.name)).toEqual([
      "Ragnar Blackmane",
      "Grey Ragnar",
    ])
  })

  it("matches other names, needs two characters and lists at most five per kind", () => {
    const many = Array.from({ length: 7 }, (_, index) =>
      entity("characters", `Abaddon ${index}`)
    )

    expect(
      rankEntities(
        [entity("characters", "Marneus Calgar", ["calgar"])],
        "ca"
      )[0]?.entries[0]?.tier
    ).toBe(1)
    expect(rankEntities(many, "a")).toEqual([])
    expect(rankEntities(many, "abaddon")[0]?.entries).toHaveLength(5)
  })
})

describe("unitOfPath", () => {
  it("finds the character or Machine of War whose page is open, never another kind", () => {
    const calgar = entity("characters", "Calgar")
    const boss = entity("raidBosses", "Belisarius")

    expect(unitOfPath([calgar, boss], calgar.to)).toBe(calgar)
    expect(unitOfPath([calgar, boss], boss.to)).toBeUndefined()
  })
})
