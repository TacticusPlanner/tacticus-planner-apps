import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  chestIcon,
  guildRaidChestTier,
  guildXpIcon,
} from "@workspace/game-catalog"
import { useTranslation } from "react-i18next"

import type {
  GuildRaidMetaCatalog,
  GuildRaidMetaUnitPresentation,
} from "@/entities/guild-raid-meta"
import type { RaidBossesPayload } from "@/entities/raid-boss"
import { EntityIcon } from "@/shared/ui/entity-icon"

/** A set's reward chest: the game's chest art and its tier, or the raw id for an unknown chest. */
function ChestLabel({ chestId }: { chestId: string }) {
  const { t } = useTranslation("library")
  const tier = guildRaidChestTier(chestId)
  if (!tier) return <span>{t("raidBosses.chest", { chest: chestId })}</span>
  return (
    <span className="flex items-center gap-1">
      <EntityIcon size="icon" src={chestIcon(tier)} alt="" />
      {t("raidBosses.chest", { chest: t(`raidBosses.chestTiers.${tier}`) })}
    </span>
  )
}

/** The comp filter's "every comp" choice: a Select item can't carry an empty value. */
const ALL_COMPS = "__all__"

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
      <span className="max-w-20 text-xs/tight">{unit.name}</span>
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
        <ChestLabel chestId={set.chestId} />
        <span className="flex items-center gap-1">
          <EntityIcon size="icon" src={guildXpIcon()} alt="" />
          {t("raidBosses.guildXp", { xp: set.guildXp })}
        </span>
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
                  {t(`raidBosses.encounterTypes.${encounter.encounterType}`, {
                    defaultValue: encounter.encounterType,
                  })}{" "}
                  · {t("raidBosses.turns", { count: encounter.maxNrOfTurns })}
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
        className="flex flex-wrap items-center gap-3 text-sm"
        data-testid="raid-boss-season-select"
      >
        <span className="text-muted-foreground">{t("raidBosses.season")}</span>
        <Select value={selectedSeasonId} onValueChange={onSelectSeason}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {payload.seasonConfigRotation.map((seasonId, index) => (
              <SelectItem key={seasonId} value={seasonId}>
                {t("raidBosses.seasonLabel", { season: index + 1 })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
  // Only "failed" is left; `!== "ready"` also narrows `catalog` to the ready variant below.
  if (catalog.status !== "ready") {
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
          className="flex flex-wrap items-center gap-3 text-sm"
          data-testid="raid-boss-meta-filter"
        >
          <span className="text-muted-foreground">
            {t("raidBosses.meta.compFilter")}
          </span>
          <Select
            value={compId ?? ALL_COMPS}
            onValueChange={(value) =>
              onCompChange(value === ALL_COMPS ? undefined : value)
            }
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_COMPS}>
                {t("raidBosses.meta.allComps")}
              </SelectItem>
              {meta.comps.map((comp) => (
                <SelectItem key={comp.id} value={comp.id}>
                  <EntityIcon
                    size="icon"
                    src={
                      presentation.resolveSignature(comp.signatureUnitId)
                        .portraitUrl
                    }
                    alt=""
                    className="rounded-full"
                  />
                  {comp.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                        <h3 className="font-medium">{lineup.kind.label}</h3>
                        <div className="flex flex-wrap gap-1">
                          {lineup.comps.map((comp) => (
                            <span
                              key={comp.id}
                              className="flex items-center gap-1 rounded-full bg-background py-0.5 pr-2 pl-0.5 text-xs"
                            >
                              <EntityIcon
                                size="icon"
                                src={comp.signature.portraitUrl}
                                alt=""
                                className="rounded-full"
                              />
                              {comp.id}
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
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <EntityIcon
                    size="icon-lg"
                    src={signature.portraitUrl}
                    alt=""
                    className="rounded-full"
                  />
                  {comp.id}
                </span>
              </AccordionTrigger>
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
