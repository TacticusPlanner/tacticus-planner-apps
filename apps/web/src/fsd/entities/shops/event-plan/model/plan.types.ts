import { shopDaysOfWeek, type ShopDayOfWeek } from "@workspace/game-catalog"

import { apiIssue, type ApiSchemas } from "@/shared/api"

// `/api/v1/event-shop-plans/{eventId}` (companion API change add-event-shops, spec event-shop-plans).
// Every endpoint answers with the whole plan. Wire shapes are generated from the API's OpenAPI
// document; the domain shapes only narrow `day` and `draftAlliance` to their closed sets, which
// `toEventShopPlan` checks at runtime. Request bodies carry the `Dto` suffix.
type S = ApiSchemas

export const DRAFT_ALLIANCES = ["imperial", "xenos", "chaos"] as const

export type DraftAlliance = (typeof DRAFT_ALLIANCES)[number]

/** One planned offer: a slot of an event week, on one day, with the chosen reward. Cost, pack size and
 *  cap come from the catalog, never from the plan. */
export interface EventShopCartEntry {
  /** 1-based event week. */
  week: number
  day: ShopDayOfWeek
  /** 0-based index into that week's `slots`. */
  slotIndex: number
  rewardType: string
  /** Packs planned, 1..the offer's per-day cap. */
  quantity: number
  /** Packs bought, 0..quantity. */
  purchasedQuantity: number
  /** The chosen alliance of a `draft_*` reward; null otherwise. */
  draftAlliance: DraftAlliance | null
}

/** The caller's plan for one event shop. A plan never written reads as revision 0, no entries. */
export interface EventShopPlan {
  eventId: string
  revision: number
  /** The catalog version the plan was last written under; null when the plan is not stored. */
  catalogVersion: string | null
  entries: EventShopCartEntry[]
}

export type PutEventShopPlanRequestDto = S["PutEventShopPlanRequest"]

function toDay(day: string): ShopDayOfWeek {
  const narrowed = shopDaysOfWeek.find((candidate) => candidate === day)
  if (!narrowed) throw new Error(`Unexpected event shop day ${day}`)
  return narrowed
}

function toDraftAlliance(alliance: string | null): DraftAlliance | null {
  if (alliance === null) return null
  const narrowed = DRAFT_ALLIANCES.find((candidate) => candidate === alliance)
  if (!narrowed) throw new Error(`Unexpected draft alliance ${alliance}`)
  return narrowed
}

/** The wire plan as the domain plan; an unknown day or alliance breaks the API contract and throws. */
export function toEventShopPlan(
  plan: S["EventShopPlanResponse"]
): EventShopPlan {
  return {
    eventId: plan.eventId,
    revision: plan.revision,
    catalogVersion: plan.catalogVersion,
    entries: plan.entries.map((entry) => ({
      week: entry.week,
      day: toDay(entry.day),
      slotIndex: entry.slotIndex,
      rewardType: entry.rewardType,
      quantity: entry.quantity,
      purchasedQuantity: entry.purchasedQuantity,
      draftAlliance: toDraftAlliance(entry.draftAlliance),
    })),
  }
}

/** The whole-cart PUT body. */
export function toPutEventShopPlanRequest(
  expectedRevision: number,
  entries: readonly EventShopCartEntry[]
): PutEventShopPlanRequestDto {
  return { expectedRevision, entries: entries.map((entry) => ({ ...entry })) }
}

/** A stale write (409 `eventShopPlanStale`): the plan as it stands, from the problem's `current`. */
export function eventShopPlanConflict(
  error: unknown
): { current: EventShopPlan } | null {
  const issue = apiIssue(error, "eventShopPlanStale")
  const plan = issue?.current as Partial<S["EventShopPlanResponse"]> | undefined
  return issue &&
    Array.isArray(plan?.entries) &&
    typeof plan.revision === "number"
    ? { current: toEventShopPlan(plan as S["EventShopPlanResponse"]) }
    : null
}
