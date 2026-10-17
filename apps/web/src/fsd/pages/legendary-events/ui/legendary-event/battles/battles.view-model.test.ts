import { describe, expect, it, vi } from "vitest"

import type { LaneProgressView } from "@/entities/legendary-event"
import type { NpcRecord } from "@/entities/npc"
import {
  lysanderBattleNpcs,
  lysanderBattles,
} from "@/test/fixtures/lysander-battles"

import { buildBattlesSection } from "./battles.view-model"

const npcs: ReadonlyMap<string, NpcRecord> = new Map(
  lysanderBattleNpcs.map((npc) => [npc.id, npc])
)
const laneIds = (lane: string) =>
  Array.from({ length: 18 }, (_, index) => `astarLysander-${lane}-${index + 1}`)

function progress(completeCount: number): LaneProgressView {
  return {
    status: "synced",
    battles: Array.from({ length: 18 }, (_, index) => ({
      complete: index < completeCount,
    })),
  } as unknown as LaneProgressView
}

function ready(
  lane: string,
  options: {
    npcs?: ReadonlyMap<string, NpcRecord> | "loading" | "error"
    progress?: LaneProgressView
  } = {}
) {
  const state = buildBattlesSection({
    battleIds: laneIds(lane),
    battles: lysanderBattles,
    retryBattles: () => {},
    npcs: options.npcs ?? npcs,
    retryNpcs: () => {},
    progress: options.progress,
  })
  if (state.kind !== "ready")
    throw new Error(`expected ready, got ${state.kind}`)
  return state
}

describe("buildBattlesSection", () => {
  it("lists a lane's battles in battleIds order with Alpha battle 1's header", () => {
    const state = ready("alpha")
    expect(state.battles.map((battle) => battle.number)).toEqual(
      Array.from({ length: 18 }, (_, index) => index + 1)
    )
    const [first] = state.battles
    expect(first).toMatchObject({
      number: 1,
      power: 994,
      enemyCount: 32,
      mapId: "LE1_26",
    })
    expect(first!.waves.map((wave) => wave.round)).toEqual([1, 3, 4, 5, 6, 8])
  })

  it("resolves Alpha battle 1's tiles from the ladder index", () => {
    const [wave1, wave2] = ready("alpha").battles[0]!.waves
    expect(wave1).toMatchObject({ number: 1, round: 1, power: 147 })
    expect(wave1!.enemies).toHaveLength(1)
    expect(wave1!.enemies[0]).toMatchObject({
      npcId: "orksNpc1Grot",
      count: 7,
      level: "resolved",
      row: expect.objectContaining({ rank: 2, stars: 1, health: 69 }),
      libraryHref: "/library/npcs/grot?variation=orksNpc1Grot&level=3",
    })
    expect(wave2).toMatchObject({ number: 2, round: 3, power: 132 })
    expect(
      wave2!.enemies.map((tile) => [tile.npcId, tile.count, tile.row?.rank])
    ).toEqual([
      ["orksNpc1Grot", 3, 3],
      ["orksNpc2OrkBoy", 1, expect.any(Number)],
    ])
  })

  it("labels Helbrecht past the end of its ladder as an unknown level", () => {
    const battle13 = ready("beta").battles[12]!
    const round3 = battle13.waves.find((wave) => wave.round === 3)!
    const helbrecht = round3.enemies.find(
      (tile) => tile.npcId === "templBossHelbrecht"
    )
    expect(helbrecht).toMatchObject({
      level: "unknownLevel",
      row: undefined,
      libraryHref: undefined,
    })
    expect(helbrecht?.npc?.name).toBe("Helbrecht")
    expect(
      round3.enemies
        .filter((tile) => tile.npcId !== "templBossHelbrecht")
        .every((tile) => tile.level === "resolved")
    ).toBe(true)
  })

  it("keeps tiles without a level while NPCs are pending", () => {
    const tile = ready("alpha", { npcs: "loading" }).battles[0]!.waves[0]!
      .enemies[0]!
    expect(tile).toMatchObject({
      npcId: "orksNpc1Grot",
      npc: undefined,
      row: undefined,
      level: "pending",
    })
  })

  it("tells a failed NPC read apart from a pending one and offers its retry", () => {
    const retryNpcs = vi.fn()
    const state = buildBattlesSection({
      battleIds: laneIds("alpha"),
      battles: lysanderBattles,
      retryBattles: () => {},
      npcs: "error",
      retryNpcs,
      progress: undefined,
    })
    if (state.kind !== "ready") throw new Error("expected ready")
    expect(state.battles[0]!.waves[0]!.enemies[0]).toMatchObject({
      npcId: "orksNpc1Grot",
      row: undefined,
      level: "unavailable",
    })
    state.retryNpcs?.()
    expect(retryNpcs).toHaveBeenCalledOnce()
    expect(ready("alpha").retryNpcs).toBeUndefined()
    expect(ready("alpha", { npcs: "loading" }).retryNpcs).toBeUndefined()
  })

  it("links only variations the Library lists", () => {
    const grot = npcs.get("orksNpc1Grot")!
    const unlisted = new Map(npcs)
    unlisted.set("orksNpc1Grot", {
      ...grot,
      kind: "summon",
    } as unknown as NpcRecord)
    const tile = ready("alpha", { npcs: unlisted }).battles[0]!.waves[0]!
      .enemies[0]!
    expect(tile.level).toBe("resolved")
    expect(tile.libraryHref).toBeUndefined()
  })

  it("defaults to the first incomplete battle and marks complete ones", () => {
    const state = ready("beta", { progress: progress(6) })
    expect(state.defaultIndex).toBe(6)
    expect(state.battles.map((battle) => battle.complete).slice(0, 8)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      false,
    ])
    expect(ready("alpha").defaultIndex).toBe(0)
    expect(ready("gamma", { progress: progress(18) }).defaultIndex).toBe(17)
  })

  it("reports loading, error with retry, and a lane without battles", () => {
    const retry = vi.fn()
    const base = {
      battleIds: laneIds("alpha"),
      retryBattles: retry,
      npcs,
      retryNpcs: () => {},
      progress: undefined,
    }
    expect(buildBattlesSection({ ...base, battles: "loading" })).toEqual({
      kind: "loading",
    })
    const error = buildBattlesSection({ ...base, battles: "error" })
    expect(error.kind).toBe("error")
    if (error.kind === "error") error.retry()
    expect(retry).toHaveBeenCalledOnce()
    expect(
      buildBattlesSection({
        ...base,
        battleIds: ["other-gamma-1"],
        battles: lysanderBattles,
      })
    ).toEqual({ kind: "empty" })
  })
})
