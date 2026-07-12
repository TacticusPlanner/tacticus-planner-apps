import { useState } from "react"
import { RefreshCw, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Outlet, useLocation, useNavigate } from "react-router"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { useMsal } from "@azure/msal-react"

import { syncMyGuild, type RegisteredGuild } from "@/entities/guild"
import { ApiError } from "@/shared/api"

import { formatRelativeTime } from "../lib/format-relative-time"
import { GuildPurgeDialog } from "./guild-purge-dialog"

const tabs = [
  {
    value: "members",
    path: "/guild/members",
    labelKey: "guild.tabs.members",
  },
] as const

type Props = {
  guild: RegisteredGuild
  onSynced: () => void
  onPurged: () => void
}

/**
 * The registered-guild view: name/tag/level summary, a Sync Guild button (Leader/Co-Leader only), and a
 * routed tab bar (mirrors LookupPage) with an `<Outlet/>` for the active tab's content. Only the Members
 * tab exists in Guild Phase 1 — clusters/stats/raids are deferred, and each will get its own route + tab
 * entry here without restructuring this view.
 */
export function GuildRegisteredView({ guild, onSynced, onPurged }: Props) {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const [status, setStatus] = useState<"idle" | "syncing" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false)

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
            <div className="flex items-center gap-2">
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

      <Tabs
        value={
          tabs.find((tab) => pathname.startsWith(tab.path))?.value ?? "members"
        }
        onValueChange={(value) => {
          const tab = tabs.find((entry) => entry.value === value)
          if (tab) void navigate(tab.path)
        }}
      >
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              data-testid={`guild-tab-${tab.value}`}
              value={tab.value}
            >
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Outlet context={guild.members} />

      {account ? (
        <GuildPurgeDialog
          account={account}
          instance={instance}
          open={isPurgeDialogOpen}
          onOpenChange={setIsPurgeDialogOpen}
          onPurged={onPurged}
        />
      ) : null}
    </div>
  )
}
