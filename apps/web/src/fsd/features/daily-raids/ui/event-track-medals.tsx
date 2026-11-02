import { useState } from "react"
import { useIsAuthenticated } from "@azure/msal-react"
import { ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { combineReadStates } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"
import { EntityIcon } from "@/shared/ui"

import { medalIcon } from "../lib/battle-progress-icons"
import {
  beatenEventBattleRows,
  unclaimedTrackRewards,
  type TrackMedalStats,
} from "../model/battle-progress"
import { campaignEventProgressKey } from "../model/campaign-event-eligibility"
import { useEffectiveCampaignEventProgress } from "../model/use-eligible-campaign-battles"
import { useSavedBattleProgress } from "../model/use-saved-battle-progress"
import { BattleProgressDialog } from "./battle-progress-dialog"
import { MedalStats } from "./medal-stats"
import { UnclaimedRewardsDetails } from "./unclaimed-rewards-details"

/**
 * One campaign-event track's medals line: a button into the battle progress dialog for that track
 * (showing the track's medal stats when given) and, below it, the one-time medal and milestone
 * rewards the track still holds (collapsed): what beaten battles fell short of plus everything on
 * unbeaten battles, challenges included. Renders nothing while signed out or loading.
 */
export function EventTrackMedals({
  groupId,
  type,
  stats,
}: {
  groupId: string
  type: string
  stats?: TrackMedalStats
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
  const [, battles] = read.data
  const progress = eventProgress.byKey.get(
    campaignEventProgressKey(groupId, type)
  )
  const beaten = new Set(
    beatenEventBattleRows(battles, groupId, type, progress).map(
      (row) => row.battleId
    )
  )
  const unclaimed = unclaimedTrackRewards(
    battles.filter(
      (battle) => battle.campaignGroupId === groupId && battle.type === type
    ),
    (battleId) => beaten.has(battleId),
    overrides
  )

  return (
    <div
      className="flex flex-col items-stretch gap-2 border-t pt-3"
      data-testid={`event-track-medals-${groupId}-${type}`}
    >
      <Button
        variant="outline"
        size="sm"
        className={stats ? "w-full justify-between" : "self-end"}
        onClick={() => setOpen(true)}
        data-testid={`event-track-medals-open-${groupId}-${type}`}
      >
        {stats ? (
          <>
            <MedalStats stats={stats} />
            <span className="inline-flex items-center gap-1">
              {t("battleProgress.edit")}
              <ChevronRight aria-hidden className="size-4" />
            </span>
          </>
        ) : (
          <>
            <EntityIcon alt="" src={medalIcon} className="size-4" />
            {t("battleProgress.open")}
          </>
        )}
      </Button>
      <UnclaimedRewardsDetails
        unclaimed={unclaimed}
        data-testid={`event-track-unclaimed-${groupId}-${type}`}
      />
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
