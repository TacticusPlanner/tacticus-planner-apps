import { z } from "zod"
import {
  Alliance,
  factionIdSchema,
  Rarity,
  unitIdSchema,
} from "@workspace/game-domain"

import {
  characterRankUpSchema,
  equipmentSlotSchema,
  farmLocationSchema,
} from "./shared"

export const characterViewSchema = z.looseObject({
  id: unitIdSchema,
  name: z.string(),
  faction: factionIdSchema,
  alliance: z.enum(Alliance),
  health: z.number(),
  damage: z.number(),
  armour: z.number(),
  initialRarity: z.enum(Rarity),
  meleeDamage: z.string(),
  meleeHits: z.number(),
  rangedDamage: z.string().nullable(),
  rangedHits: z.number().nullable(),
  rangeDistance: z.number().nullable(),
  movement: z.number(),
  traits: z.array(z.string()),
  activeAbilityNames: z.array(z.string()),
  passiveAbilityNames: z.array(z.string()),
  // Damage type(s) each ability can deal. Not yet populated server-side for characters (unlike
  // npcSchema's activeAbilityDamage/passiveAbilityDamage) — default to [] so older/interim
  // payloads still validate; the unit-lookup UI renders nothing for an empty array.
  activeAbilityDamage: z.array(z.string()).default([]),
  passiveAbilityDamage: z.array(z.string()).default([]),
  equipmentSlots: z.array(z.string()),
  rankUpUpgrades: z.array(characterRankUpSchema),
  shardLocations: z.array(farmLocationSchema),
  eligibleEquipment: z.array(equipmentSlotSchema),
})
