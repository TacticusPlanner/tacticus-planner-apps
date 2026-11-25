import { useTranslation } from "react-i18next"

import { useMinuteNow } from "@/entities/legendary-event"
import { formatEventCountdown } from "@/shared/lib"
import { CountdownChip, EntityIcon } from "@/shared/ui"

import { GlanceTile } from "./today/glance-tile"
import { useCampaignEventStatus } from "./use-campaign-event-status"

/**
 * Which campaign event Today detected and when it ends: one localized line, then for a confirmed end
 * the same countdown Home shows ("Ends in 8 days 15 hr"), refreshed each minute. It reports
 * detection, not the game's global calendar: when no event id is synced the schedule farms no event
 * node either, so the line says "not active" even if the calendar has a window open right now.
 */
function useCampaignEventDetail(): {
  active: boolean
  icon: string | undefined
  detail: string
  endsIn: string | null
} {
  const { t, i18n } = useTranslation("dailies")
  const nowMs = useMinuteNow()
  const { active, name, icon, endStatus } = useCampaignEventStatus()

  const endsIn =
    active && endStatus.kind === "confirmed"
      ? t("today.campaignEvent.endsIn", {
          when: formatEventCountdown(endStatus.targetMs, nowMs, i18n.language, {
            withHours: true,
          }),
        })
      : null
  const unconfirmed = endStatus.kind === "unconfirmed"

  const detail = !active
    ? t("today.campaignEvent.inactive")
    : name
      ? unconfirmed
        ? t("today.campaignEvent.namedUnconfirmed", { name })
        : t("today.campaignEvent.named", { name })
      : unconfirmed
        ? t("today.campaignEvent.unnamedUnconfirmed")
        : t("today.campaignEvent.unnamed")

  return { active, icon, detail, endsIn }
}

/** Today's Campaign event glance tile. The status wraps instead of truncating. */
export function CampaignEventTile() {
  const { t } = useTranslation("dailies")
  const { active, icon, detail, endsIn } = useCampaignEventDetail()

  return (
    <GlanceTile
      label={t("today.campaignEvent.title")}
      testId="campaign-event-status"
      valueClassName="text-sm font-medium"
    >
      <span className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 @2xl:justify-start">
        <span className="flex min-w-0 items-start gap-2">
          {active && icon ? (
            <EntityIcon size="inline" alt="" className="shrink-0" src={icon} />
          ) : null}
          <span className="min-w-0 wrap-break-word">{detail}</span>
        </span>
        {endsIn ? <CountdownChip text={endsIn} /> : null}
      </span>
    </GlanceTile>
  )
}
