import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"

import { EntityIcon } from "@/shared/ui"
import { useGuildRaidMetaCatalog } from "@/entities/guild-raid-meta"

/**
 * Read-only curated-comp display for a prime's `primes[].recommendations` — roster, roles, Machine of
 * War, and `efficiency`, resolved the same way a boss recommendation is (reuses `resolveRecommendation`).
 * Deliberately carries no readiness percentage or matcher: primes are meaningfully easier than the boss
 * they accompany (see design.md's "Primes get curated-comp display, not the investment-readiness
 * engine" decision). Renders nothing when the catalog has no curated comp for this prime — the existing
 * roster-agnostic display (the live-status `GuildRaidPrimeCard`, which needs no team data at all)
 * already covers that case, so there is no separate empty-state to add here.
 */
export function GuildRaidPrimeCompCard({
  primeUnitSetId,
}: {
  primeUnitSetId: string
}) {
  const { t } = useTranslation("dailies")
  const catalog = useGuildRaidMetaCatalog()

  if (catalog.status !== "ready") return null

  const prime = catalog.meta.primes.find(
    (candidate) => candidate.primeUnitSetId === primeUnitSetId
  )
  if (!prime || prime.recommendations.length === 0) return null

  return (
    <div
      className="flex flex-col gap-2"
      data-testid="guild-raid-prime-comp-card"
    >
      {prime.recommendations.map((recommendation) => {
        const resolved =
          catalog.presentation.resolveRecommendation(recommendation)
        return (
          <Card
            key={recommendation.id}
            data-testid="guild-raid-prime-comp-recommendation"
          >
            <CardHeader className="flex-row items-center gap-2">
              <Badge data-testid="guild-raid-prime-comp-kind-badge">
                {resolved.kind.label}
              </Badge>
              <Badge variant="secondary">
                {t("guildRaids.exactMeta.efficiencyLabel", {
                  value: recommendation.efficiency,
                })}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap items-start gap-3">
              {resolved.heroSlots.map((slot) => (
                <div
                  key={slot.hero.id}
                  className="flex w-16 flex-col items-center gap-1 text-center"
                  data-testid="guild-raid-prime-comp-hero"
                >
                  <EntityIcon
                    src={slot.hero.portraitUrl}
                    alt={slot.hero.name}
                    className="size-10 rounded-full border"
                  />
                  <span className="w-full truncate text-xs">
                    {slot.hero.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {slot.role.label}
                  </span>
                </div>
              ))}
              <div
                className="flex w-16 flex-col items-center gap-1 text-center"
                data-testid="guild-raid-prime-comp-mow"
              >
                <EntityIcon
                  src={resolved.mow.portraitUrl}
                  alt={resolved.mow.name}
                  className="size-10 rounded-full border"
                />
                <span className="w-full truncate text-xs">
                  {resolved.mow.name}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
