import { useLiveQuery } from "dexie-react-hooks"
import type { CampaignId } from "@workspace/game-domain"
import { campaignDescriptor, campaignIcon } from "@workspace/game-catalog"
import { getEventsActiveAt } from "@workspace/game-catalog/queries"
import { getLiveProgress } from "@workspace/player-data/queries"

import { useCampaignDisplay } from "@/shared/lib"

import {
  seasonEndCountdown,
  type GuildRaidCountdown,
} from "./guild-raids/guild-raid-countdowns"

// The calendar's own definition id for a campaign-event window. The calendar carries no campaign
// identity at all, so it only ever supplies the end time — which event is running comes from
// `live-progress.activeCampaignEventId` (see design.md).
const CAMPAIGN_EVENT_DEFINITION_ID = "campaign-event"

export type CampaignEventStatus = {
  /** Whether Today detected an active campaign event — the same signal that gates event nodes. */
  active: boolean
  /** Localized campaign name, or null when the detected id resolves to no catalog descriptor. */
  name: string | null
  /** Standard-tier campaign icon, or undefined when the id resolves to no catalog descriptor. */
  icon: string | undefined
  /** End of the active calendar window; "unavailable" when the calendar has none for right now. */
  endsAt: GuildRaidCountdown
}

export function buildCampaignEventStatus({
  activeCampaignEventId,
  campaignEventEndUtc,
  nowMs,
  campaignName,
}: {
  activeCampaignEventId: CampaignId | null | undefined
  campaignEventEndUtc: string | null
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
      endsAt: { kind: "unavailable" },
    }
  }
  return {
    active: true,
    name: campaignName(activeCampaignEventId),
    // The group's two tiers share one icon stem, so either tier resolves the same artwork.
    icon: campaignIcon(activeCampaignEventId, "Standard"),
    endsAt: seasonEndCountdown(campaignEventEndUtc, nowMs),
  }
}

async function readCampaignEventInputs() {
  const [liveProgress, activeEvents] = await Promise.all([
    getLiveProgress(),
    getEventsActiveAt(new Date()),
  ])
  return {
    // Read here rather than during render: the countdown is coarse ("in 3 days"), so recomputing
    // it whenever the underlying Dexie tables change is frequent enough, and render stays pure.
    nowMs: Date.now(),
    activeCampaignEventId: liveProgress?.activeCampaignEventId ?? null,
    campaignEventEndUtc:
      activeEvents.find(
        (event) => event.definitionId === CAMPAIGN_EVENT_DEFINITION_ID
      )?.endUtc ?? null,
  }
}

/** Page-local: only Today shows this, and `useDailyRaids` is shared with the Home widget. */
export function useCampaignEventStatus(): CampaignEventStatus {
  const { name } = useCampaignDisplay()
  const inputs = useLiveQuery(readCampaignEventInputs, [])

  return buildCampaignEventStatus({
    activeCampaignEventId: inputs?.activeCampaignEventId,
    campaignEventEndUtc: inputs?.campaignEventEndUtc ?? null,
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
