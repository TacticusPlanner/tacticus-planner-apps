// The zod schemas for the branded game ids, for composing the catalog and player-data sync schemas.
// Kept off the package root so code that only handles ids never bundles zod; their output types are
// the root's `UnitId`, `CampaignId`, ... (see game-ids.ts).
import { z } from "zod"

export const unitIdSchema = z.string().brand<"UnitId">()
export const campaignIdSchema = z.string().brand<"CampaignId">()
export const upgradeIdSchema = z.string().brand<"UpgradeId">()
export const equipmentIdSchema = z.string().brand<"EquipmentId">()
export const abilityIdSchema = z.string().brand<"AbilityId">()
export const factionIdSchema = z.string().brand<"FactionId">()
export const battleIdSchema = z.string().brand<"BattleId">()
