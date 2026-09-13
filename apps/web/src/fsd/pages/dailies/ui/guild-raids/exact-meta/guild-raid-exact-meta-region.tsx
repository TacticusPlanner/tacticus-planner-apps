import { useTranslation } from "react-i18next"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { GuildRaidExactReadinessQuery } from "@/entities/guild-raid-meta"

import { GuildRaidExactMetaCard } from "./guild-raid-exact-meta-card"

export function GuildRaidExactMetaRegion({
  isMobile,
  query,
}: {
  isMobile: boolean
  query: GuildRaidExactReadinessQuery
}) {
  const { t } = useTranslation("dailies")

  if (query.status === "loading") {
    return (
      <Skeleton
        className="h-40 w-full"
        data-testid="guild-raid-exact-meta-loading"
      />
    )
  }

  if (query.status === "failed") {
    return (
      <Alert data-testid="guild-raid-exact-meta-failed" variant="destructive">
        <AlertTitle>{t("guildRaids.loadError.title")}</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <Button onClick={query.retry} size="sm" variant="outline">
            {t("guildRaids.loadError.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (query.status === "absentMeta") {
    return (
      <Card data-testid="guild-raid-exact-meta-absent">
        <CardHeader>
          <CardTitle>{t("guildRaids.exactMeta.absentMeta.title")}</CardTitle>
          <CardDescription>
            {t("guildRaids.exactMeta.absentMeta.description")}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (query.status === "noBossRecommendation") {
    return (
      <Card data-testid="guild-raid-exact-meta-no-boss">
        <CardHeader>
          <CardTitle>
            {t("guildRaids.exactMeta.noBossRecommendation.title")}
          </CardTitle>
          <CardDescription>
            {t("guildRaids.exactMeta.noBossRecommendation.description")}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="guild-raid-exact-meta-recommendations"
    >
      <p
        className="text-sm font-medium"
        data-testid="guild-raid-exact-meta-title"
      >
        {t("guildRaids.exactMeta.title")}
      </p>
      {query.status === "missingRoster" ? (
        <Alert data-testid="guild-raid-exact-meta-roster-missing">
          <AlertTitle>
            {t("guildRaids.exactMeta.missingRoster.title")}
          </AlertTitle>
          <AlertDescription>
            {t("guildRaids.exactMeta.missingRoster.description")}
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-4">
        {query.recommendations.map((recommendation) => (
          <GuildRaidExactMetaCard
            key={`${recommendation.kind}-${recommendation.heroes
              .map((hero) => hero.id)
              .join(",")}`}
            isMobile={isMobile}
            recommendation={recommendation}
            source={query.source}
            updatedOn={query.updatedOn}
          />
        ))}
      </div>
    </div>
  )
}
