import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
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

/** Replaces the never-observed "syncing" card once Tacticus refuses the key: waiting can't fix this. */
export function GuildRaidKeyRejected() {
  const { t } = useTranslation("dailies")

  return (
    <Alert data-testid="guild-raid-key-rejected" variant="destructive">
      <AlertTriangle aria-hidden="true" />
      <AlertTitle>{t("guildRaids.keyRejected.title")}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <p>{t("guildRaids.keyRejected.description")}</p>
        <Button asChild size="sm" variant="outline">
          <Link to="/guild/settings">{t("guildRaids.keyRejected.action")}</Link>
        </Button>
      </AlertDescription>
    </Alert>
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
