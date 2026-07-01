import { z } from "zod"

import type { GameCatalogDatasetKey } from "../dataset-keys"
import { campaignBattleViewSchema, campaignDefinitionSchema } from "./campaign"
import { characterViewSchema } from "./character"
import { equipmentSchema } from "./equipment"
import { lreBattleViewSchema, lreCommonSchema, lreViewSchema } from "./lre"
import { mowSchema, mowUpgradeCostSchema } from "./mow"
import { npcSchema } from "./npc"
import { upgradeViewSchema } from "./upgrade"

// ---- dataset payloads (the envelope `data`) --------------------------------------------------
// Every served dataset is now a plain array of records (reference tables inlined or split out as their
// own dataset), so there are no wrapper/extras shapes.
export const datasetPayloadSchemas = {
  characters: z.array(characterViewSchema),
  npcs: z.array(npcSchema),
  mows: z.array(mowSchema),
  "mow-upgrade-costs": z.array(mowUpgradeCostSchema),
  upgrades: z.array(upgradeViewSchema),
  equipment: z.array(equipmentSchema),
  "campaign-battles": z.array(campaignBattleViewSchema),
  "campaign-definitions": z.array(campaignDefinitionSchema),
  lres: z.array(lreViewSchema),
  "lre-battles": z.array(lreBattleViewSchema),
  "lre-common": z.array(lreCommonSchema),
} satisfies Record<GameCatalogDatasetKey, z.ZodType>

// Record (per-item) type for each dataset. Every dataset is a plain array, so the record type is the
// element type of its payload.
export type GameCatalogRecordByKey = {
  characters: z.infer<typeof characterViewSchema>
  npcs: z.infer<typeof npcSchema>
  mows: z.infer<typeof mowSchema>
  "mow-upgrade-costs": z.infer<typeof mowUpgradeCostSchema>
  upgrades: z.infer<typeof upgradeViewSchema>
  equipment: z.infer<typeof equipmentSchema>
  "campaign-battles": z.infer<typeof campaignBattleViewSchema>
  "campaign-definitions": z.infer<typeof campaignDefinitionSchema>
  lres: z.infer<typeof lreViewSchema>
  "lre-battles": z.infer<typeof lreBattleViewSchema>
  "lre-common": z.infer<typeof lreCommonSchema>
}
