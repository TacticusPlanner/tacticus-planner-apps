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
  rangedDamage: z.string().nullish(),
  rangedHits: z.number().nullish(),
  rangeDistance: z.number().nullish(),
  movement: z.number(),
  traits: z.array(z.string()),
  activeAbilityNames: z.array(z.string()),
  passiveAbilityNames: z.array(z.string()),
  equipmentSlots: z.array(z.string()),
  icon: z.string(),
  roundIcon: z.string(),
  rankUpUpgrades: z.array(characterRankUpSchema),
  shardLocations: z.array(farmLocationSchema),
  eligibleEquipment: z.array(equipmentSlotSchema),
})
