import { useId, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
} from "@workspace/game-catalog"
import { lastRank, type Rank } from "@workspace/game-domain"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { RadarAxisResult } from "../../model/stat-radar"
import {
  AtAGlance,
  DetailsCard,
  StatsByRank,
  TraitsList,
} from "./character-details-sections"
import type { StatsFigure } from "./character-unit.view-model"
import { StatRadarCard } from "./stat-radar-card"

/**
 * The Details tab. Desktop: cards in rows (At a glance | Traits; Active | Passive; Compared |
 * Stats by rank; Relic). Mobile: At a glance first, then collapsible sections with a summary value
 * in each header, Active expanded.
 */
export function CharacterUnitDetails({
  character,
  name,
  stats,
  radar,
  shownRank,
  rankCap,
  owned,
  activePanel,
  passivePanel,
  activeLevel,
  passiveLevel,
  relicPanel,
  relicLevel,
  relicSlot,
  slotItems,
  mythicQuests,
  mythicQuestCount,
  isMobile,
}: {
  character: CharacterStorageModel
  name: string
  /** The stats before equipment at the shown values, and by rank (see `characterPowerView`). */
  stats: StatsFigure
  /** Undefined while the damage types the radar needs are still loading. */
  radar: readonly RadarAxisResult[] | undefined
  shownRank: Rank
  /** The highest rank the shown rarity and stars allow. */
  rankCap: Rank
  owned: boolean
  activePanel: ReactNode
  passivePanel: ReactNode
  activeLevel: number
  passiveLevel: number
  relicPanel: ReactNode
  relicLevel?: number
  relicSlot?: { slot: string; name: string }
  slotItems: ReadonlyMap<string, readonly EquipmentStorageModel[]>
  /** The quest list, or null for a character without mythic quest data. */
  mythicQuests: ReactNode
  mythicQuestCount: number
  isMobile: boolean
}) {
  const { t } = useTranslation(["library", "progression", "traits"])
  const [openSections, setOpenSections] = useState<string[]>(["active"])
  const relicAnchorId = useId()
  // The relic chip in At a glance jumps to the relic: on mobile it first opens the Relic section.
  const showRelic = () => {
    if (isMobile)
      setOpenSections((open) =>
        open.includes("relic") ? open : [...open, "relic"]
      )
    requestAnimationFrame(() => {
      const anchor = document.getElementById(relicAnchorId)
      if (!anchor) return
      const reduced = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      ).matches
      anchor.scrollIntoView?.({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      })
      anchor.focus({ preventScroll: true })
    })
  }
  const glance = (
    <AtAGlance
      character={character}
      stats={stats}
      relicSlot={relicSlot}
      slotItems={slotItems}
      onRelicClick={showRelic}
      compact={isMobile}
    />
  )
  const traits =
    character.traits.length > 0 ? (
      <TraitsList traits={character.traits} />
    ) : null
  const compare = radar ? (
    <StatRadarCard radar={radar} unitName={name} size={isMobile ? 240 : 280} />
  ) : (
    <Skeleton
      className="aspect-square w-full max-w-70"
      data-testid="unit-compare-loading"
    />
  )
  const statsByRank = (
    <StatsByRank
      stats={stats}
      shownRank={shownRank}
      rankCap={rankCap}
      owned={owned}
      isMobile={isMobile}
    />
  )
  const traitNames = character.traits
    .map((trait) => t(`traits:${trait}`, { defaultValue: trait }))
    .join(", ")
  const levelMeta = (level: number) => t("unit.ability.levelShort", { level })

  if (isMobile) {
    const section = (
      value: string,
      kind: string,
      title: string,
      meta: string,
      content: ReactNode
    ) => (
      <AccordionItem
        value={value}
        id={value === "relic" ? relicAnchorId : undefined}
        tabIndex={value === "relic" ? -1 : undefined}
        className="scroll-mt-28 outline-none"
        data-testid={`unit-section-${value}`}
      >
        <AccordionTrigger className="min-h-[52px] items-center">
          <span className="flex min-w-0 flex-1 flex-col text-left">
            <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {kind}
            </span>
            <span className="truncate text-base font-semibold">{title}</span>
          </span>
          <span className="ml-2 shrink-0 text-xs text-muted-foreground tabular-nums">
            {meta}
          </span>
        </AccordionTrigger>
        <AccordionContent>{content}</AccordionContent>
      </AccordionItem>
    )
    return (
      <div className="flex flex-col gap-4" data-testid="unit-details">
        <DetailsCard title={t("characterUnit.glance.title")}>
          {glance}
        </DetailsCard>
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
        >
          {traits
            ? section(
                "traits",
                t("characterUnit.traits.title"),
                traitNames,
                String(character.traits.length),
                traits
              )
            : null}
          {activePanel
            ? section(
                "active",
                t("characterUnit.abilities.active"),
                t("characterUnit.abilities.title"),
                levelMeta(activeLevel),
                activePanel
              )
            : null}
          {passivePanel
            ? section(
                "passive",
                t("characterUnit.abilities.passive"),
                t("characterUnit.abilities.title"),
                levelMeta(passiveLevel),
                passivePanel
              )
            : null}
          {section(
            "compare",
            t("characterUnit.compare.subtitle"),
            t("characterUnit.compare.title"),
            "",
            compare
          )}
          {section(
            "stats",
            t(`progression:ranks.${shownRank}`),
            t("characterUnit.statsByRank.title"),
            "",
            statsByRank
          )}
          {section(
            "relic",
            t("characterUnit.relic.kind"),
            t("characterUnit.relic.kind"),
            relicLevel !== undefined
              ? levelMeta(relicLevel)
              : t("characterUnit.relic.noneShort"),
            relicPanel
          )}
          {mythicQuests
            ? section(
                "mythic",
                t("characterUnit.mythic.kind"),
                t("characterUnit.mythic.title"),
                t("characterUnit.mythic.count", { count: mythicQuestCount }),
                mythicQuests
              )
            : null}
        </Accordion>
      </div>
    )
  }

  const row = "grid gap-4"
  return (
    <div className="flex flex-col gap-5" data-testid="unit-details">
      <div
        className={`${row} grid-cols-[repeat(auto-fit,minmax(min(460px,100%),1fr))]`}
      >
        <DetailsCard title={t("characterUnit.glance.title")}>
          {glance}
        </DetailsCard>
        {traits ? (
          <DetailsCard title={t("characterUnit.traits.title")}>
            {traits}
          </DetailsCard>
        ) : null}
      </div>
      {activePanel || passivePanel ? (
        <section
          className="flex flex-col gap-3"
          aria-labelledby="unit-abilities-title"
        >
          <h2
            id="unit-abilities-title"
            className="font-heading text-lg font-bold"
          >
            {t("characterUnit.abilities.title")}
          </h2>
          <div
            className={`${row} grid-cols-[repeat(auto-fit,minmax(min(520px,100%),1fr))]`}
          >
            {activePanel}
            {passivePanel}
          </div>
        </section>
      ) : null}
      <div
        className={`${row} grid-cols-[repeat(auto-fit,minmax(min(520px,100%),1fr))]`}
      >
        <DetailsCard
          title={t("characterUnit.compare.title")}
          aside={t("characterUnit.compare.subtitle")}
          data-testid="unit-compare"
        >
          {compare}
        </DetailsCard>
        <DetailsCard
          title={t("characterUnit.statsByRank.title")}
          data-testid="unit-stats-by-rank"
        >
          {statsByRank}
          <p className="text-xs text-muted-foreground">
            {t("characterUnit.statsByRank.footnote", {
              rank: t(`progression:ranks.${shownRank}`),
            })}
            {rankCap !== lastRank
              ? ` ${t("characterUnit.statsByRank.capFootnote", {
                  rank: t(`progression:ranks.${rankCap}`),
                })}`
              : null}
          </p>
        </DetailsCard>
      </div>
      <div
        className={`${row} grid-cols-[repeat(auto-fit,minmax(min(460px,100%),1fr))]`}
      >
        <div
          id={relicAnchorId}
          tabIndex={-1}
          className="flex scroll-mt-28 flex-col outline-none [&>*]:flex-1"
        >
          {relicPanel}
        </div>
        {mythicQuests ? (
          <DetailsCard
            title={t("characterUnit.mythic.title")}
            aside={t("characterUnit.mythic.count", {
              count: mythicQuestCount,
            })}
            data-testid="unit-mythic"
          >
            {mythicQuests}
          </DetailsCard>
        ) : null}
      </div>
    </div>
  )
}
