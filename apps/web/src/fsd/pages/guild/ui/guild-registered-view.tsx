import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { useMsal } from "@azure/msal-react"

import { syncMyGuild, type RegisteredGuild } from "@/entities/guild"
import { ApiError } from "@/shared/api"

import { formatRelativeTime } from "../lib/format-relative-time"
import { GuildMembersList } from "./guild-members-list"

type Props = {
  guild: RegisteredGuild
  onSynced: () => void
}

/**
 * The registered-guild view: name/tag/level summary, a Sync Guild button (Leader/Co-Leader only), and the
 * single read-only Members tab (Guild Phase 1 excludes clusters, stats, raids, and other tabs).
 */
export function GuildRegisteredView({ guild, onSynced }: Props) {
  const { t, i18n } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const [status, setStatus] = useState<"idle" | "syncing" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const lastSynced = guild.lastSyncSucceededAt
    ? formatRelativeTime(Date.parse(guild.lastSyncSucceededAt), i18n.language)
    : null

  const handleSync = async () => {
    // Guards against overlapping requests — the button is also disabled while syncing, but this covers
    // any path that could otherwise re-trigger the handler mid-flight.
    if (!account || status === "syncing") {
      return
    }

    setStatus("syncing")
    setErrorMessage(null)

    try {
      await syncMyGuild(instance, account)
      setStatus("idle")
      onSynced()
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof ApiError ? error.message : t("guild.summary.syncError")
      )
    }
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
            <Button
              data-testid="guild-sync-button"
              disabled={status === "syncing"}
              size="sm"
              variant="outline"
              onClick={() => void handleSync()}
            >
              {status === "syncing" ? (
                <Spinner />
              ) : (
                <RefreshCw data-icon="inline-start" />
              )}
              {status === "syncing"
                ? t("guild.summary.syncing")
                : t("guild.summary.sync")}
            </Button>
          ) : null}
        </CardHeader>
        {status === "error" && errorMessage ? (
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

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger data-testid="guild-tab-members" value="members">
            {t("guild.tabs.members")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <GuildMembersList members={guild.members} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
