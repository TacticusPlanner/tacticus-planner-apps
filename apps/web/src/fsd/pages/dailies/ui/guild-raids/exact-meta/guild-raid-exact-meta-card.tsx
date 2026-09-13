import { useTranslation } from "react-i18next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, RankBadge } from "@/shared/ui"
import type {
  GuildRaidExactReadinessRecommendationView,
  GuildRaidExactReadinessUnitView,
  GuildRaidMetaSourcePresentation,
} from "@/entities/guild-raid-meta"

const classificationBadgeVariant = {
  ready: "default",
  partial: "secondary",
  unavailable: "outline",
} as const satisfies Record<
  NonNullable<GuildRaidExactReadinessRecommendationView["classification"]>,
  "default" | "secondary" | "outline"
>

function UnitAvatar({
  unit,
  size,
  testIdPrefix,
}: {
  unit: GuildRaidExactReadinessUnitView
  size: "sm" | "md"
  testIdPrefix: string
}) {
  const { t } = useTranslation("dailies")
  const ownedState =
    unit.owned === undefined ? "unknown" : unit.owned ? "owned" : "missing"

  return (
    <div
      className="flex w-16 flex-col items-center gap-1"
      data-testid={`${testIdPrefix}-${ownedState}`}
    >
      <EntityIcon
        src={unit.portraitUrl}
        alt={unit.name}
        className={cn(
          "rounded-full border",
          size === "sm" ? "size-8" : "size-12",
          unit.owned === false && "opacity-40 grayscale"
        )}
      />
      <span className="w-full truncate text-center text-xs">{unit.name}</span>
      <span className="sr-only">
        {t(`guildRaids.exactMeta.ownership.${ownedState}`)}
      </span>
      {unit.owned && unit.investment?.rank ? (
        <RankBadge
          rank={unit.investment.rank}
          showLabel={false}
          className="scale-90"
        />
      ) : null}
    </div>
  )
}

function CompsAndSource({
  comps,
  source,
  updatedOn,
}: {
  comps: GuildRaidExactReadinessRecommendationView["comps"]
  source: GuildRaidMetaSourcePresentation
  updatedOn: string
}) {
  const { t } = useTranslation("dailies")

  return (
    <div className="flex flex-col gap-2">
      {comps.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="guild-raid-exact-meta-comps"
        >
          <span className="text-xs text-muted-foreground">
            {t("guildRaids.exactMeta.compsLabel")}
          </span>
          {comps.map((comp) => (
            <Badge key={comp.id} variant="outline" className="gap-1">
              <EntityIcon
                src={comp.signature.portraitUrl}
                alt=""
                className="size-4"
              />
              {comp.signature.name}
            </Badge>
          ))}
        </div>
      ) : null}
      <p
        className="text-xs text-muted-foreground"
        data-testid="guild-raid-exact-meta-source"
      >
        {t("guildRaids.exactMeta.sourceLabel", { name: source.name })}
        {" · "}
        {t("guildRaids.exactMeta.updatedLabel", { date: updatedOn })}
      </p>
    </div>
  )
}

export function GuildRaidExactMetaCard({
  isMobile,
  recommendation,
  source,
  updatedOn,
}: {
  isMobile: boolean
  recommendation: GuildRaidExactReadinessRecommendationView
  source: GuildRaidMetaSourcePresentation
  updatedOn: string
}) {
  const { t } = useTranslation("dailies")
  const { kind, heroes, mow, comps, classification } = recommendation
  const missingCount = heroes.filter((hero) => hero.owned === false).length

  const kindBadge = (
    <Badge
      data-testid="guild-raid-exact-meta-kind-badge"
      variant={kind === "meta" ? "default" : "outline"}
    >
      {t(`guildRaids.exactMeta.kind.${kind}`)}
    </Badge>
  )

  const classificationBadge = (
    <Badge
      data-testid="guild-raid-exact-meta-classification-badge"
      variant={
        classification ? classificationBadgeVariant[classification] : "outline"
      }
    >
      {t(`guildRaids.exactMeta.readiness.${classification ?? "unknown"}`)}
    </Badge>
  )

  const heroesRow = (
    <div
      className="flex flex-wrap items-start gap-3"
      data-testid="guild-raid-exact-meta-heroes"
    >
      {heroes.map((hero) => (
        <UnitAvatar
          key={hero.id}
          unit={hero}
          size={isMobile ? "sm" : "md"}
          testIdPrefix="guild-raid-exact-meta-hero"
        />
      ))}
      <UnitAvatar
        unit={mow}
        size={isMobile ? "sm" : "md"}
        testIdPrefix="guild-raid-exact-meta-mow"
      />
    </div>
  )

  if (isMobile) {
    return (
      <Card data-testid="guild-raid-exact-meta-card">
        <CardContent className="flex flex-col gap-3 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {classificationBadge}
              {classification && missingCount > 0 ? (
                <span
                  className="text-xs text-muted-foreground"
                  data-testid="guild-raid-exact-meta-missing-count"
                >
                  {t("guildRaids.exactMeta.missingCount", {
                    count: missingCount,
                  })}
                </span>
              ) : null}
            </div>
            {kindBadge}
          </div>
          {heroesRow}
          <Accordion type="single" collapsible>
            <AccordionItem value="details">
              <AccordionTrigger data-testid="guild-raid-exact-meta-details-toggle">
                {t("guildRaids.exactMeta.detailsToggle")}
              </AccordionTrigger>
              <AccordionContent>
                <CompsAndSource
                  comps={comps}
                  source={source}
                  updatedOn={updatedOn}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-testid="guild-raid-exact-meta-card">
      <CardHeader className="flex-row items-center gap-2">
        {kindBadge}
        {classificationBadge}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {heroesRow}
        <CompsAndSource comps={comps} source={source} updatedOn={updatedOn} />
      </CardContent>
    </Card>
  )
}
