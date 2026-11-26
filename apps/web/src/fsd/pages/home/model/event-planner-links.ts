import type { EventShopEntry } from "./select-home-events"
import { DAY_MS } from "@/shared/lib"

/** What the planner link reads of a calendar entry. */
export type PlannerLinkEntry = {
  definitionId: string
  definitionType: string | undefined
  occurrenceId: string | null
  startUtc: string
  parameters: Record<string, unknown> | null
}

/** The occurrence key the HSE and HRE tabs take in `?event=`: the occurrence id, else
 *  `definitionId@startUtc`. */
function occurrenceKey(entry: PlannerLinkEntry): string {
  return entry.occurrenceId ?? `${entry.definitionId}@${entry.startUtc}`
}

function featuredCharacterId(entry: PlannerLinkEntry): string | undefined {
  const value = entry.parameters?.featuredCharacterId
  return typeof value === "string" ? value : undefined
}

/**
 * The event shop a calendar shop occurrence belongs to: the shop of the same definition whose days
 * cover the occurrence's start (the calendar dates each shop week separately). `undefined` when no
 * served shop matches.
 */
export function eventShopIdForOccurrence(
  entry: Pick<PlannerLinkEntry, "definitionId" | "startUtc">,
  shops: readonly EventShopEntry[]
): string | undefined {
  const startMs = Date.parse(entry.startUtc)
  return shops.find((shop) => {
    if (shop.definitionId !== entry.definitionId || shop.startUtc === null) {
      return false
    }
    const shopStartMs = Date.parse(shop.startUtc)
    return (
      shopStartMs <= startMs && startMs < shopStartMs + shop.dayCount * DAY_MS
    )
  })?.id
}

/**
 * The in-app planner page for a calendar occurrence, or `undefined` for an event the planner has no
 * page for (Battle Pass, Tournament Arena, Guild War, ...). The HSE and HRE tabs open on the
 * occurrence itself; an event shop opens on its shop (`eventShopId`), else the Event shop tab's default.
 */
export function resolveEventPlannerPath(
  entry: PlannerLinkEntry,
  eventShopId?: string
): string | undefined {
  switch (entry.definitionType) {
    case "HomeScreenEvent": {
      return `/dailies/hse?event=${encodeURIComponent(occurrenceKey(entry))}`
    }
    case "NewCharacterEvent": {
      return `/dailies/hre?event=${encodeURIComponent(occurrenceKey(entry))}`
    }
    case "Quest": {
      return "/dailies/quest"
    }
    case "ShopEvent": {
      return eventShopId
        ? `/plan/event-shop/${encodeURIComponent(eventShopId)}`
        : "/plan/event-shop"
    }
    case "LegendaryEvent": {
      const unitId = featuredCharacterId(entry)
      return unitId
        ? `/legendary-events/${encodeURIComponent(unitId)}`
        : "/legendary-events"
    }
    case "CampaignEvent": {
      return "/my-game/campaign-events"
    }
    case "Incursion": {
      return "/my-game/incursions"
    }
    case "GuildRaidSeason": {
      return "/dailies/guild-raids"
    }
    default: {
      return undefined
    }
  }
}
