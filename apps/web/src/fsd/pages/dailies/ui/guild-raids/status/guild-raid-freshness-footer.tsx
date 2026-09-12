import { useTranslation } from "react-i18next"

import { formatRelativeTime } from "@/shared/lib"
import type { GuildRaidFreshness } from "@/entities/guild-raid-status"

import { GuildRaidRefreshButton } from "./guild-raid-refresh-button"

export function GuildRaidFreshnessFooter({
  freshness,
  observedAtMs,
  lastGuildSyncSucceededAtMs,
  refresh,
  isRefreshing,
  hasRefreshError,
}: {
  freshness: GuildRaidFreshness
  observedAtMs: number
  lastGuildSyncSucceededAtMs: number
  refresh: () => void
  isRefreshing: boolean
  hasRefreshError: boolean
}) {
  const { t, i18n } = useTranslation("dailies")
  const observed = formatRelativeTime(observedAtMs, i18n.language)
  const guildSynced = formatRelativeTime(
    lastGuildSyncSucceededAtMs,
    i18n.language
  )

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <div className="flex flex-col gap-0.5">
        {observed ? (
          <span data-testid="guild-raid-observed-at">
            {t("guildRaids.status.observedLabel", { time: observed })}
          </span>
        ) : null}
        {guildSynced ? (
          <span data-testid="guild-raid-guild-synced-at">
            {t("guildRaids.status.guildSyncedLabel", { time: guildSynced })}
          </span>
        ) : null}
        {freshness === "stale" ? (
          <span data-testid="guild-raid-stale-warning">
            {t("guildRaids.status.staleWarning")}
          </span>
        ) : null}
        {hasRefreshError ? (
          <span data-testid="guild-raid-refresh-error">
            {t("guildRaids.status.refreshFailed")}
          </span>
        ) : null}
      </div>
      <GuildRaidRefreshButton refresh={refresh} isRefreshing={isRefreshing} />
    </div>
  )
}
