import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

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
      {isRefreshing ? (
        <Spinner aria-hidden="true" />
      ) : (
        <RefreshCw aria-hidden="true" />
      )}
      {isRefreshing
        ? t("guildRaids.status.refreshing")
        : t("guildRaids.status.refresh")}
    </Button>
  )
}
