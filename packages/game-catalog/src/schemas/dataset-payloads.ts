import { z } from "zod"

import type { GameCatalogDatasetKey } from "../dataset-keys"
import { campaignBattleViewSchema, campaignDefinitionSchema } from "./campaign"
import { characterViewSchema } from "./character"
import { equipmentSchema } from "./equipment"
import { damageTypeSchema, factionSchema } from "./factions"
import { globalValuesSchema } from "./global-values"
import { progressionRulesSchema } from "./progression-rules"
import { hreSchema } from "./hre"
import { incursionSchema } from "./incursions"
import {
  eventDefinitionSchema,
  eventsCalendarPayloadSchema,
  eventsCalendarRowSchema,
} from "./events"
import { lreBattleViewSchema, lreViewSchema } from "./lre"
import { guildRaidMetaPayloadSchema } from "./guild-raid-meta"
import { hordeModeTiersSchema } from "./horde-mode-tiers"
import { mowSchema, mowUpgradeCostSchema } from "./mow"
import { mythicQuestsSchema } from "./mythic-quests"
import { characterAbilityCostSchema } from "./character-ability-costs"
import { npcSchema } from "./npc"
import { onslaughtRewardSchema } from "./onslaught"
import { ascensionCostSchema, unlockShardCostSchema } from "./progression-costs"
import { raidBossesPayloadSchema } from "./raid-bosses"
import { questCrateSchema, questEventSchema } from "./quests"
import { shopSchema } from "./shops"
import { unitPowerSchema } from "./unit-power"
import { upgradeViewSchema } from "./upgrade"

// ---- dataset payloads (the envelope `data`) --------------------------------------------------
// Every served dataset is now a plain array of records (reference tables inlined or split out as their
// own dataset), so there are no wrapper/extras shapes.
export const datasetPayloadSchemas = {
  characters: z.array(characterViewSchema),
  npcs: z.array(npcSchema),
  mows: z.array(mowSchema),
  "mow-upgrade-costs": z.array(mowUpgradeCostSchema),
  "character-ability-costs": z.array(characterAbilityCostSchema),
  "ascension-costs": z.array(ascensionCostSchema),
  "unlock-shard-costs": z.array(unlockShardCostSchema),
  "onslaught-rewards": z.array(onslaughtRewardSchema),
  upgrades: z.array(upgradeViewSchema),
  equipment: z.array(equipmentSchema),
  "campaign-battles": z.array(campaignBattleViewSchema),
  "campaign-definitions": z.array(campaignDefinitionSchema),
  lres: z.array(lreViewSchema),
  "lre-battles": z.array(lreBattleViewSchema),
  "horde-mode-tiers": z.array(hordeModeTiersSchema),
  "event-definitions": z.array(eventDefinitionSchema),
  // The one exception to "every payload is a plain array" — see events.ts.
  "events-calendar": eventsCalendarPayloadSchema,
  shops: z.array(shopSchema),
  // The other non-array payload — an object stored as a single row (see raid-bosses.ts).
  "raid-bosses": raidBossesPayloadSchema,
  // The third non-array payload — another complete object stored as one row.
  "guild-raid-meta": guildRaidMetaPayloadSchema,
  "mythic-quests": z.array(mythicQuestsSchema),
  "unit-power": z.array(unitPowerSchema),
  "quest-events": z.array(questEventSchema),
  "quest-crates": z.array(questCrateSchema),
  factions: z.array(factionSchema),
  "damage-types": z.array(damageTypeSchema),
  // One record, stored under a fixed id (see game-catalog.mapper.ts).
  "global-values": z.array(globalValuesSchema),
  "progression-rules": z.array(progressionRulesSchema),
  hre: z.array(hreSchema),
  incursions: z.array(incursionSchema),
} satisfies Record<GameCatalogDatasetKey, z.ZodType>

// Record (per-item) type for each dataset. Every dataset is a plain array, so the record type is the
// element type of its payload.
export type GameCatalogRecordByKey = {
  characters: z.infer<typeof characterViewSchema>
  npcs: z.infer<typeof npcSchema>
  mows: z.infer<typeof mowSchema>
  "mow-upgrade-costs": z.infer<typeof mowUpgradeCostSchema>
  "character-ability-costs": z.infer<typeof characterAbilityCostSchema>
  "ascension-costs": z.infer<typeof ascensionCostSchema>
  "unlock-shard-costs": z.infer<typeof unlockShardCostSchema>
  "onslaught-rewards": z.infer<typeof onslaughtRewardSchema>
  upgrades: z.infer<typeof upgradeViewSchema>
  equipment: z.infer<typeof equipmentSchema>
  "campaign-battles": z.infer<typeof campaignBattleViewSchema>
  "campaign-definitions": z.infer<typeof campaignDefinitionSchema>
  lres: z.infer<typeof lreViewSchema>
  "lre-battles": z.infer<typeof lreBattleViewSchema>
  "horde-mode-tiers": z.infer<typeof hordeModeTiersSchema>
  "event-definitions": z.infer<typeof eventDefinitionSchema>
  // The flattened storage-row shape (entry + injected `date`), not the raw date-keyed payload — see
  // events.ts and game-catalog.mapper.ts's `byCalendarDate`.
  "events-calendar": z.infer<typeof eventsCalendarRowSchema>
  shops: z.infer<typeof shopSchema>
  // The whole payload object is one stored row (see game-catalog.mapper.ts's `asSingleRow`).
  "raid-bosses": z.infer<typeof raidBossesPayloadSchema>
  "guild-raid-meta": z.infer<typeof guildRaidMetaPayloadSchema>
  "mythic-quests": z.infer<typeof mythicQuestsSchema>
  "unit-power": z.infer<typeof unitPowerSchema>
  "quest-events": z.infer<typeof questEventSchema>
  "quest-crates": z.infer<typeof questCrateSchema>
  factions: z.infer<typeof factionSchema>
  "damage-types": z.infer<typeof damageTypeSchema>
  "global-values": z.infer<typeof globalValuesSchema> & { id: string }
  "progression-rules": z.infer<typeof progressionRulesSchema> & { id: string }
  hre: z.infer<typeof hreSchema>
  incursions: z.infer<typeof incursionSchema>
}
