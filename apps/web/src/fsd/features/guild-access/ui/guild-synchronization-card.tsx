import { Link } from "react-router"
import { useTranslation } from "react-i18next"
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

import { useGuildSync, type RegisteredGuild } from "@/entities/guild"

type Props = {
  guild: RegisteredGuild
  onSynchronized: (guild: RegisteredGuild) => void
  showGuildManagementLink: boolean
}

export function GuildSynchronizationCard({
  guild,
  onSynchronized,
  showGuildManagementLink,
}: Props) {
  const { t } = useTranslation()
  const { sync, syncing, coolingDown, errorMessage } =
    useGuildSync(onSynchronized)

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
            disabled={syncing || coolingDown}
            onClick={sync}
          >
            {syncing ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            {syncing ? t("guild.summary.syncing") : t("guild.summary.sync")}
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
