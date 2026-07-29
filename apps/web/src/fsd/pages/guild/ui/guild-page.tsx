import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { guildQueries } from "@/entities/guild"
import { ApiError } from "@/shared/api"
import { PageContainer } from "@/widgets/page-container"

import { GuildRegisteredView } from "./guild-registered-view"
import { GuildRegistrationForm } from "./guild-registration-form"
import { GuildTacticusUserIdCard } from "./guild-tacticus-user-id-card"

export function GuildPage() {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const query = useQuery({
    ...guildQueries.current(),
    enabled: isAuthenticated,
  })
  const load = () => {
    void query.refetch()
  }
  const errorMessage = query.isError
    ? query.error instanceof ApiError
      ? query.error.message
      : t("guild.loadError")
    : null
  const data = query.data

  return (
    <PageContainer data-testid="guild-page">
      {query.isPending ? (
        <div className="flex flex-col gap-3" data-testid="guild-page-loading">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : null}

      {errorMessage ? (
        <div
          className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          data-testid="guild-page-error"
          role="alert"
        >
          <p className="text-destructive">{errorMessage}</p>
          <Button onClick={load} size="sm" variant="outline">
            {t("guild.retry")}
          </Button>
        </div>
      ) : null}

      {data?.state === "tacticusUserIdRequired" ? (
        <GuildTacticusUserIdCard onSaved={load} />
      ) : null}

      {data?.state === "unregistered" ? (
        <GuildRegistrationForm onRegistered={load} />
      ) : null}

      {data?.state === "registered" && data.guild ? (
        <GuildRegisteredView
          guild={data.guild}
          onSynced={load}
          onPurged={load}
        />
      ) : null}
    </PageContainer>
  )
}
