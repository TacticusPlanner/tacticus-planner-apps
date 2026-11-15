import { deriveLegendaryEventLifecycle } from "@/entities/legendary-event"
import type { LegendaryEventSchedule } from "@/entities/legendary-event"

/** Which list the Tier List page shows, kept in the URL query (`list`). */
export type TierListKind = "heroes" | "enemies"

export const TIER_LIST_KINDS: readonly TierListKind[] = ["heroes", "enemies"]

export function parseTierListKind(params: URLSearchParams): TierListKind {
  return params.get("list") === "enemies" ? "enemies" : "heroes"
}

/** The URL query for `kind`, keeping unrelated params; heroes (the default) is left out. */
export function tierListKindSearchParams(
  current: URLSearchParams,
  kind: TierListKind
): URLSearchParams {
  const next = new URLSearchParams(current)
  if (kind === "enemies") next.set("list", "enemies")
  else next.delete("list")
  return next
}

/** The Enemies view's filters, kept in the URL query (`q`, `event`). */
export interface NpcTierListUrlFilters {
  query: string
  /** An event id, or "all". */
  eventId: string
}

export function parseNpcTierListFilters(
  params: URLSearchParams
): NpcTierListUrlFilters {
  return {
    query: params.get("q") ?? "",
    eventId: params.get("event") || "all",
  }
}

/** The URL query for `filters`, keeping unrelated params; defaults are left out of the URL. */
export function npcTierListSearchParams(
  current: URLSearchParams,
  filters: NpcTierListUrlFilters
): URLSearchParams {
  const next = new URLSearchParams(current)
  if (filters.query) next.set("q", filters.query)
  else next.delete("q")
  if (filters.eventId === "all") next.delete("event")
  else next.set("event", filters.eventId)
  return next
}

/**
 * The ids of the events still in rotation at `nowMs` (running or with a run to come, not archived):
 * the running ones first, then catalog order.
 */
export function rotationEventIds(
  events: readonly (LegendaryEventSchedule & { id: string })[],
  nowMs: number
): string[] {
  const states = events
    .map((event) => ({
      id: event.id,
      state: deriveLegendaryEventLifecycle(event, nowMs).state,
    }))
    .filter(({ state }) => state !== "archived")
  return [
    ...states.filter(({ state }) => state === "active"),
    ...states.filter(({ state }) => state !== "active"),
  ].map(({ id }) => id)
}
