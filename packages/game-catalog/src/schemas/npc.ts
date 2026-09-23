import { z } from "zod"
import { Alliance, factionIdSchema, unitIdSchema } from "@workspace/game-domain"

const npcStatSchema = z.looseObject({
  abilityLevel: z.number(),
  damage: z.number(),
  armour: z.number(),
  health: z.number(),
  progressionIndex: z.number(),
  rank: z.number(),
  stars: z.number(),
})

// Server-derived classification: `object` for a loot object (from the raw objects file), `machineOfWar`
// for a record carrying the MachineOfWar trait, `unit` otherwise. Never inferred from the id's spelling.
const npcKindSchema = z.enum(["unit", "machineOfWar", "object"])

export const npcSchema = z.looseObject({
  id: unitIdSchema,
  name: z.string(),
  factionId: factionIdSchema,
  alliance: z.enum(Alliance),
  kind: npcKindSchema,
  meleeDamage: z.string(),
  meleeHits: z.number(),
  rangedDamage: z.string().nullable(),
  rangedHits: z.number().nullable(),
  distance: z.number().nullable(),
  movement: z.number(),
  traits: z.array(z.string()),
  activeAbilityDamage: z.array(z.string()),
  activeAbilities: z.array(z.string()),
  passiveAbilityDamage: z.array(z.string()),
  passiveAbilities: z.array(z.string()),
  stats: z.array(npcStatSchema),
})
