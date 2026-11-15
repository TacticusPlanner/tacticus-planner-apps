import { z } from "zod"

import { shopSlotSchema } from "./shops"

// Loose objects preserve unknown (server-added) fields and only fail on genuine shape/type breaks,
// matching the rest of this package's schemas. Mirrors the API's served seasonal event shop shape
// (TacticusPlanner.GameCatalog `GameCatalogEventShopView`): ids and structured values only; the client
// names the event from `definitionId` and derives every date from `startUtc` + `dayCount`.

// A reward as a type and an inclusive quantity range (`min === max` for a fixed amount).
export const eventShopRewardRangeSchema = z.looseObject({
  type: z.string().min(1),
  min: z.number().int(),
  max: z.number().int(),
})

// A progress-ladder tier (milestones, progress chests).
export const eventShopRewardTierSchema = z.looseObject({
  requiredProgress: z.number().int(),
  rewards: z.array(eventShopRewardRangeSchema),
})

// A mission task: the game's task id, its target and its parameters as shipped (strings or string
// lists, e.g. `{ gameMode: "Survival" }` / `{ gameModes: ["AllCampaigns"] }`).
export const eventShopTaskSchema = z.looseObject({
  taskId: z.string().min(1),
  target: z.number().int(),
  parameters: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
})

export const eventShopMissionSchema = z.looseObject({
  id: z.string().min(1),
  rewards: z.array(eventShopRewardRangeSchema),
  tasks: z.array(eventShopTaskSchema),
})

export const eventShopMissionChainSchema = z.looseObject({
  id: z.string().min(1),
  missions: z.array(eventShopMissionSchema),
})

export const eventShopWeekSchema = z.looseObject({
  week: z.number().int().positive(),
  // Estimated event currency earned this week; omitted when not curated.
  estimatedWeeklyIncome: z
    .looseObject({
      free: z.number().int(),
      bonusShipment: z.number().int(),
    })
    .optional(),
  // The daily-shop slot/variant projection, unchanged — the shop resolver accepts it as is.
  slots: z.array(shopSlotSchema),
  progressChests: z.array(eventShopRewardTierSchema),
  missions: z.looseObject({
    daily: z.array(eventShopMissionSchema),
    free: z.array(eventShopMissionChainSchema),
    premium: z.array(eventShopMissionChainSchema),
  }),
})

// One seasonal event shop (id: june-2026 / october-2026 / ...).
export const eventShopSchema = z.looseObject({
  id: z.string().min(1),
  eventKey: z.string().min(1),
  definitionId: z.string().min(1),
  currency: z.string().min(1),
  startUtc: z.string().min(1),
  dayCount: z.number().int().positive(),
  milestones: z.array(eventShopRewardTierSchema),
  weeks: z.array(eventShopWeekSchema).min(1),
})
