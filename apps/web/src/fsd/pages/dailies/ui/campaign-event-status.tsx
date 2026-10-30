import { useTranslation } from "react-i18next"

import { formatRelativeTime } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"

import { GlanceTile } from "./today/glance-tile"
import { useCampaignEventStatus } from "./use-campaign-event-status"

/**
 * Which campaign event Today detected and when it ends, as one localized line. It reports
 * detection, not the game's global calendar: when no event id is synced the schedule farms no event
 * node either, so the line says "not active" even if the calendar has a window open right now.
 */
function useCampaignEventDetail(): {
  active: boolean
  icon: string | undefined
  detail: string
} {
  const { t, i18n } = useTranslation("dailies")
  const { active, name, icon, endStatus } = useCampaignEventStatus()

  const remaining =
    endStatus.kind === "confirmed"
      ? formatRelativeTime(endStatus.targetMs, i18n.language)
      : null
  const unconfirmed = endStatus.kind === "unconfirmed"

  const detail = !active
    ? t("today.campaignEvent.inactive")
    : name
      ? remaining
        ? t("today.campaignEvent.namedWithTime", { name, time: remaining })
        : unconfirmed
          ? t("today.campaignEvent.namedUnconfirmed", { name })
          : t("today.campaignEvent.named", { name })
      : remaining
        ? t("today.campaignEvent.unnamedWithTime", { time: remaining })
        : unconfirmed
          ? t("today.campaignEvent.unnamedUnconfirmed")
          : t("today.campaignEvent.unnamed")

  return { active, icon, detail }
}

/** Today's Campaign event glance tile. The status wraps instead of truncating. */
export function CampaignEventTile() {
  const { t } = useTranslation("dailies")
  const { active, icon, detail } = useCampaignEventDetail()

  return (
    <GlanceTile
      label={t("today.campaignEvent.title")}
      testId="campaign-event-status"
      valueClassName="text-sm font-medium"
    >
      <span className="flex items-start justify-end gap-2 @[42rem]:justify-start">
        {active && icon ? (
          <EntityIcon alt="" className="size-5 shrink-0" src={icon} />
        ) : null}
        <span className="min-w-0 break-words">{detail}</span>
      </span>
    </GlanceTile>
  )
}
