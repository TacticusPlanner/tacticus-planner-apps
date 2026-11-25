import { useMemo, useState } from "react"
import { Outlet, useMatch } from "react-router"
import { useTranslation } from "react-i18next"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { slotRarityCap } from "../lib/season"
import { useAttackTarget } from "../model/attack-target"
import { useCurrentGuildWar } from "../model/use-guild-war"
import { useCatalogDataset } from "@/shared/local-data"
import {
  EmptyState,
  LocalReadFailure,
  PageHeaderSettings,
  PageSettingsButton,
} from "@/shared/ui"
import { PageContainer } from "@/widgets/page-container"

import { warSettings } from "../model/default-settings"
import type { GuildWarContext } from "../model/guild-war-context"
import { useGuildWarNames } from "../model/use-guild-war-names"
import { AttackTargetBar } from "./attack-target-bar"
import { GuildWarSettingsDialog } from "./guild-war-settings-dialog"

/**
 * The Guild War group's layout (Offense, History): the Settings button in the header, the zone and
 * slot being attacked above the tabs (they scope both), and the war the tabs read. Sign-in only: no
 * registered guild needed.
 */
export function GuildWarLayout() {
  const { t } = useTranslation("guildWar")
  const { seasonName } = useGuildWarNames()
  const current = useCurrentGuildWar()
  const seasons = useCatalogDataset("guild-war")
  const [settingsOpen, setSettingsOpen] = useState(false)
  // The zone and slot pick what to attack, so History, which only reads past wars, leaves them out.
  const onHistory = useMatch("/guild/war/history") !== null

  const war = current.data ?? null
  const seasonList = seasons.status === "ready" ? seasons.data : undefined
  const settings = seasonList ? warSettings(war, seasonList) : undefined
  const season = seasonList?.find((entry) => entry.id === settings?.seasonId)
  const { target, setZoneId, setSlot } = useAttackTarget(season)
  const rarityCap =
    season && settings && target.zoneId !== null && target.slot !== null
      ? slotRarityCap(
          season,
          settings.battlefieldLevel,
          target.zoneId,
          target.slot
        )
      : undefined
  const context = useMemo(
    (): GuildWarContext | undefined =>
      settings ? { war, season, settings, target, rarityCap } : undefined,
    [war, season, settings, target, rarityCap]
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
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {onHistory ? null : (
            <AttackTargetBar
              battlefieldLevel={settings.battlefieldLevel}
              onSlotChange={setSlot}
              onZoneChange={setZoneId}
              season={season}
              target={target}
            />
          )}
          <p
            className="text-sm text-muted-foreground"
            data-testid="guild-war-settings-summary"
          >
            {t("settingsSummary", {
              season: seasonName(settings.seasonId),
              level: settings.battlefieldLevel,
            })}
          </p>
        </div>
        <Outlet context={context} />
        <GuildWarSettingsDialog
          onOpenChange={setSettingsOpen}
          open={settingsOpen}
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
          testId="guild-war-settings-button"
        />
      </PageHeaderSettings>
      <div className="flex flex-col gap-5">{content}</div>
    </PageContainer>
  )
}
