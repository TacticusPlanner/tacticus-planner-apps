import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { formatRelativeTime } from "@/shared/lib"

import type {
  GuildRaidResourceView,
  GuildRaidResourcesView,
} from "../guild-raid-status-view-model"

function ResourceRow({
  testId,
  label,
  resource,
}: {
  testId: string
  label: string
  resource: GuildRaidResourceView
}) {
  const { t, i18n } = useTranslation("dailies")

  const countdown = (() => {
    switch (resource.countdown.kind) {
      case "full":
        return t("guildRaids.resources.full")
      case "due":
        return t("guildRaids.resources.due")
      case "pending": {
        const relative = formatRelativeTime(
          resource.countdown.targetMs,
          i18n.language
        )
        return relative
          ? t("guildRaids.resources.nextLabel", { time: relative })
          : null
      }
      case "unavailable":
        return null
    }
  })()

  return (
    <div className="flex flex-col gap-0.5" data-testid={testId}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold">
        {resource.current} / {resource.max}
      </span>
      {countdown ? (
        <span className="text-xs text-muted-foreground">{countdown}</span>
      ) : null}
    </div>
  )
}

export function GuildRaidResourcesCard({
  resources,
}: {
  resources: GuildRaidResourcesView
}) {
  const { t } = useTranslation("dailies")

  return (
    <Card data-testid="guild-raid-resources-card">
      <CardHeader>
        <CardTitle>{t("guildRaids.resources.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {resources.kind === "unavailable" ? (
          <div
            className="flex flex-col gap-1"
            data-testid="guild-raid-resources-missing"
          >
            <p className="text-sm font-medium">
              {t("guildRaids.resources.missingTitle")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("guildRaids.resources.missingDescription")}
            </p>
          </div>
        ) : (
          <div className="flex flex-row gap-6 sm:gap-8">
            <ResourceRow
              testId="guild-raid-resource-tokens"
              label={t("guildRaids.resources.tokens")}
              resource={resources.tokens}
            />
            <ResourceRow
              testId="guild-raid-resource-bombs"
              label={t("guildRaids.resources.bombs")}
              resource={resources.bombs}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
