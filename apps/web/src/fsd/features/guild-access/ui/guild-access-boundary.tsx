import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useIsAuthenticated } from "@azure/msal-react"
import { useQuery } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { guildQueries, type RegisteredGuild } from "@/entities/guild"
import { ApiError } from "@/shared/api"

import { resolveGuildAccess } from "../model/guild-access"
import { GuildRegistrationForm } from "./guild-registration-form"
import { GuildSynchronizationCard } from "./guild-synchronization-card"
import { GuildTacticusUserIdCard } from "./guild-tacticus-user-id-card"

type Props = {
  children: (guild: RegisteredGuild, refresh: () => void) => ReactNode
  showGuildManagementLink?: boolean
}

export function GuildAccessBoundary({
  children,
  showGuildManagementLink = false,
}: Props) {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const query = useQuery({
    ...guildQueries.current(),
    enabled: isAuthenticated,
  })
  const state = resolveGuildAccess(query)
  const refresh = () => {
    void query.refetch()
  }

  if (state.status === "loading") {
    return (
      <div className="flex flex-col gap-3" data-testid="guild-access-loading">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (state.status === "error") {
    const message =
      state.error instanceof ApiError
        ? state.error.message
        : t("guild.loadError")
    return (
      <Alert data-testid="guild-access-error" variant="destructive">
        <AlertTitle>{t("guild.access.loadErrorTitle")}</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <p>{message}</p>
          <Button onClick={refresh} size="sm" variant="outline">
            {t("guild.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (state.status === "tacticus-user-id-required") {
    return <GuildTacticusUserIdCard onSaved={refresh} />
  }

  if (state.status === "unregistered") {
    return (
      <GuildRegistrationForm
        onRegistered={refresh}
        showGuildManagementLink={showGuildManagementLink}
      />
    )
  }

  if (state.status === "never-synchronized") {
    return (
      <GuildSynchronizationCard
        guild={state.guild}
        onSynchronized={refresh}
        showGuildManagementLink={showGuildManagementLink}
      />
    )
  }

  return children(state.guild, refresh)
}
