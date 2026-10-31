import { useState } from "react"
import { useIsAuthenticated } from "@azure/msal-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { combineReadStates } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"
import { EntityIcon } from "@/shared/ui"

import { medalIcon } from "../lib/battle-progress-icons"
import { unclaimedEventRewardTracks } from "../model/battle-progress"
import { campaignEventProgressKey } from "../model/campaign-event-eligibility"
import { useEffectiveCampaignEventProgress } from "../model/use-eligible-campaign-battles"
import { useSavedBattleProgress } from "../model/use-saved-battle-progress"
import { BattleProgressDialog } from "./battle-progress-dialog"
import { OneTimeRewards } from "./one-time-rewards"

/**
 * One campaign-event track's medals line: the one-time medal and milestone rewards its beaten
 * battles still hold (collapsed), and a button into the battle progress dialog for that track.
 * Renders nothing while signed out or loading.
 */
export function EventTrackMedals({
  groupId,
  type,
}: {
  groupId: string
  type: string
}) {
  const { t } = useTranslation("dailies")
  const isAuthenticated = useIsAuthenticated()
  const read = combineReadStates(
    useCatalogDataset("campaign-definitions"),
    useCatalogDataset("campaign-battles")
  )
  const eventProgress = useEffectiveCampaignEventProgress(isAuthenticated)
  const overrides = useSavedBattleProgress()
  const [open, setOpen] = useState(false)

  if (read.status !== "ready" || !eventProgress.ready || !overrides) {
    return null
  }
  const [definitions, battles] = read.data
  const track = unclaimedEventRewardTracks(
    definitions
      .filter((definition) => definition.groupId === groupId)
      .map((definition) => ({ ...definition, types: [type] })),
    battles,
    (trackGroupId, trackType) =>
      eventProgress.byKey.get(
        campaignEventProgressKey(trackGroupId, trackType)
      ),
    overrides
  )[0]

  return (
    <div
      className="flex flex-wrap items-start justify-between gap-2 border-t pt-3"
      data-testid={`event-track-medals-${groupId}-${type}`}
    >
      {track ? (
        <details className="min-w-0 flex-1">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            {t("battleProgress.unclaimedEvents.summary", {
              count: track.battleCount,
            })}
          </summary>
          <OneTimeRewards rewards={track.rewards} className="mt-2" />
        </details>
      ) : (
        <span className="flex-1 text-xs text-muted-foreground">
          {t("battleProgress.unclaimedEvents.allClaimed")}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        data-testid={`event-track-medals-open-${groupId}-${type}`}
      >
        <EntityIcon alt="" src={medalIcon} className="size-4" />
        {t("battleProgress.open")}
      </Button>
      {open ? (
        <BattleProgressDialog
          open
          campaignGroupId={groupId}
          campaignType={type}
          onOpenChange={(next) => {
            if (!next) setOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
