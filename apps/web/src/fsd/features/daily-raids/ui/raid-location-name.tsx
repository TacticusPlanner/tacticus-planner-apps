import { Info } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { BattleId } from "@workspace/game-domain"

import { CampaignLocationName } from "@/shared/ui"

import type { DailyRaidLocationViewModel } from "../model/daily-raids.domain"

/** The battle a raid location's name opens, with the name it shows (Today, Home). */
export interface RaidLocationTarget {
  battleId: BattleId
  title: { campaignName: string; difficultyLabel?: string; nodeLabel?: string }
}

/**
 * A location's name as one line: campaign + difficulty + node ("Indomitus Mirror Elite 36"), all at
 * the same size (tier word in italics), so it reads the way the game's campaign picker is navigated
 * (campaign + tier, then node). Wraps between words only; a battle the catalog cannot name shows its
 * raw id. With `onShow`, the name is a button that opens the battle's enemies (V1's tap on a
 * suggested raid location).
 */
export function RaidLocationName({
  battleId,
  fallbackLabel,
  location,
  onShow,
}: {
  battleId?: BattleId
  fallbackLabel: string
  location: DailyRaidLocationViewModel | undefined
  onShow?: (target: RaidLocationTarget) => void
}) {
  const { t } = useTranslation("dailies")
  const title = {
    campaignName: location?.campaignName ?? fallbackLabel,
    difficultyLabel: location?.difficultyLabel,
    nodeLabel: location?.nodeLabel,
  }
  const name = <CampaignLocationName {...title} />

  if (!onShow || !battleId) {
    return (
      <div className="text-sm leading-tight font-medium break-words">
        {name}
      </div>
    )
  }
  return (
    <div className="text-sm leading-tight font-medium break-words">
      <button
        aria-haspopup="dialog"
        className="cursor-pointer rounded-sm text-left underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        data-testid={`raid-location-details-${battleId}`}
        onClick={() => onShow({ battleId, title })}
        type="button"
      >
        {name}
        {/* Named by the icon, so the line's text stays the location's name alone. */}
        <Info
          aria-label={t("locationDetails.open")}
          className="ms-1 inline size-3.5 align-[-0.125em] text-muted-foreground"
          role="img"
        />
      </button>
    </div>
  )
}
