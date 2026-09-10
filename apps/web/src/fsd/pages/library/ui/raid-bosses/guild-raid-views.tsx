import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Button } from "@workspace/ui/components/button"
import { useTranslation } from "react-i18next"

import {
  type GuildRaidMetaCatalog,
  type GuildRaidMetaUnitPresentation,
} from "@/entities/guild-raid-meta"
import type { RaidBossesPayload } from "@/entities/raid-boss"
import { EntityIcon } from "@/shared/ui/entity-icon"

function Unit({ unit }: { unit: GuildRaidMetaUnitPresentation }) {
  return (
    <div className="flex min-w-16 flex-col items-center gap-1 text-center">
      <span className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold">
        <EntityIcon
          src={unit.portraitUrl}
          alt={unit.name}
          className="size-full"
        />
        {!unit.portraitUrl ? unit.name.slice(0, 2).toUpperCase() : null}
      </span>
      <span className="max-w-20 text-xs leading-tight">{unit.name}</span>
    </div>
  )
}

export function GuildRaidSeasonsView({
  payload,
  selectedSeasonId,
  onSelectSeason,
  encounterName,
  encounterPortrait,
  mobile,
}: {
  payload: RaidBossesPayload
  selectedSeasonId: string
  onSelectSeason: (seasonId: string) => void
  encounterName: (unitSetId: string) => string
  encounterPortrait: (unitSetId: string) => string | undefined
  mobile: boolean
}) {
  const { t } = useTranslation("library")
  const season = payload.seasons[selectedSeasonId]
  if (!season) return null

  const sets = season.tiers.flatMap((tier) =>
    tier.sets.map((set) => ({ tier: tier.tier, set }))
  )
  const setContent = (tier: number, set: (typeof sets)[number]["set"]) => (
    <div className="flex flex-col gap-3" data-testid="raid-boss-season-content">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{t("raidBosses.tier", { tier })}</span>
        <span>{t("raidBosses.set", { set: set.set + 1 })}</span>
        <span>{t("raidBosses.chest", { chest: set.chestId })}</span>
        <span>{t("raidBosses.guildXp", { xp: set.guildXp })}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {set.encounters.map((encounter) => {
          const name = encounterName(encounter.unitSetId)
          const portrait = encounterPortrait(encounter.unitSetId)
          return (
            <div
              key={`${set.set}-${encounter.encounterIndex}`}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold">
                <EntityIcon src={portrait} alt={name} className="size-full" />
                {!portrait ? name.slice(0, 2).toUpperCase() : null}
              </span>
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {encounter.encounterType} ·{" "}
                  {t("raidBosses.turns", { count: encounter.maxNrOfTurns })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <section className="flex flex-col gap-5" data-testid="raid-boss-seasons">
      <label
        className="flex w-fit flex-col gap-1 text-sm font-medium"
        data-testid="raid-boss-season-select"
      >
        {t("raidBosses.season")}
        <select
          value={selectedSeasonId}
          onChange={(event) => onSelectSeason(event.target.value)}
          className="rounded-lg border bg-background px-3 py-2"
        >
          {payload.seasonConfigRotation.map((seasonId) => (
            <option key={seasonId} value={seasonId}>
              {seasonId}
            </option>
          ))}
        </select>
      </label>
      {mobile ? (
        <Accordion type="multiple" data-testid="raid-boss-season-mobile-cards">
          {sets.map(({ tier, set }) => (
            <AccordionItem
              key={`${tier}-${set.set}`}
              value={`${tier}-${set.set}`}
            >
              <AccordionTrigger>
                {t("raidBosses.tierSet", { tier, set: set.set + 1 })}
              </AccordionTrigger>
              <AccordionContent>{setContent(tier, set)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div
          className="grid gap-4"
          data-testid="raid-boss-season-desktop-table"
        >
          {sets.map(({ tier, set }) => (
            <article
              key={`${tier}-${set.set}`}
              className="rounded-lg border p-4"
            >
              {setContent(tier, set)}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function GuildRaidMetaView({
  catalog,
  compId,
  onCompChange,
  mobile,
}: {
  catalog: GuildRaidMetaCatalog
  compId: string | undefined
  onCompChange: (compId: string | undefined) => void
  mobile: boolean
}) {
  const { t } = useTranslation("library")

  if (catalog.status === "loading") {
    return (
      <p data-testid="raid-boss-meta-loading">{t("raidBosses.meta.loading")}</p>
    )
  }
  if (catalog.status === "absent") {
    return (
      <p data-testid="raid-boss-meta-unavailable">
        {t("raidBosses.meta.unavailable")}
      </p>
    )
  }
  if (catalog.status === "failed") {
    return (
      <div
        className="flex flex-col items-start gap-3"
        data-testid="raid-boss-meta-failed"
      >
        <p>{t("raidBosses.meta.failed")}</p>
        <Button variant="outline" onClick={catalog.retry}>
          {t("raidBosses.retry")}
        </Button>
      </div>
    )
  }

  if (catalog.status !== "ready") return null

  const { meta, presentation } = catalog
  const source = presentation.resolveSource(meta.sourceId)
  const groups = meta.bosses
    .map((group) => ({
      group,
      recommendations: group.recommendations.filter(
        (recommendation) => !compId || recommendation.compIds.includes(compId)
      ),
    }))
    .filter(({ recommendations }) => recommendations.length > 0)
  const displayedComps = meta.comps.filter(
    (comp) =>
      !compId ||
      comp.id === compId ||
      groups.some(({ recommendations }) =>
        recommendations.some((recommendation) =>
          recommendation.compIds.includes(comp.id)
        )
      )
  )

  return (
    <section className="flex flex-col gap-5" data-testid="raid-boss-meta">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label
          className="flex flex-col gap-1 text-sm font-medium"
          data-testid="raid-boss-meta-filter"
        >
          {t("raidBosses.meta.compFilter")}
          <select
            value={compId ?? ""}
            onChange={(event) => onCompChange(event.target.value || undefined)}
            className="rounded-lg border bg-background px-3 py-2"
          >
            <option value="">{t("raidBosses.meta.allComps")}</option>
            {meta.comps.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.id}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted-foreground">
          {t("raidBosses.meta.updated", { date: meta.updatedOn })}{" "}
          {source.url ? (
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.name}
            </a>
          ) : (
            source.name
          )}
        </p>
      </div>
      {groups.length === 0 ? (
        <p data-testid="raid-boss-meta-empty">
          {t("raidBosses.meta.noResults")}
        </p>
      ) : null}
      <div
        className={mobile ? "flex flex-col gap-4" : "grid gap-4 xl:grid-cols-2"}
        data-testid="raid-boss-meta-recommendations"
      >
        {groups.map(({ group, recommendations }) => {
          const boss = presentation.resolveBoss(group.bossUnitSetId)
          return (
            <article
              key={group.bossUnitSetId}
              className="rounded-xl border p-4"
            >
              <h2 className="text-lg font-semibold">{boss.name}</h2>
              <div className="mt-4 flex flex-col gap-4">
                {recommendations.map((recommendation) => {
                  const lineup =
                    presentation.resolveRecommendation(recommendation)
                  return (
                    <div
                      key={recommendation.kind}
                      className="rounded-lg bg-muted/50 p-3"
                      data-testid="raid-boss-meta-recommendation"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-medium">
                          {t(`raidBosses.meta.${recommendation.kind}`)}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {recommendation.compIds.map((id) => (
                            <span
                              key={id}
                              className="rounded-full bg-background px-2 py-0.5 text-xs"
                            >
                              {id}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <>
                          {lineup.heroes.map((hero) => (
                            <Unit key={hero.id} unit={hero} />
                          ))}
                        </>
                      </div>
                      <div className="mt-3 flex items-center gap-2 border-t pt-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t("raidBosses.meta.mow")}
                        </span>
                        <Unit unit={lineup.mow} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </article>
          )
        })}
      </div>
      <Accordion type="multiple" data-testid="raid-boss-meta-comps">
        {displayedComps.map((comp) => {
          const signature = presentation.resolveSignature(comp.signatureUnitId)
          return (
            <AccordionItem key={comp.id} value={comp.id}>
              <AccordionTrigger>{comp.id}</AccordionTrigger>
              <AccordionContent>
                <div
                  className="flex flex-col gap-4"
                  data-testid="raid-boss-meta-comp-guidance"
                >
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("raidBosses.meta.signature")}
                    </p>
                    <Unit unit={signature} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("raidBosses.meta.core")}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {comp.coreCharacterIds.map((id) => (
                        <Unit
                          key={id}
                          unit={presentation.resolveCharacter(id)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("raidBosses.meta.flex")}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {comp.flexCharacterIds.map((id) => (
                        <Unit
                          key={id}
                          unit={presentation.resolveCharacter(id)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("raidBosses.meta.suitableMows")}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {comp.mowIds.map((id) => (
                        <Unit key={id} unit={presentation.resolveMow(id)} />
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </section>
  )
}
