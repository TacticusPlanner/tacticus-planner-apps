import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  damageTypeIcon,
  statIcon,
  traitIcon,
  type CharacterStorageModel,
  type EquipmentStorageModel,
} from "@workspace/game-catalog"
import type { Rank } from "@workspace/game-domain"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import {
  AbilityText,
  rulesTextPending,
  useTraitText,
  type TraitTextEntry,
} from "@/shared/ability-text"
import { describeSeries, EntityIcon, LevelChart } from "@/shared/ui"

import { usePierceRatios } from "../../model/use-pierce-ratios"
import { RulesTextNote } from "../unit/rules-text-note"
import { ladderRanks, type StatsFigure } from "./character-unit.view-model"
import { EquipmentSlots } from "./equipment-slots"

/** The cards every Details section sits in on desktop. */
export function DetailsCard({
  title,
  aside,
  children,
  className,
  "data-testid": testId,
}: {
  title?: string
  aside?: ReactNode
  children: ReactNode
  className?: string
  "data-testid"?: string
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-[10px] border bg-card p-4",
        className
      )}
      data-testid={testId}
    >
      {title ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 className="font-heading text-lg font-bold">{title}</h2>
          {aside ? (
            <span className="text-xs text-muted-foreground">{aside}</span>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

const chip =
  "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-sm tabular-nums"

/**
 * One attack: its hit count, damage type with that type's pierce (the share of each hit that gets
 * through any armour, as on the comparison radar), and range for a ranged attack.
 */
function AttackRow({
  kind,
  hits,
  damageType,
  range,
}: {
  kind: "melee" | "ranged"
  hits: number
  damageType: string
  range?: number
}) {
  const { t } = useTranslation(["library", "damageTypes"])
  const pierce = usePierceRatios().get(damageType)
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t py-2"
      data-testid={`unit-attack-${kind}`}
    >
      <dt className="flex w-24 items-center gap-1.5 text-sm text-muted-foreground">
        <EntityIcon src={statIcon(kind)} alt="" className="size-4" />
        {t(`characterUnit.glance.${kind}`)}
      </dt>
      <dd className="flex flex-wrap items-center gap-1.5">
        <span className={cn(chip, "bg-muted font-semibold")}>
          {t("characterUnit.glance.hits", { count: hits })}
        </span>
        <span className={chip}>
          <EntityIcon
            src={damageTypeIcon(damageType)}
            alt=""
            className="size-4"
          />
          {t(`damageTypes:${damageType}`, { defaultValue: damageType })}
          {pierce !== undefined ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="ml-0.5 border-l pl-1.5 text-muted-foreground underline decoration-dotted underline-offset-2"
                  data-testid={`unit-attack-${kind}-pierce`}
                >
                  {t("characterUnit.glance.pierce", {
                    value: Math.round(pierce * 100),
                  })}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {t("characterUnit.glance.pierceHint", {
                  value: Math.round(pierce * 100),
                })}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </span>
        {range !== undefined ? (
          <span className={chip}>
            {t("characterUnit.glance.range", { range })}
          </span>
        ) : null}
      </dd>
    </div>
  )
}

/** At a glance: the four headline stats, attacks and equipment slots (LIB-01's quick summary). */
export function AtAGlance({
  character,
  stats,
  relicSlot,
  slotItems,
  onRelicClick,
  compact,
}: {
  character: CharacterStorageModel
  /** The stats before equipment; "—" while the power data loads or when it is unavailable. */
  stats: StatsFigure
  /** The slot the character's relic goes in (the relic's equipment type) and the relic's name. */
  relicSlot?: { slot: string; name: string }
  /** The items each slot can take (see `equippableItems`). */
  slotItems: ReadonlyMap<string, readonly EquipmentStorageModel[]>
  /** Jumps to the Relic panel. */
  onRelicClick: () => void
  compact: boolean
}) {
  const { t, i18n } = useTranslation("library")
  const format = new Intl.NumberFormat(i18n.language)
  // No percentile lines: the radar's percentiles are at its fixed reference, not at these values.
  const shown = stats.status === "ready" ? stats.stats : undefined
  const boxes: {
    key: "health" | "damage" | "armour" | "movement"
    value: number | undefined
  }[] = [
    { key: "health", value: shown?.health },
    { key: "damage", value: shown?.damage },
    { key: "armour", value: shown?.armour },
    { key: "movement", value: character.movement },
  ]

  return (
    <div className="flex flex-col gap-3" data-testid="unit-glance">
      <dl className="grid grid-cols-4 gap-2">
        {boxes.map((box) => (
          <div
            key={box.key}
            className="flex min-w-0 flex-col rounded-lg bg-muted p-2.5"
            data-testid={`unit-glance-${box.key}`}
          >
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <EntityIcon
                src={statIcon(box.key)}
                alt=""
                className="size-4 shrink-0"
              />
              <span className="truncate">
                {t(`characterUnit.glance.${box.key}`, {
                  defaultValue: box.key,
                })}
              </span>
            </dt>
            <dd
              className={cn(
                "font-bold tabular-nums",
                compact ? "text-lg" : "text-[22px]"
              )}
            >
              {box.value === undefined ? "—" : format.format(box.value)}
            </dd>
          </div>
        ))}
      </dl>
      {stats.status === "unavailable" ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid="unit-glance-stats-unavailable"
        >
          {t("characterUnit.glance.statsUnavailable")}
        </p>
      ) : null}
      <dl className="flex flex-col text-sm">
        <AttackRow
          kind="melee"
          hits={character.meleeHits}
          damageType={character.meleeDamage}
        />
        {character.rangedDamage ? (
          <AttackRow
            kind="ranged"
            hits={character.rangedHits ?? 0}
            damageType={character.rangedDamage}
            range={character.rangeDistance ?? undefined}
          />
        ) : null}
      </dl>
      <EquipmentSlots
        slots={character.equipmentSlots}
        relicSlot={relicSlot}
        slotItems={slotItems}
        onRelicClick={onRelicClick}
      />
    </div>
  )
}

function TraitDescription({ text }: { text: TraitTextEntry }) {
  return (
    <AbilityText
      text={text.description}
      level={1}
      variables={text.variables}
      rarity="Common"
      className="text-sm leading-[1.45] text-muted-foreground"
    />
  )
}

/** Each trait's icon, name and description; a trait without text shows its name only. */
export function TraitsList({ traits }: { traits: readonly string[] }) {
  const { t } = useTranslation(["traits"])
  const traitText = useTraitText()
  return (
    <ul className="flex flex-col gap-3" data-testid="unit-traits">
      {traits.length > 0 && rulesTextPending(traitText) ? (
        <li>
          <RulesTextNote rules={traitText} data-testid="unit-traits-text" />
        </li>
      ) : null}
      {traits.map((trait) => {
        const text = traitText.text(trait)
        return (
          <li
            key={trait}
            className="flex gap-3"
            data-testid={`unit-trait-${trait}`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <EntityIcon src={traitIcon(trait)} alt="" className="size-7" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">
                {t(`traits:${trait}`, { defaultValue: trait })}
              </p>
              {text ? <TraitDescription text={text} /> : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

const statKeys = ["health", "damage", "armour"] as const

/**
 * Health, Damage and Armour for every rank at the shown rarity and stars: three charts on desktop
 * (one axis each, so Armour isn't flattened under Health), a table on mobile.
 */
export function StatsByRank({
  stats,
  shownRank,
  rankCap,
  owned,
  isMobile,
}: {
  stats: StatsFigure
  shownRank: Rank
  /** The highest rank the shown rarity and stars allow; later ranks are faded. */
  rankCap: Rank
  owned: boolean
  isMobile: boolean
}) {
  const { t, i18n } = useTranslation(["library", "progression"])
  const locale = i18n.language
  const markerIndex = ladderRanks.indexOf(shownRank)
  const capIndex = ladderRanks.indexOf(rankCap)
  const dimFrom = capIndex === -1 ? undefined : capIndex + 1
  const aboveCap = (index: number) => dimFrom !== undefined && index >= dimFrom
  const rankLabel = (rank: Rank) =>
    t(`progression:ranks.${rank}`, { defaultValue: rank })
  const xLabels = ladderRanks.map(rankLabel)
  // A tick at each tier's first rank: Stone I, Iron I, … Adamantine I.
  const xTicks = ladderRanks
    .map((rank, index) => ({ rank, index }))
    .filter(({ rank }) => rank.endsWith("1"))
    .map(({ index }) => index)
  const format = new Intl.NumberFormat(locale)

  if (stats.status === "loading") {
    return <Skeleton className="h-32 w-full rounded-lg" />
  }
  // The ladder alone is unavailable when one of its ranks cannot be computed; At a glance still
  // shows the shown rank's stats.
  if (stats.status === "unavailable" || !stats.byRank) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="unit-stats-unavailable"
      >
        {t("characterUnit.glance.statsUnavailable")}
      </p>
    )
  }
  const { byRank } = stats

  if (isMobile) {
    return (
      <table
        className="w-full text-sm tabular-nums"
        data-testid="unit-stats-table"
      >
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th scope="col" className="py-1 font-normal">
              {t("characterUnit.statsByRank.rank")}
            </th>
            {statKeys.map((key) => (
              <th key={key} scope="col" className="py-1 text-right font-normal">
                {t(`characterUnit.glance.${key}`, { defaultValue: key })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ladderRanks.map((rank, index) => (
            <tr
              key={rank}
              className={cn(
                "border-t",
                index === markerIndex && "bg-hl font-semibold",
                aboveCap(index) && "text-muted-foreground"
              )}
              aria-current={index === markerIndex ? "true" : undefined}
              data-above-cap={aboveCap(index) || undefined}
            >
              <th scope="row" className="py-1 text-left font-normal">
                {rankLabel(rank)}
                {aboveCap(index) ? (
                  <span className="sr-only">
                    {t("characterUnit.statsByRank.aboveCap")}
                  </span>
                ) : null}
              </th>
              {statKeys.map((key) => (
                <td key={key} className="py-1 text-right">
                  {format.format(byRank[index]?.[key] ?? NaN)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
      {statKeys.map((key) => {
        const points = byRank.map((stats) => [stats[key]])
        const { from, to } = describeSeries(points, locale)
        const stat = t(`characterUnit.glance.${key}`, { defaultValue: key })
        return (
          <LevelChart
            key={key}
            title={stat}
            points={points}
            xLabels={xLabels}
            xTicks={xTicks}
            // Tier initials (St, Ir, Br …) under narrow charts; the readout names the full rank.
            tickLabel={(index) => xLabels[index]?.slice(0, 2) ?? ""}
            markerIndex={markerIndex}
            readoutSuffix={
              owned ? t("characterUnit.statsByRank.yours") : undefined
            }
            dimFrom={dimFrom}
            dimmedSuffix={t("characterUnit.statsByRank.aboveCap")}
            caption={t("characterUnit.statsByRank.caption", {
              stat,
              from,
              to,
              firstRank: xLabels[0],
              lastRank: xLabels.at(-1),
            })}
            height={120}
            locale={locale}
            data-testid={`unit-stats-${key}`}
          />
        )
      })}
    </div>
  )
}
