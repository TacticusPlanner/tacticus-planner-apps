import { useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

import { syncMyGuild, type RegisteredGuild } from "@/entities/guild"
import { ApiError } from "@/shared/api"

type Props = {
  guild: RegisteredGuild
  onSynchronized: () => void
  showGuildManagementLink: boolean
}

export function GuildSynchronizationCard({
  guild,
  onSynchronized,
  showGuildManagementLink,
}: Props) {
  const { t } = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const synchronization = useMutation({ mutationFn: syncMyGuild })

  const handleSynchronize = async () => {
    setErrorMessage(null)
    try {
      await synchronization.mutateAsync()
      onSynchronized()
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : t("guild.summary.syncError")
      )
    }
  }

  return (
    <Card data-testid="guild-never-synchronized">
      <CardHeader>
        <CardTitle>{t("guild.access.syncRequiredTitle")}</CardTitle>
        <CardDescription>
          {guild.canSynchronize
            ? t("guild.access.syncRequiredManager")
            : t("guild.access.syncRequiredMember")}
        </CardDescription>
      </CardHeader>
      {errorMessage ? (
        <CardContent>
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        </CardContent>
      ) : null}
      <CardFooter className="flex flex-wrap gap-2">
        {guild.canSynchronize ? (
          <Button
            data-testid="guild-access-sync-button"
            disabled={synchronization.isPending}
            onClick={() => void handleSynchronize()}
          >
            {synchronization.isPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            {synchronization.isPending
              ? t("guild.summary.syncing")
              : t("guild.summary.sync")}
          </Button>
        ) : null}
        {showGuildManagementLink ? (
          <Button asChild size="sm" variant="outline">
            <Link to="/guild">{t("guild.openManagement")}</Link>
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
