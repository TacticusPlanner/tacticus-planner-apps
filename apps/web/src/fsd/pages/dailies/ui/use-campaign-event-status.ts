import { useLiveQuery } from "dexie-react-hooks"
import type { CampaignId } from "@workspace/game-domain"
import { campaignDescriptor, campaignIcon } from "@workspace/game-catalog"
import { getEventsActiveAt } from "@workspace/game-catalog/queries"
import { getLiveProgress } from "@workspace/player-data/queries"

import { useCampaignDisplay } from "@/shared/lib"

import { seasonEndCountdown } from "./guild-raids/guild-raid-countdowns"

// The calendar's own definition id for a campaign-event window. The calendar carries no campaign
// identity at all, so it only ever supplies the end time — which event is running comes from
// `live-progress.activeCampaignEventId` (see design.md).
const CAMPAIGN_EVENT_DEFINITION_ID = "campaign-event"

/** The active calendar window for the campaign-event definition, as read from the catalog. */
export type CampaignEventWindow = {
  endUtc: string
  /** Whether this window is an authored occurrence rather than a server-projected placeholder. */
  confirmed: boolean
}

// Three distinct end-time presentations (see design.md): an authored occurrence gets an exact
// countdown; a projected placeholder's endUtc is the catalog's best-known schedule, not a
// guarantee from the game, so it must never render as one; no active window has nothing to show.
type CampaignEventEndStatus =
  | { kind: "confirmed"; targetMs: number }
  | { kind: "unconfirmed" }
  | { kind: "unavailable" }

function campaignEventEndStatus(
  window: CampaignEventWindow | null,
  nowMs: number
): CampaignEventEndStatus {
  if (!window) {
    return { kind: "unavailable" }
  }
  if (!window.confirmed) {
    return { kind: "unconfirmed" }
  }
  // Reuse the guild-raid countdown math only for a confirmed window, per design.md decision 1.
  const countdown = seasonEndCountdown(window.endUtc, nowMs)
  return countdown.kind === "pending"
    ? { kind: "confirmed", targetMs: countdown.targetMs }
    : { kind: "unavailable" }
}

export type CampaignEventStatus = {
  /** Whether Today detected an active campaign event — the same signal that gates event nodes. */
  active: boolean
  /** Localized campaign name, or null when the detected id resolves to no catalog descriptor. */
  name: string | null
  /** Standard-tier campaign icon, or undefined when the id resolves to no catalog descriptor. */
  icon: string | undefined
  /** End-time presentation for the active calendar window; see `CampaignEventEndStatus`. */
  endStatus: CampaignEventEndStatus
}

export function buildCampaignEventStatus({
  activeCampaignEventId,
  campaignEventWindow,
  nowMs,
  campaignName,
}: {
  activeCampaignEventId: CampaignId | null | undefined
  campaignEventWindow: CampaignEventWindow | null
  nowMs: number
  campaignName: (groupId: CampaignId) => string | null
}): CampaignEventStatus {
  if (!activeCampaignEventId) {
    // The calendar may well say an event is running; Today's schedule excludes every event node
    // in this state, so the status line has to agree with the schedule, not with the calendar.
    return {
      active: false,
      name: null,
      icon: undefined,
      endStatus: { kind: "unavailable" },
    }
  }
  return {
    active: true,
    name: campaignName(activeCampaignEventId),
    // The group's two tiers share one icon stem, so either tier resolves the same artwork.
    icon: campaignIcon(activeCampaignEventId, "Standard"),
    endStatus: campaignEventEndStatus(campaignEventWindow, nowMs),
  }
}

async function readCampaignEventInputs() {
  const [liveProgress, activeEvents] = await Promise.all([
    getLiveProgress(),
    getEventsActiveAt(new Date()),
  ])
  const campaignEvent = activeEvents.find(
    (event) => event.definitionId === CAMPAIGN_EVENT_DEFINITION_ID
  )
  return {
    // Read here rather than during render: the countdown is coarse ("in 3 days"), so recomputing
    // it whenever the underlying Dexie tables change is frequent enough, and render stays pure.
    nowMs: Date.now(),
    activeCampaignEventId: liveProgress?.activeCampaignEventId ?? null,
    campaignEventWindow: campaignEvent
      ? { endUtc: campaignEvent.endUtc, confirmed: campaignEvent.confirmed }
      : null,
  }
}

/** Page-local: only Today shows this, and `useDailyRaids` is shared with the Home widget. */
export function useCampaignEventStatus(): CampaignEventStatus {
  const { name } = useCampaignDisplay()
  const inputs = useLiveQuery(readCampaignEventInputs, [])

  return buildCampaignEventStatus({
    activeCampaignEventId: inputs?.activeCampaignEventId,
    campaignEventWindow: inputs?.campaignEventWindow ?? null,
    nowMs: inputs?.nowMs ?? 0,
    campaignName: (groupId) => {
      // `activeCampaignEventId` comes from synced player data, not the catalog, so an event that
      // goes live before a catalog release names it resolves to nothing — and an unguarded
      // `.nameKey` here would take Today's whole header down.
      const descriptor = campaignDescriptor(groupId, "Standard")
      return descriptor ? name(descriptor) : null
    },
  })
}
