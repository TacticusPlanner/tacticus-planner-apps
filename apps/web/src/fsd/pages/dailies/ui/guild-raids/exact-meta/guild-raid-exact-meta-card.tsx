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
  GuildRaidRecommendationReadiness,
  GuildRaidSlotCandidate,
} from "@/entities/guild-raid-meta"

const classificationBadgeVariant = {
  ready: "default",
  partial: "secondary",
  unavailable: "outline",
} as const satisfies Record<
  NonNullable<GuildRaidExactReadinessRecommendationView["classification"]>,
  "default" | "secondary" | "outline"
>

function ReadinessBadge({
  percent,
  testId,
}: {
  percent: number
  testId: string
}) {
  return (
    <span
      data-testid={testId}
      className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
    >
      {percent}%
    </span>
  )
}

function UnitAvatar({
  unit,
  size,
  testIdPrefix,
  readinessPercent,
}: {
  unit: GuildRaidExactReadinessUnitView
  size: "sm" | "md"
  testIdPrefix: string
  readinessPercent?: number
}) {
  const { t } = useTranslation("dailies")
  const ownedState =
    unit.owned === undefined ? "unknown" : unit.owned ? "owned" : "missing"

  return (
    <div
      className="flex w-16 flex-col items-center gap-1"
      data-testid={`${testIdPrefix}-${ownedState}`}
    >
      <div className="relative">
        <EntityIcon
          src={unit.portraitUrl}
          alt={unit.name}
          className={cn(
            "rounded-full border",
            size === "sm" ? "size-8" : "size-12",
            unit.owned === false && "opacity-40 grayscale"
          )}
        />
        {readinessPercent !== undefined ? (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <ReadinessBadge
              percent={readinessPercent}
              testId={`${testIdPrefix}-readiness`}
            />
          </span>
        ) : null}
      </div>
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

function CandidateComparison({
  slotIndex,
  candidates,
}: {
  slotIndex: number
  candidates: GuildRaidSlotCandidate[]
}) {
  const { t } = useTranslation("dailies")

  if (candidates.length === 0) return null

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 text-xs"
      data-testid={`guild-raid-exact-meta-candidates-${slotIndex}`}
    >
      <span className="text-muted-foreground">
        {t("guildRaids.exactMeta.candidatesLabel")}
      </span>
      {candidates.map((candidate) => (
        <Badge
          key={candidate.characterId}
          variant={candidate.isSelected ? "default" : "outline"}
          className="gap-1"
          data-testid={`guild-raid-exact-meta-candidate-${candidate.characterId}`}
        >
          {candidate.characterId} · {candidate.readiness}%
        </Badge>
      ))}
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
  readiness,
}: {
  isMobile: boolean
  recommendation: GuildRaidExactReadinessRecommendationView
  source: GuildRaidMetaSourcePresentation
  updatedOn: string
  /** Investment-readiness percentages for this recommendation — absent when the live current step is
   * unavailable (see `useGuildRaidInvestmentReadiness`'s "unavailable" state), in which case the card
   * falls back to the plain ownership display below without fabricating a percentage. */
  readiness?: GuildRaidRecommendationReadiness
}) {
  const { t } = useTranslation("dailies")
  const { kind, heroes, mow, comps, classification } = recommendation
  const missingCount = heroes.filter((hero) => hero.owned === false).length

  const kindBadge = (
    <Badge
      data-testid="guild-raid-exact-meta-kind-badge"
      variant={kind === "meta" ? "default" : "outline"}
    >
      {t(`guildRaids.exactMeta.kind.${kind}`, { defaultValue: kind })}
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

  const teamReadinessBadge = readiness ? (
    <Badge
      data-testid="guild-raid-exact-meta-team-readiness"
      variant="secondary"
    >
      {t("guildRaids.exactMeta.teamReadiness", {
        percent: readiness.teamReadiness,
      })}
    </Badge>
  ) : null

  const heroesRow = (
    <div
      className="flex flex-wrap items-start gap-3"
      data-testid="guild-raid-exact-meta-heroes"
    >
      {heroes.map((hero, index) => (
        <UnitAvatar
          key={hero.id}
          unit={hero}
          size={isMobile ? "sm" : "md"}
          testIdPrefix="guild-raid-exact-meta-hero"
          readinessPercent={readiness?.heroSlots[index]?.readiness}
        />
      ))}
      <UnitAvatar
        unit={mow}
        size={isMobile ? "sm" : "md"}
        testIdPrefix="guild-raid-exact-meta-mow"
        readinessPercent={readiness?.mow.readiness}
      />
    </div>
  )

  // A flex slot, or any slot whose ideal hero is unowned, gets its full owned-candidate comparison
  // shown — not only the matcher's selected pick (see design.md's "Flex-slot candidates show every
  // owned option's percentage" decision).
  const candidateRows = readiness
    ? readiness.heroSlots
        .map((slot, index) => ({ slot, index }))
        .filter(
          ({ slot }) =>
            (!slot.essential || !slot.assignment?.isIdeal) &&
            slot.candidates.length > 0
        )
        .map(({ slot, index }) => (
          <CandidateComparison
            key={slot.heroId}
            slotIndex={index}
            candidates={slot.candidates}
          />
        ))
    : []

  if (isMobile) {
    return (
      <Card data-testid="guild-raid-exact-meta-card">
        <CardContent className="flex flex-col gap-3 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {classificationBadge}
              {teamReadinessBadge}
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
          {candidateRows.length > 0 ? (
            <div className="flex flex-col gap-1.5">{candidateRows}</div>
          ) : null}
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
        {teamReadinessBadge}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {heroesRow}
        {candidateRows.length > 0 ? (
          <div className="flex flex-col gap-1.5">{candidateRows}</div>
        ) : null}
        <CompsAndSource comps={comps} source={source} updatedOn={updatedOn} />
      </CardContent>
    </Card>
  )
}
