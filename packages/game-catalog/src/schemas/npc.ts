import { z } from "zod"

export const npcStatSchema = z.looseObject({
  abilityLevel: z.number(),
  damage: z.number(),
  armour: z.number(),
  health: z.number(),
  progressionIndex: z.number(),
  rank: z.number(),
  stars: z.number(),
})

export const npcSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  meleeDamage: z.string(),
  meleeHits: z.number(),
  rangedDamage: z.string().nullish(),
  rangedHits: z.number().nullish(),
  distance: z.number().nullish(),
  movement: z.number(),
  traits: z.array(z.string()),
  activeAbilityDamage: z.array(z.string()),
  activeAbilities: z.array(z.string()),
  passiveAbilityDamage: z.array(z.string()),
  passiveAbilities: z.array(z.string()),
  icon: z.string().nullish(),
  stats: z.array(npcStatSchema),
})
