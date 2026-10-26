import type {
  NpcStorageModel,
  QuestEventStorageModel,
} from "@workspace/game-catalog"
import { rarityOrder, type Rarity } from "@workspace/game-domain"

export type QuestBattle = QuestEventStorageModel["battles"][number]

/** A served enemy entry that is a board pickup (a power-up object), not an enemy. */
export function isBoardPickup(
  enemyId: string,
  npc: Pick<NpcStorageModel, "kind"> | undefined
): boolean {
  return npc ? npc.kind === "object" : enemyId.startsWith("powup")
}

/** The battles grouped under their tier, Common first, each in `number` order. */
export function battlesByTier(
  battles: readonly QuestBattle[]
): { tier: Rarity; battles: QuestBattle[] }[] {
  return rarityOrder
    .map((tier) => ({
      tier,
      battles: battles
        .filter((battle) => battle.tier === tier)
        .sort((a, b) => a.number - b.number),
    }))
    .filter((group) => group.battles.length > 0)
}

/** Each battle's served objective count, keyed by number, for fitting stored ticks. */
export function objectiveCounts(
  battles: readonly QuestBattle[]
): Map<number, number> {
  return new Map(
    battles.map((battle) => [battle.number, battle.objectives.length])
  )
}
