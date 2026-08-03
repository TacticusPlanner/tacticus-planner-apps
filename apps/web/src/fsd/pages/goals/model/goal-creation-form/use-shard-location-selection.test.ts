import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { CharacterStorageModel } from "@workspace/game-catalog"
import {
  battleIdSchema,
  campaignIdSchema,
  type BattleId,
} from "@workspace/game-domain"

import type { Battle } from "@/features/goal-farming"
import { useShardLocationSelection } from ".//use-shard-location-selection"

const battleId = battleIdSchema.parse
const campaignId = campaignIdSchema.parse

const battle = (energyCost: number): Battle => ({
  campaignGroupId: campaignId("campaign1"),
  type: "Standard",
  challenge: false,
  nodeNumber: 1,
  energyCost,
  dailyAttempts: 10,
})

const characterView = {
  id: "hero1",
  initialRarity: "Common",
  shardLocations: [
    { battleId: battleId("cheap"), guaranteed: true, isMythic: false },
    { battleId: battleId("expensive"), guaranteed: true, isMythic: false },
    { battleId: battleId("mythic"), guaranteed: true, isMythic: true },
  ],
} as unknown as CharacterStorageModel

const battlesById = new Map<BattleId, Battle>([
  [battleId("cheap"), battle(10)],
  [battleId("expensive"), battle(100)],
  [battleId("mythic"), battle(20)],
])

function setup(entityId: string | undefined = "hero1") {
  return renderHook(
    (props: { entityId: string | undefined }) =>
      useShardLocationSelection({
        entityType: "Character",
        entityId: props.entityId,
        charactersById: new Map([["hero1", characterView]]),
        unlockShardCostsById: new Map(),
        lockedShards: 0,
        battlesById,
        dailyEnergy: 288,
      }),
    { initialProps: { entityId } }
  )
}

describe("useShardLocationSelection", () => {
  it("defaults to the lowest energy-per-shard node of each type, without any manual selection", () => {
    const { result } = setup()

    expect(result.current.shardLocationIds).toEqual(["cheap", "mythic"])
    expect(result.current.selectedRegularShardLocationIds).toEqual(["cheap"])
    expect(result.current.selectedMythicShardLocationIds).toEqual(["mythic"])
  })

  it("respects a manual deselect of the default down to zero, rather than fighting it back on", () => {
    const { result } = setup()
    expect(result.current.shardLocationIds).toEqual(["cheap", "mythic"])

    act(() => result.current.toggleShardLocation("cheap", false))

    expect(result.current.shardLocationIds).toEqual(["mythic"])
    expect(result.current.selectedRegularShardLocationIds).toEqual([])
  })

  it("lets a manual toggle add the more expensive node alongside the default", () => {
    const { result } = setup()

    act(() => result.current.toggleShardLocation("expensive", true))

    expect(result.current.selectedRegularShardLocationIds.sort()).toEqual([
      "cheap",
      "expensive",
    ])
  })

  it("restores the live default (not the pre-edit manual selection) once reset() is called", () => {
    const { result } = setup()
    act(() => result.current.toggleShardLocation("cheap", false))
    expect(result.current.shardLocationIds).toEqual(["mythic"])

    act(() => result.current.reset())

    expect(result.current.shardLocationIds).toEqual(["cheap", "mythic"])
  })
})
