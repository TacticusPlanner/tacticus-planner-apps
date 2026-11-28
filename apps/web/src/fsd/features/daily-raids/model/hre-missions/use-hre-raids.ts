import { useMemo } from "react"
import type { BattleId } from "@workspace/game-domain"
import { useTranslation } from "react-i18next"

import type {
  MissionBattlesRequest,
  MissionRaidPlan,
  MissionRaidsRequest,
} from "../mission-raids"
import { useActiveHomeScreenEvent } from "../use-active-home-screen-event"
import { useResourceByBattleId } from "../use-resource-by-battle-id"
import { usePlayerChunk } from "@/shared/local-data"
import type { TodayQuickFilterOptions } from "../today-quick-filters/today-quick-filters"
import { useDailyRaids } from "../use-daily-raids"
import { useHomeScreenEventName } from "../home-screen-event/use-home-screen-event-name"
import type { RaidLocationTarget } from "../../ui/raid-location-name"
import type { RaidRowsView } from "../../ui/hre-missions/hre-raids-extras"

/** With no open objective the plan still runs, for the outlook nodes and daily energy only. */
const SUMMARY_ONLY: MissionRaidsRequest = { battlesToGo: 0, eventOnly: false }

/** The current mission's campaign request, built by the HRE page from `selectCampaignPlan`. */
export type HreRaidsRequest = {
  /** "Mission 5". */
  missionLabel: string
  /** The open campaign-win, campaign-raid or lightning objective's raids. */
  raids: { battlesToGo: number; eventOnly: boolean } | null
  /** The open manual objectives' battles to fight by hand, with their localized node limits. */
  manual:
    | (MissionBattlesRequest & {
        allianceName: string | null
        heroFactionName?: string | null
        factionName: string | null
      })
    | null
  /** Why the manual objectives get no list (the featured hero's alliance is not known yet). */
  manualNotice: string | null
}

/** The HRE campaign suggestions, read once for the page's folds and its campaign outlook. */
export type HreRaids = {
  status: "loading" | "error" | "ready"
  /** The plan once the raids engine has run (also for the outlook with no request). */
  plan: MissionRaidPlan | undefined
  rowsView: RaidRowsView
  /** "{event} is running too", when a running HSE ranks some of the suggested nodes. */
  hseNote: string | null
  /** The player has reached nodes of a running campaign event: "CE nodes first" is offered. */
  hasActiveEventBattles: boolean
}

/**
 * Dailies > HRE campaign suggestions for the current mission, with the least of today's energy
 * left, Today's plan aside (`planMissionRaids`): the battles to fight by hand for its manual
 * objectives and the raids for its campaign-win, campaign-raid or lightning objective. A running
 * Home Screen Event with a raid rule ranks the nodes too, so both events progress, and "CE nodes
 * first" ranks the running campaign event's nodes first. Without a request the plan still runs for
 * the campaign outlook.
 */
export function useHreRaids({
  request,
  projectId,
  quickFilters,
  onShowLocation,
}: {
  request: HreRaidsRequest | null
  /** The Dailies project: narrows the goals the suggestions serve first (none: every active goal). */
  projectId?: string
  /** Today's quick filters, picked in the page toolbar. */
  quickFilters?: TodayQuickFilterOptions
  /** Makes each suggested battle's name open its enemies. */
  onShowLocation?: (target: RaidLocationTarget) => void
}): HreRaids {
  const { t } = useTranslation("hre")
  const homeScreenEvent = useActiveHomeScreenEvent()
  const eventName = useHomeScreenEventName()
  const runningEventRule =
    homeScreenEvent.status === "ready" ? homeScreenEvent.activeRaidRule : null
  const runningEvent =
    runningEventRule && homeScreenEvent.status === "ready"
      ? homeScreenEvent.active
      : null
  const manual = request?.manual ?? null
  // Built once per change of the request, so the raids engine does not rerun on a page re-render.
  const battlesToGo = request?.raids?.battlesToGo ?? 0
  const eventOnly = request?.raids?.eventOnly ?? false
  const hasRequest = !!request
  const missionRaids = useMemo(
    (): MissionRaidsRequest =>
      hasRequest
        ? {
            battlesToGo,
            eventOnly,
            ...(manual
              ? {
                  manual: {
                    needs: manual.needs,
                    slots: manual.slots,
                    alliance: manual.alliance,
                    heroFaction: manual.heroFaction,
                    faction: manual.faction,
                    preferLightning: manual.preferLightning,
                    countsAsRaids: manual.countsAsRaids,
                  },
                }
              : {}),
          }
        : SUMMARY_ONLY,
    [hasRequest, battlesToGo, eventOnly, manual]
  )
  const raids = useDailyRaids(projectId, {
    homeScreenEventRule: runningEventRule ?? undefined,
    eventFarm: false,
    missionRaids,
    quickFilters,
  })
  const resourceByBattleId = useResourceByBattleId()
  const inventoryUpgradesRead = usePlayerChunk("inventory-upgrades")
  const inventoryShardsRead = usePlayerChunk("inventory-shards")
  // What the player holds of each node's catalog drop, for rows that feed no goal.
  const nodeDrops = useMemo(() => {
    const upgrades = new Map(
      inventoryUpgradesRead.status === "ready" && inventoryUpgradesRead.data
        ? inventoryUpgradesRead.data.map((entry) => [
            entry.upgradeId,
            entry.amount,
          ])
        : []
    )
    const shards = new Map(
      inventoryShardsRead.status === "ready" && inventoryShardsRead.data
        ? inventoryShardsRead.data.map((entry) => [entry.unitId, entry.amount])
        : []
    )
    return (battleId: BattleId) => {
      const resource = resourceByBattleId.get(battleId)
      if (!resource) return undefined
      const { visual } = resource
      const owned =
        visual.kind === "upgrade"
          ? (upgrades.get(visual.id) ?? 0)
          : (shards.get(visual.unitId) ?? 0)
      return { label: resource.label, visual, owned }
    }
  }, [resourceByBattleId, inventoryUpgradesRead, inventoryShardsRead])
  const loaded = raids.status !== "loading" && raids.status !== "error"
  const plan = loaded ? raids.missionRaids : undefined
  const locations = loaded ? raids.locationsByBattleId : undefined
  const view = raids.status === "ready" ? raids : null
  const hseNote =
    runningEvent &&
    plan &&
    [...plan.rows, ...plan.noDropRows, ...(plan.battles?.rows ?? [])].some(
      (row) => row.eventPoints > 0
    )
      ? t("raids.noteHomeScreenEvent", { event: eventName(runningEvent) })
      : null
  return {
    status:
      raids.status === "loading" || raids.status === "error"
        ? raids.status
        : "ready",
    plan,
    rowsView: { locations, view, onShowLocation, nodeDrop: nodeDrops },
    hseNote,
    hasActiveEventBattles: loaded && (raids.hasActiveEventBattles ?? false),
  }
}
