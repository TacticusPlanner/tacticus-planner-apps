import { z } from "zod"
import {
  Alliance,
  equipmentIdSchema,
  unitIdSchema,
} from "@workspace/game-domain"

// A mythic quest reward, parsed server-side from V1's "type[:amount]" strings. The server's set of types is
// closed (an unknown reward string fails catalog startup), so an unknown `type` here is a contract break.
const mythicRaritySchema = z.literal("Mythic")

export const mythicQuestRewardSchema = z.discriminatedUnion("type", [
  z.looseObject({
    type: z.literal("MythicShards"),
    amount: z.number(),
    unitId: unitIdSchema,
  }),
  z.looseObject({
    type: z.literal("AscensionOrb"),
    amount: z.number(),
    rarity: mythicRaritySchema,
    alliance: z.enum(Alliance),
  }),
  z.looseObject({
    type: z.literal("AbilityBadge"),
    amount: z.number(),
    rarity: mythicRaritySchema,
    alliance: z.enum(Alliance),
  }),
  z.looseObject({
    type: z.literal("XpBook"),
    amount: z.number(),
    rarity: mythicRaritySchema,
  }),
  z.looseObject({ type: z.literal("Gold"), amount: z.number() }),
  z.looseObject({
    type: z.literal("Equipment"),
    amount: z.number(),
    equipmentId: equipmentIdSchema,
  }),
])

// One task: `locaKey` names the client's task-text template (game text), `parameters` are V1's task
// parameters unchanged (string values, e.g. `killAmount: "8"`, `heroId`).
const mythicQuestTaskSchema = z.looseObject({
  locaKey: z.string(),
  target: z.number(),
  parameters: z.record(z.string(), z.string()),
})

export const mythicQuestSchema = z.looseObject({
  number: z.number(),
  tasks: z.array(mythicQuestTaskSchema),
  rewards: z.array(mythicQuestRewardSchema),
})

// One character's mythic quests (quests ordered by number), one record per character that has any.
export const mythicQuestsSchema = z.looseObject({
  unitId: unitIdSchema,
  quests: z.array(mythicQuestSchema),
})
