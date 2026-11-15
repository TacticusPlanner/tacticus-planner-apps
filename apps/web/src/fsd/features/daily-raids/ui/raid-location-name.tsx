import type { ReactNode } from "react"
import { Info } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { BattleId } from "@workspace/game-domain"

import { CampaignLocationName, EntityIcon } from "@/shared/ui"

import { locationNodeNumber } from "../model/campaign-groups"
import type { DailyRaidLocationViewModel } from "../model/daily-raids.domain"
import { inDigitSlot } from "../model/digit-slot"
import { useIsLoneCampaignRow } from "./campaign-group-context"

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
 * suggested raid location). With `nodeOnly`, a row under its campaign's header (`CampaignGroup`)
 * names just the battle ("Battle 36"); the dialog it opens still has the full name. The only row of
 * its group has no header above it, so it names the location in full, after the campaign icon.
 */
export function RaidLocationName({
  battleId,
  fallbackLabel,
  location,
  onShow,
  nodeOnly = false,
}: {
  battleId?: BattleId
  fallbackLabel: string
  location: DailyRaidLocationViewModel | undefined
  onShow?: (target: RaidLocationTarget) => void
  nodeOnly?: boolean
}) {
  const { t } = useTranslation("dailies")
  const title = {
    campaignName: location?.campaignName ?? fallbackLabel,
    difficultyLabel: location?.difficultyLabel,
    nodeLabel: location?.nodeLabel,
  }
  const lone = useIsLoneCampaignRow()
  const node =
    nodeOnly && !lone && location ? locationNodeNumber(location) : undefined
  const name = node ? (
    // The number takes a two-digit slot, so "Battle 7" lines up with "Battle 38".
    <span className="tabular-nums">
      {t("schedule.battle", { node: inDigitSlot(node) })}
    </span>
  ) : (
    <CampaignLocationName {...title} />
  )

  const icon =
    nodeOnly && lone && location?.icon ? (
      <EntityIcon alt="" className="size-10 shrink-0" src={location.icon} />
    ) : null
  const withIcon = (line: ReactNode) =>
    icon ? (
      <div className="flex items-center gap-2">
        {icon}
        {line}
      </div>
    ) : (
      line
    )

  if (!onShow || !battleId) {
    return withIcon(
      <div className="text-sm/tight font-medium wrap-break-word">{name}</div>
    )
  }
  return withIcon(
    <div className="text-sm/tight font-medium wrap-break-word">
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
