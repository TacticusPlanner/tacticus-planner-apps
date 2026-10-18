// Lysander's served `lre-battles` records (all three lanes, 54 battles) and the served `npcs`
// records their wave enemies name, built from the real catalog source (tacticus-planner-api
// GameCatalog Data/lres/lres-astarlysander.json and Data/npcs) with wave enemies keyed `ladderIndex`.
import type {
  LegendaryEventBattleStorageModel,
  NpcStorageModel,
} from "@workspace/game-catalog"

import battles from "./lysander-battles.json"
import npcs from "./lysander-battle-npcs.json"

export const lysanderBattles =
  battles as unknown as LegendaryEventBattleStorageModel[]

export const lysanderBattleNpcs = npcs as unknown as NpcStorageModel[]
