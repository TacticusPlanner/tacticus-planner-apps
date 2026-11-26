import { useMemo, useState } from "react"
import { Outlet } from "react-router"
import { useTranslation } from "react-i18next"
import { Info } from "lucide-react"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { calendarSeasonId } from "../model/calendar-season"
import { useCurrentGuildWar } from "../model/use-guild-war"
import { useCatalogDataset } from "@/shared/local-data"
import { EmptyState, LocalReadFailure } from "@/shared/ui"
import { PageContainer } from "@/widgets/page-container"

import { newWarSettings, warSettings } from "../model/default-settings"
import type { GuildWarContext } from "../model/guild-war-context"
import { useSeasonName } from "../model/use-season-name"

/**
 * The Guild War group's layout (Offense, History): the war's season above the tabs, and the war the
 * tabs read. The season is the war's own, else the one the events calendar says is running; when
 * the calendar names none, a banner says which season the war uses. The battlefield level is picked
 * on Offense. Sign-in only: no registered guild needed.
 */
export function GuildWarLayout() {
  const { t } = useTranslation("guildWar")
  const { seasonName, seasonNumber } = useSeasonName()
  const current = useCurrentGuildWar()
  const seasons = useCatalogDataset("guild-war")
  const calendar = useCatalogDataset("events-calendar")
  const [nowMs] = useState(() => Date.now())

  const war = current.data ?? null
  const seasonList = seasons.status === "ready" ? seasons.data : undefined
  const running =
    seasonList && calendar.status === "ready"
      ? calendarSeasonId(
          calendar.data,
          new Set(seasonList.map((entry) => entry.id)),
          nowMs
        )
      : undefined
  const settings = seasonList
    ? warSettings(war, seasonList, running)
    : undefined
  const season = seasonList?.find((entry) => entry.id === settings?.seasonId)
  // A war's season number is the one it started in; with no war, the one that counts now.
  const seasonAt = war?.startedAt ?? nowMs
  const context = useMemo(
    (): GuildWarContext | undefined =>
      settings && seasonList
        ? {
            war,
            season,
            settings,
            newWarSettings: newWarSettings(settings, seasonList, running),
          }
        : undefined,
    [war, season, settings, seasonList, running]
  )

  let content
  if (current.isPending || seasons.status === "loading") {
    content = (
      <div
        aria-label={t("page.loading")}
        className="flex flex-col gap-4"
        role="status"
      >
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  } else if (current.isError && current.data === undefined) {
    content = (
      <Alert data-testid="guild-war-load-error" variant="destructive">
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {t("page.loadError")}
          <Button
            onClick={() => void current.refetch()}
            size="sm"
            variant="outline"
          >
            {t("page.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  } else if (seasons.status === "error") {
    content = <LocalReadFailure retry={seasons.retry} />
  } else if (!context || !settings) {
    content = (
      <EmptyState
        testId="guild-war-no-seasons"
        title={t("page.noSeasons")}
        variant="empty"
      />
    )
  } else {
    content = (
      <>
        {seasonNumber(settings.seasonId, seasonAt) === undefined ? (
          // The calendar names no running season (a config letter stands in): say which is used.
          <Alert data-testid="guild-war-season-not-listed">
            <Info />
            <AlertDescription>
              {t("page.seasonNotListed", {
                season: seasonName(settings.seasonId, seasonAt),
              })}
            </AlertDescription>
          </Alert>
        ) : (
          <p
            className="text-sm text-muted-foreground"
            data-testid="guild-war-season-line"
          >
            {seasonName(settings.seasonId, seasonAt)}
          </p>
        )}
        <Outlet context={context} />
      </>
    )
  }

  return (
    <PageContainer data-testid="guild-war-page">
      <div className="flex flex-col gap-5">{content}</div>
    </PageContainer>
  )
}
