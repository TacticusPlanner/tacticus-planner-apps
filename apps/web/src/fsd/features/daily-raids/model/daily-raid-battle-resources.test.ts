import { describe, expect, it } from "vitest"
import { battleIdSchema } from "@workspace/game-domain"

import { buildResourceByBattle } from "./daily-raid-battle-resources"

const battle = (id: string) => battleIdSchema.parse(id)

function upgrade(
  id: string,
  battleIds: string[],
  overrides: { label?: string; crafted?: boolean } = {}
) {
  return {
    id: id as never,
    label: overrides.label ?? `${id} label`,
    rarity: "Epic" as never,
    crafted: overrides.crafted ?? false,
    farmLocations: battleIds.map((battleId) => ({
      battleId: battle(battleId),
    })),
  }
}

function character(
  id: string,
  battleIds: string[],
  { isMythic = false }: { isMythic?: boolean } = {}
) {
  return {
    id: id as never,
    name: `${id} name`,
    shardLocations: battleIds.map((battleId) => ({
      battleId: battle(battleId),
      isMythic,
    })),
  }
}

describe("buildResourceByBattle", () => {
  it("resolves a node's upgrade material from the material's own farm locations", () => {
    const byBattle = buildResourceByBattle(
      [upgrade("ceramite", ["B1", "B2"], { label: "Ceramite" })],
      []
    )

    expect(byBattle.get(battle("B1"))).toEqual({
      label: "Ceramite",
      visual: {
        kind: "upgrade",
        id: "ceramite",
        rarity: "Epic",
        crafted: false,
      },
    })
    expect(byBattle.get(battle("B2"))?.label).toBe("Ceramite")
  })

  it("resolves a node's character shards when no material farms there", () => {
    const byBattle = buildResourceByBattle(
      [upgrade("ceramite", ["B1"])],
      [character("bellator", ["B2"])]
    )

    expect(byBattle.get(battle("B2"))).toEqual({
      label: "bellator name shards",
      visual: { kind: "shard", unitId: "bellator" },
    })
  })

  it("prefers a node's upgrade material over shards that drop at the same node", () => {
    const byBattle = buildResourceByBattle(
      [upgrade("ceramite", ["B1"], { label: "Ceramite" })],
      [character("bellator", ["B1"])]
    )

    expect(byBattle.get(battle("B1"))?.label).toBe("Ceramite")
  })

  it("skips mythic shard locations, which are never campaign nodes", () => {
    const byBattle = buildResourceByBattle(
      [],
      [character("bellator", ["B1"], { isMythic: true })]
    )

    expect(byBattle.has(battle("B1"))).toBe(false)
  })

  it("resolves two materials on one node the same way regardless of dataset order", () => {
    const adamantium = upgrade("adamantium", ["B1"], { label: "Adamantium" })
    const ceramite = upgrade("ceramite", ["B1"], { label: "Ceramite" })

    expect(
      buildResourceByBattle([adamantium, ceramite], []).get(battle("B1"))?.label
    ).toBe("Adamantium")
    expect(
      buildResourceByBattle([ceramite, adamantium], []).get(battle("B1"))?.label
    ).toBe("Adamantium")
  })

  it("routes both label kinds through the injected labeller, catalog strings as the fallback", () => {
    const byBattle = buildResourceByBattle(
      [upgrade("ceramite", ["B1"], { label: "Ceramite" })],
      [character("bellator", ["B2"])],
      {
        upgrade: (id, catalogLabel) => `t(${id})=${catalogLabel}`,
        shards: (unitId, name) => `t(${unitId})=${name}`,
      }
    )

    expect(byBattle.get(battle("B1"))?.label).toBe("t(ceramite)=Ceramite")
    expect(byBattle.get(battle("B2"))?.label).toBe("t(bellator)=bellator name")
  })

  it("leaves a node no material or shard points at unresolved", () => {
    const byBattle = buildResourceByBattle([upgrade("ceramite", ["B1"])], [])

    expect(byBattle.has(battle("B9"))).toBe(false)
  })
})
