import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  isGuildWarSeasonLocked,
  staleGuildWar,
} from "../model/guild-war-errors"
import { useSetGuildWarSettings } from "../model/use-guild-war"
import type { GuildWar, GuildWarSettings } from "../model/types"
import type { GuildWarSeason } from "../lib/season"
import {
  FilterField,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { useSeasonName } from "../model/use-season-name"

/**
 * The page's Settings: the war's season and battlefield level. A change saves at once (creating
 * the current war when there is none), so the dialog ends with Done only. The season comes from the
 * events calendar and is only shown; without a calendar season it can be picked until the war has
 * attacks (they belong to its zones).
 */
export function GuildWarSettingsDialog({
  open,
  onOpenChange,
  war,
  seasons,
  settings,
  seasonAt,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  war: GuildWar | null
  /** When the war started (now with no war), which picks its season number in the calendar. */
  seasonAt: string | number
  seasons: readonly GuildWarSeason[]
  settings: GuildWarSettings
}) {
  const { t } = useTranslation("guildWar")
  const { seasonName, seasonNumber } = useSeasonName()
  const save = useSetGuildWarSettings()
  const season = seasons.find((entry) => entry.id === settings.seasonId)
  const levels = (season?.levels ?? []).map((level) => level.battlefieldLevel)
  const seasonLocked = (war?.attacks.length ?? 0) > 0
  // The calendar names the season (Season 29), so it is shown, not picked; a season it does not
  // name (a config letter) can still be picked.
  const seasonFromCalendar =
    seasonNumber(settings.seasonId, seasonAt) !== undefined

  const change = (next: GuildWarSettings) => {
    save.mutate({ settings: next, revision: war?.revision ?? 0 })
  }
  const changeSeason = (seasonId: string) => {
    const nextLevels =
      seasons
        .find((entry) => entry.id === seasonId)
        ?.levels.map((level) => level.battlefieldLevel) ?? []
    change({
      seasonId,
      battlefieldLevel: nextLevels.includes(settings.battlefieldLevel)
        ? settings.battlefieldLevel
        : (nextLevels.at(-1) ?? 0),
    })
  }

  // The dialog stays mounted, so a failed save is cleared on close rather than shown on reopen.
  const changeOpen = (next: boolean) => {
    if (!next) save.reset()
    onOpenChange(next)
  }

  let error: string | null = null
  if (save.isError) {
    if (staleGuildWar(save.error)) error = t("settings.stale")
    else if (isGuildWarSeasonLocked(save.error))
      error = t("settings.seasonLocked")
    else error = t("settings.failed")
  }

  return (
    <ResponsiveDialog
      data-testid="guild-war-settings"
      onOpenChange={changeOpen}
      open={open}
      width="narrow"
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{t("settings.title")}</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          {t("settings.description")}
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="gap-4">
        {seasonFromCalendar ? (
          <div className="flex flex-col gap-1" data-testid="guild-war-season">
            <span className="text-sm font-medium">{t("settings.season")}</span>
            <span className="text-sm">
              {seasonName(settings.seasonId, seasonAt)}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("settings.seasonFromCalendar")}
            </span>
          </div>
        ) : (
          <FilterField label={t("settings.season")}>
            {({ id, labelId }) => (
              <Select
                disabled={save.isPending || seasonLocked}
                onValueChange={changeSeason}
                value={settings.seasonId}
              >
                <SelectTrigger
                  aria-labelledby={labelId}
                  id={id}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {season ? null : (
                    <SelectItem value={settings.seasonId}>
                      {seasonName(settings.seasonId)}
                    </SelectItem>
                  )}
                  {seasons.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {seasonName(entry.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FilterField>
        )}
        <FilterField label={t("settings.battlefieldLevel")}>
          {({ id, labelId }) => (
            <Select
              disabled={save.isPending || !season}
              onValueChange={(next) =>
                change({ ...settings, battlefieldLevel: Number(next) })
              }
              value={String(settings.battlefieldLevel)}
            >
              <SelectTrigger
                aria-labelledby={labelId}
                id={id}
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {levels.map((level) => (
                  <SelectItem key={level} value={String(level)}>
                    {t("level", { level })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FilterField>
        {seasonLocked && !seasonFromCalendar ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="guild-war-season-locked"
          >
            {t("settings.seasonLocked")}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {t("settings.capsKept")}
        </p>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button onClick={() => changeOpen(false)}>{t("settings.done")}</Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
