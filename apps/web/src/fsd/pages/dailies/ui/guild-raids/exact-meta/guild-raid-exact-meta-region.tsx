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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { InfoIcon } from "lucide-react"

import { ProgressionBadge, RankBadge } from "@/shared/ui"
import type {
  GuildRaidExactReadinessQuery,
  GuildRaidInvestmentThreshold,
} from "@/entities/guild-raid-meta"

import { GuildRaidExactMetaCard } from "./guild-raid-exact-meta-card"

function ScoringHelp() {
  const { t } = useTranslation("dailies")

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("guildRaids.exactMeta.howScored")}
        >
          <InfoIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-80 flex-col gap-2 text-sm">
        <p className="font-medium">{t("guildRaids.exactMeta.howScored")}</p>
        <p className="text-muted-foreground">
          {t("guildRaids.exactMeta.howScoredPicks")}
        </p>
        <p className="text-muted-foreground">
          {t("guildRaids.exactMeta.howScoredReadiness")}
        </p>
      </PopoverContent>
    </Popover>
  )
}

function ThresholdStrip({
  threshold,
}: {
  threshold: GuildRaidInvestmentThreshold
}) {
  const { t } = useTranslation("dailies")

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground"
      data-testid="guild-raid-exact-meta-target"
    >
      <span>{t("guildRaids.exactMeta.target")}</span>
      <ProgressionBadge value={threshold.progression} />
      <RankBadge rank={threshold.requiredRank} iconClassName="size-4" />
      <span className="font-medium text-foreground">
        {t("guildRaids.exactMeta.targetAbilities", {
          level: threshold.requiredAbilityLevel,
        })}
      </span>
    </div>
  )
}

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

  const { recommendations, source, threshold } = query
  const sourceName = source.url ? (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2"
    >
      {source.name}
    </a>
  ) : (
    source.name
  )

  return (
    <div
      className="flex flex-col gap-3"
      data-testid="guild-raid-exact-meta-recommendations"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-1">
          <h2
            className="text-sm font-medium"
            data-testid="guild-raid-exact-meta-title"
          >
            {t("guildRaids.exactMeta.title")}
          </h2>
          <ScoringHelp />
        </div>
        <p
          className="text-xs text-muted-foreground"
          data-testid="guild-raid-exact-meta-source"
        >
          {t("guildRaids.exactMeta.sourcePrefix")} {sourceName}
          {" · "}
          {t("guildRaids.exactMeta.updatedLabel", { date: query.updatedOn })}
        </p>
      </div>
      {query.status === "missingRoster" ? (
        <Alert data-testid="guild-raid-exact-meta-roster-missing">
          <AlertTitle>
            {t("guildRaids.exactMeta.missingRoster.title")}
          </AlertTitle>
          <AlertDescription>
            {t("guildRaids.exactMeta.missingRoster.description")}
          </AlertDescription>
        </Alert>
      ) : threshold ? (
        <ThresholdStrip threshold={threshold} />
      ) : (
        <p
          className="text-xs text-muted-foreground"
          data-testid="guild-raid-exact-meta-no-target"
        >
          {t("guildRaids.exactMeta.noTarget")}
        </p>
      )}
      <Tabs defaultValue={recommendations[0]?.id}>
        <TabsList className="max-w-full justify-start overflow-x-auto">
          {recommendations.map((recommendation) => (
            <TabsTrigger
              key={recommendation.id}
              value={recommendation.id}
              className="gap-1.5"
            >
              {recommendation.kind.label}
              {recommendation.teamReadiness === undefined ? null : (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {recommendation.teamReadiness}%
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {recommendations.map((recommendation) => (
          <TabsContent key={recommendation.id} value={recommendation.id}>
            <GuildRaidExactMetaCard
              isMobile={isMobile}
              recommendation={recommendation}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
