import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function GuildRaidStatusLoading() {
  return (
    <div
      className="flex flex-col gap-3"
      data-testid="guild-raid-status-loading"
    >
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

/**
 * Shown for the API's never-observed conflict: the page's mount-triggered automatic refresh (see
 * `useGuildRaidStatus`) is already running in the background and will replace this once it lands.
 */
export function GuildRaidStatusNeverObserved() {
  const { t } = useTranslation("dailies")

  return (
    <Card data-testid="guild-raid-status-never-observed">
      <CardHeader>
        <CardTitle>{t("guildRaids.neverObserved.title")}</CardTitle>
        <CardDescription>
          {t("guildRaids.neverObserved.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  )
}

export function GuildRaidStatusNoActiveSeason() {
  const { t } = useTranslation("dailies")

  return (
    <Card data-testid="guild-raid-status-no-active-season">
      <CardHeader>
        <CardTitle>{t("guildRaids.noActiveSeason.title")}</CardTitle>
        <CardDescription>
          {t("guildRaids.noActiveSeason.description")}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

export function GuildRaidStatusError({ retry }: { retry: () => void }) {
  const { t } = useTranslation("dailies")

  return (
    <Alert data-testid="guild-raid-status-error" variant="destructive">
      <AlertTitle>{t("guildRaids.loadError.title")}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <Button onClick={retry} size="sm" variant="outline">
          {t("guildRaids.loadError.retry")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export function GuildRaidCatalogWarning() {
  const { t } = useTranslation("dailies")

  return (
    <Alert data-testid="guild-raid-catalog-warning">
      <AlertTriangle aria-hidden="true" />
      <AlertDescription>
        {t("guildRaids.status.catalogWarning")}
      </AlertDescription>
    </Alert>
  )
}
