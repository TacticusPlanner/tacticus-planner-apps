import { useState } from "react"
import { RefreshCw, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Outlet } from "react-router"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

import { useGuildSync } from "@/entities/guild"
import type { RegisteredGuild } from "@/entities/guild"

import { formatRelativeTime } from "@/shared/lib"
import { PageToolbar } from "@/shared/ui"
import type { GuildOutletContext } from "./guild-outlet-context"
import { GuildPurgeDialog } from "./guild-purge-dialog"

type Props = {
  guild: RegisteredGuild
  onSynced: (guild: RegisteredGuild) => void
  onPurged: () => void
}

/**
 * The registered-guild view: a page toolbar with Sync guild and Delete guild (Leader/Co-Leader only), the
 * name/tag/level summary, and
 * an `<Outlet/>` for the active tab's content - the Members tab (and any future Guild tabs) are now
 * rendered by the shared app-shell header's section-tabs row (see `section-tabs.tsx`) instead of a tab
 * bar here.
 */
export function GuildRegisteredView({ guild, onSynced, onPurged }: Props) {
  const { t, i18n } = useTranslation()
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false)
  const { sync, syncing, coolingDown, errorMessage } = useGuildSync(onSynced)

  const lastSynced = guild.lastSyncSucceededAt
    ? formatRelativeTime(Date.parse(guild.lastSyncSucceededAt), i18n.language)
    : null

  return (
    <div className="flex flex-col gap-4" data-testid="guild-registered">
      {guild.canSynchronize ? (
        <PageToolbar
          actions={
            <>
              <Button
                className="text-destructive hover:text-destructive"
                data-testid="guild-purge-open"
                onClick={() => setIsPurgeDialogOpen(true)}
                variant="outline"
              >
                <Trash2 data-icon="inline-start" />
                {t("guild.summary.deleteGuild")}
              </Button>
              <Button
                data-testid="guild-sync-button"
                disabled={syncing || coolingDown}
                onClick={sync}
              >
                {syncing ? <Spinner /> : <RefreshCw data-icon="inline-start" />}
                {syncing ? t("guild.summary.syncing") : t("guild.summary.sync")}
              </Button>
            </>
          }
          label={t("guild.summary.actions")}
          testId="guild-toolbar"
        />
      ) : null}

      <Card data-testid="guild-summary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {guild.name}
            <Badge variant="outline">{guild.tag}</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("guild.summary.level", { level: guild.level })}
            {" · "}
            {lastSynced
              ? t("guild.summary.lastSynced", { time: lastSynced })
              : t("guild.summary.neverSynced")}
          </p>
        </CardHeader>
        {errorMessage ? (
          <CardContent>
            <p
              className="text-sm text-destructive"
              data-testid="guild-sync-error"
              role="alert"
            >
              {errorMessage}
            </p>
          </CardContent>
        ) : null}
      </Card>

      <Outlet
        context={
          { guild, onGuildUpdated: onSynced } satisfies GuildOutletContext
        }
      />

      <GuildPurgeDialog
        open={isPurgeDialogOpen}
        onOpenChange={setIsPurgeDialogOpen}
        onPurged={onPurged}
      />
    </div>
  )
}
