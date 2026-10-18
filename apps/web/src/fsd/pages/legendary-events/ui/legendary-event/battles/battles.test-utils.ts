import type { NpcRecord } from "@/entities/npc"
import {
  lysanderBattleNpcs,
  lysanderBattles,
} from "@/test/fixtures/lysander-battles"

import {
  buildBattlesSection,
  type BattlePreviewViewModel,
} from "./battles.view-model"

/** Lysander's lane battles as the section builds them, with every NPC resolved. */
export function lysanderLane(
  lane: "alpha" | "beta" | "gamma",
  completeCount = 0
): BattlePreviewViewModel[] {
  const state = buildBattlesSection({
    battleIds: Array.from(
      { length: 18 },
      (_, index) => `astarLysander-${lane}-${index + 1}`
    ),
    battles: lysanderBattles,
    retryBattles: () => {},
    npcs: new Map<string, NpcRecord>(
      lysanderBattleNpcs.map((npc) => [npc.id, npc])
    ),
    retryNpcs: () => {},
    progress: {
      status: "synced",
      battles: Array.from({ length: 18 }, (_, index) => ({
        complete: index < completeCount,
      })),
    } as never,
  })
  if (state.kind !== "ready") throw new Error("Lysander battles not ready")
  return state.battles
}
