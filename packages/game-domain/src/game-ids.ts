import { z } from "zod"

export const unitIdSchema = z.string().brand<"UnitId">()
export type UnitId = z.infer<typeof unitIdSchema>

export const campaignIdSchema = z.string().brand<"CampaignId">()
export type CampaignId = z.infer<typeof campaignIdSchema>

export const upgradeIdSchema = z.string().brand<"UpgradeId">()
export type UpgradeId = z.infer<typeof upgradeIdSchema>

export const equipmentIdSchema = z.string().brand<"EquipmentId">()
export type EquipmentId = z.infer<typeof equipmentIdSchema>

export const abilityIdSchema = z.string().brand<"AbilityId">()
export type AbilityId = z.infer<typeof abilityIdSchema>

export const factionIdSchema = z.string().brand<"FactionId">()
export type FactionId = z.infer<typeof factionIdSchema>

export const battleIdSchema = z.string().brand<"BattleId">()
export type BattleId = z.infer<typeof battleIdSchema>
