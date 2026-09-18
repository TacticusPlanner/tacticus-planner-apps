import { useTranslation } from "react-i18next"

import { formatRelativeTime } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"

import { useCampaignEventStatus } from "./use-campaign-event-status"

/**
 * States which campaign event Today detected and when it ends. It reports detection, not the game's
 * global calendar: when no event id is synced the schedule farms no event node either, so the line
 * says "not active" even if the calendar has a window open right now.
 */
export function CampaignEventStatusLine({ className }: { className?: string }) {
  const { t, i18n } = useTranslation("dailies")
  const { active, name, icon, endsAt } = useCampaignEventStatus()

  const remaining =
    endsAt.kind === "pending"
      ? formatRelativeTime(endsAt.targetMs, i18n.language)
      : null

  const detail = !active
    ? t("today.campaignEvent.inactive")
    : name
      ? remaining
        ? t("today.campaignEvent.namedWithTime", { name, time: remaining })
        : t("today.campaignEvent.named", { name })
      : remaining
        ? t("today.campaignEvent.unnamedWithTime", { time: remaining })
        : t("today.campaignEvent.unnamed")

  return (
    <div className={className} data-testid="campaign-event-status">
      <h2 className="text-lg font-semibold">
        {t("today.campaignEvent.title")}
      </h2>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {active && icon ? (
          <EntityIcon alt="" className="size-5 shrink-0" src={icon} />
        ) : null}
        <span className="truncate">{detail}</span>
      </div>
    </div>
  )
}
