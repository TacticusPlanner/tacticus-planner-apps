import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

export function GuildRaidRefreshButton({
  refresh,
  isRefreshing,
}: {
  refresh: () => void
  isRefreshing: boolean
}) {
  const { t } = useTranslation("dailies")

  return (
    <Button
      data-testid="guild-raid-refresh"
      onClick={refresh}
      disabled={isRefreshing}
      size="sm"
      variant="outline"
    >
      <RefreshCw
        aria-hidden="true"
        className={isRefreshing ? "motion-safe:animate-spin" : undefined}
      />
      {isRefreshing
        ? t("guildRaids.status.refreshing")
        : t("guildRaids.status.refresh")}
    </Button>
  )
}
