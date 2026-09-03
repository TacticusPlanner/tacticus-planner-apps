import { z } from "zod"

// Loose objects preserve unknown (server-added) fields and only fail on genuine shape/type breaks,
// matching the rest of this package's schemas (see shared.ts). Mirrors the API's served shop shape
// (TacticusPlanner.GameCatalog `GameCatalogShopView`): the "type:qty" reward strings and the Quartz
// cron are already normalized server-side to `{ type, qty }` and an explicit `days` list.

export const shopDaysOfWeek = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
] as const

export type ShopDayOfWeek = (typeof shopDaysOfWeek)[number]

const shopDayOfWeekSchema = z.enum(shopDaysOfWeek)

// A reward or a free bundled offer, parsed from the source "type" / "type:qty" string server-side.
const shopRewardSchema = z.looseObject({
  type: z.string().min(1),
  qty: z.number().int().positive(),
})

const shopCostSchema = z.looseObject({
  currency: z.string().min(1),
  amount: z.number(),
})

const shopRefreshCostSchema = z.looseObject({
  resourceType: z.string(),
  amount: z.number(),
})

// One product variant inside a slot. `unitId` is present only for character-/mythic-shard rewards
// (the id embedded in the reward type, cross-referenced server-side). Optional fields are omitted from
// the payload when the source omits them.
export const shopVariantSchema = z.looseObject({
  reward: shopRewardSchema,
  unitId: z.string().optional(),
  freeOffer: shopRewardSchema.optional(),
  cost: shopCostSchema,
  maxPurchasesPerDay: z.number().int().positive(),
  weight: z.number().optional(),
  days: z.array(shopDayOfWeekSchema),
  minPowerLevel: z.number().optional(),
  maxPowerLevel: z.number().optional(),
  // Carried verbatim and opaque — lock semantics (bp-season windows, roster/PL tiers, per-unit
  // thresholds) are resolved client-side (see ../shops/shop-resolve.ts).
  lockId: z.string().optional(),
})

// One rotating shop slot. More than one day-matching variant resolving to different reward types is a
// randomized outcome; all resolving to the same type is guaranteed. Not pre-computed server-side.
export const shopSlotSchema = z.looseObject({
  variants: z.array(shopVariantSchema),
})

// One always-on daily shop (id: guild / war / rogue-trader / crusade). Structural/identity only — no
// shop name, currency label, or icon; the client resolves those from `id` and the currency ids.
export const shopSchema = z.looseObject({
  id: z.string().min(1),
  displayLocation: z.string(),
  refreshWithAdWatch: z.boolean(),
  allowedRefreshesPerDay: z.number().int().nonnegative(),
  refreshCost: shopRefreshCostSchema.optional(),
  slots: z.array(shopSlotSchema),
})
