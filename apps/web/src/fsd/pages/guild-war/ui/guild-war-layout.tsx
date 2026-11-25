import { useMemo, useState } from "react"
import { Outlet } from "react-router"
import { useTranslation } from "react-i18next"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Settings } from "lucide-react"

import { calendarSeasonId } from "../model/calendar-season"
import { useCurrentGuildWar } from "../model/use-guild-war"
import { useCatalogDataset } from "@/shared/local-data"
import {
  EmptyState,
  LocalReadFailure,
  PageHeaderSettings,
  PageSettingsButton,
} from "@/shared/ui"
import { PageContainer } from "@/widgets/page-container"

import { newWarSettings, warSettings } from "../model/default-settings"
import type { GuildWarContext } from "../model/guild-war-context"
import { useSeasonName } from "../model/use-season-name"
import { GuildWarSettingsDialog } from "./guild-war-settings-dialog"

/**
 * The Guild War group's layout (Offense, History): the Settings button in the header, the war's
 * season and level above the tabs (tapping it opens Settings), and the war the tabs read. With no
 * war the season is the one the calendar says is running. Sign-in only: no registered guild needed.
 */
export function GuildWarLayout() {
  const { t } = useTranslation("guildWar")
  const { seasonName } = useSeasonName()
  const current = useCurrentGuildWar()
  const seasons = useCatalogDataset("guild-war")
  const calendar = useCatalogDataset("events-calendar")
  const [nowMs] = useState(() => Date.now())
  const [settingsOpen, setSettingsOpen] = useState(false)

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
        <Button
          aria-label={t("settingsOpen", {
            summary: t("settingsSummary", {
              season: seasonName(settings.seasonId, seasonAt),
              level: settings.battlefieldLevel,
            }),
          })}
          className="self-start text-muted-foreground"
          data-testid="guild-war-settings-summary"
          onClick={() => setSettingsOpen(true)}
          size="sm"
          variant="ghost"
        >
          <Settings data-icon="inline-start" />
          {t("settingsSummary", {
            season: seasonName(settings.seasonId, seasonAt),
            level: settings.battlefieldLevel,
          })}
        </Button>
        <Outlet context={context} />
        <GuildWarSettingsDialog
          onOpenChange={setSettingsOpen}
          open={settingsOpen}
          seasonAt={seasonAt}
          seasons={seasonList ?? []}
          settings={settings}
          war={war}
        />
      </>
    )
  }

  return (
    <PageContainer data-testid="guild-war-page">
      <PageHeaderSettings>
        <PageSettingsButton
          disabled={!context}
          onClick={() => setSettingsOpen(true)}
        />
      </PageHeaderSettings>
      <div className="flex flex-col gap-5">{content}</div>
    </PageContainer>
  )
}
