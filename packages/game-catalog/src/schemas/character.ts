import { z } from "zod"

import {
  characterRankUpSchema,
  equipmentSlotSchema,
  farmLocationSchema,
} from "./shared"

export const characterViewSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  faction: z.string(),
  alliance: z.string(),
  health: z.number(),
  damage: z.number(),
  armour: z.number(),
  initialRarity: z.string(),
  meleeDamage: z.string(),
  meleeHits: z.number(),
  rangedDamage: z.string().nullable(),
  rangedHits: z.number().nullable(),
  rangeDistance: z.number().nullable(),
  movement: z.number(),
  traits: z.array(z.string()),
  activeAbilityNames: z.array(z.string()),
  passiveAbilityNames: z.array(z.string()),
  equipmentSlots: z.array(z.string()),
  rankUpUpgrades: z.array(characterRankUpSchema),
  shardLocations: z.array(farmLocationSchema),
  eligibleEquipment: z.array(equipmentSlotSchema),
})
