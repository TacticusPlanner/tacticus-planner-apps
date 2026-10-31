import { useState } from "react"
import { useIsAuthenticated } from "@azure/msal-react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { campaignDescriptor, campaignIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"

import { battleProgressQueries } from "@/entities/player-data-override"
import { combineReadStates, useCampaignDisplay } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"
import { EntityIcon } from "@/shared/ui"

import { unclaimedEventRewardTracks } from "../model/battle-progress"
import { campaignEventProgressKey } from "../model/campaign-event-eligibility"
import { useEffectiveCampaignEventProgress } from "../model/use-eligible-campaign-battles"
import { BattleProgressDialog } from "./battle-progress-dialog"
import { OneTimeRewards } from "./one-time-rewards"

/**
 * The one-time medal and milestone rewards still unclaimed on the campaign-event battles the player
 * has beaten, per event track, with a shortcut into the battle progress dialog to record them.
 * Renders nothing while signed out, loading, or when every beaten battle is fully claimed.
 */
export function UnclaimedEventRewards() {
  const { t } = useTranslation("dailies")
  const isAuthenticated = useIsAuthenticated()
  const { fullLabel } = useCampaignDisplay()
  const read = combineReadStates(
    useCatalogDataset("campaign-definitions"),
    useCatalogDataset("campaign-battles")
  )
  const eventProgress = useEffectiveCampaignEventProgress(isAuthenticated)
  const overrides = useQuery({
    ...battleProgressQueries.current(),
    enabled: isAuthenticated,
  })
  const [open, setOpen] = useState<{ groupId: string; type: string } | null>(
    null
  )

  if (
    !isAuthenticated ||
    read.status !== "ready" ||
    !eventProgress.ready ||
    !overrides.data
  ) {
    return null
  }
  const [definitions, battles] = read.data
  const tracks = unclaimedEventRewardTracks(
    definitions,
    battles,
    (groupId, type) =>
      eventProgress.byKey.get(campaignEventProgressKey(groupId, type)),
    overrides.data.battles
  )
  if (tracks.length === 0) return null

  return (
    <section
      className="grid gap-3 rounded-lg border p-4"
      data-testid="unclaimed-event-rewards"
    >
      <div className="grid gap-1">
        <h2 className="text-base font-semibold">
          {t("battleProgress.unclaimedEvents.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("battleProgress.unclaimedEvents.description")}
        </p>
      </div>
      <ul className="divide-y rounded-lg border">
        {tracks.map((track) => {
          const descriptor = campaignDescriptor(track.groupId, track.type)
          return (
            <li
              key={`${track.groupId}|${track.type}`}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              data-testid={`unclaimed-event-rewards-${track.groupId}-${track.type}`}
            >
              <div className="grid gap-1">
                <span className="inline-flex items-center gap-2 text-sm">
                  <EntityIcon
                    alt=""
                    className="size-5"
                    src={campaignIcon(track.groupId, track.type)}
                  />
                  {descriptor ? fullLabel(descriptor) : track.groupId}
                  <span className="text-xs text-muted-foreground">
                    {t("battleProgress.unclaimedEvents.battles", {
                      count: track.battleCount,
                    })}
                  </span>
                </span>
                <OneTimeRewards rewards={track.rewards} />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setOpen({ groupId: track.groupId, type: track.type })
                }
              >
                {t("battleProgress.unclaimedEvents.record")}
              </Button>
            </li>
          )
        })}
      </ul>
      {open ? (
        <BattleProgressDialog
          open
          campaignGroupId={open.groupId}
          campaignType={open.type}
          onOpenChange={(next) => {
            if (!next) setOpen(null)
          }}
        />
      ) : null}
    </section>
  )
}
