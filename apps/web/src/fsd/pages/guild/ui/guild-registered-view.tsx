import { useState } from "react"
import { RefreshCw, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
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

import { syncMyGuild, type RegisteredGuild } from "@/entities/guild"
import { ApiError } from "@/shared/api"

import { formatRelativeTime } from "@/shared/lib"
import { GuildPurgeDialog } from "./guild-purge-dialog"

type Props = {
  guild: RegisteredGuild
  onSynced: (guild: RegisteredGuild) => void
  onPurged: () => void
}

/**
 * The registered-guild view: name/tag/level summary, a Sync Guild button (Leader/Co-Leader only), and
 * an `<Outlet/>` for the active tab's content - the Members tab (and any future Guild tabs) are now
 * rendered by the shared app-shell header's section-tabs row (see `section-tabs.tsx`) instead of a tab
 * bar here.
 */
export function GuildRegisteredView({ guild, onSynced, onPurged }: Props) {
  const { t, i18n } = useTranslation()
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false)
  const synchronize = useMutation({
    mutationFn: syncMyGuild,
    onSuccess: onSynced,
  })
  const syncing = synchronize.isPending
  const errorMessage = synchronize.error
    ? synchronize.error instanceof ApiError
      ? synchronize.error.message
      : t("guild.summary.syncError")
    : null

  const lastSynced = guild.lastSyncSucceededAt
    ? formatRelativeTime(Date.parse(guild.lastSyncSucceededAt), i18n.language)
    : null

  const handleSync = () => {
    // Guards against overlapping requests — the button is also disabled while syncing, but this covers
    // any path that could otherwise re-trigger the handler mid-flight.
    if (syncing) return
    synchronize.mutate()
  }

  return (
    <div className="flex flex-col gap-4" data-testid="guild-registered">
      <Card data-testid="guild-summary">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
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
          </div>

          {guild.canSynchronize ? (
            <div className="flex items-center gap-2">
              <Button
                data-testid="guild-sync-button"
                disabled={syncing}
                size="sm"
                variant="outline"
                onClick={handleSync}
              >
                {syncing ? <Spinner /> : <RefreshCw data-icon="inline-start" />}
                {syncing ? t("guild.summary.syncing") : t("guild.summary.sync")}
              </Button>
              <Button
                data-testid="guild-purge-open"
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setIsPurgeDialogOpen(true)}
              >
                <Trash2 data-icon="inline-start" />
                {t("guild.summary.deleteGuild")}
              </Button>
            </div>
          ) : null}
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

      <Outlet context={guild.members} />

      <GuildPurgeDialog
        open={isPurgeDialogOpen}
        onOpenChange={setIsPurgeDialogOpen}
        onPurged={onPurged}
      />
    </div>
  )
}
