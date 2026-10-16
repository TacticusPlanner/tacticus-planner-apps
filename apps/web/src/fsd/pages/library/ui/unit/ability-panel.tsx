import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type { Rarity } from "@workspace/game-domain"

import {
  AbilityText,
  buildAbilitySeries,
  chartedSeries,
  type AbilityTextEntry,
} from "@/shared/ability-text"
import { describeSeries, EntityIcon, LevelChart } from "@/shared/ui"

import { LevelStepper } from "./level-stepper"

/** Labelled x ticks: levels 1, 10, 20 … for abilities; 1, 5, 10 for a 10-level relic. */
function levelTicks(maxLevel: number): number[] {
  if (maxLevel <= 10) return [0, Math.floor(maxLevel / 2) - 1, maxLevel - 1]
  return [
    0,
    ...Array.from(
      { length: Math.floor(maxLevel / 10) },
      (_, i) => (i + 1) * 10 - 1
    ),
  ]
}

/**
 * One ability (or relic) as a panel: icon, kind and name, a level stepper, the rules text at that
 * level with level-dependent values highlighted, a next-level line, and a growth chart per changing
 * value. Stepper, text, next-level line and chart markers all read the same `level`. Without rules
 * text the panel says so and shows no stepper, next-level line or chart, never half-resolved text.
 */
export function AbilityPanel({
  kind,
  name,
  iconSrc,
  text,
  rarity,
  unitName,
  factionId,
  level,
  onLevelChange,
  maxLevel,
  playerLevel,
  iconClassName,
  chartFromZero = true,
  headingLevel = "h3",
  note,
  levelControl,
  "data-testid": testId,
}: {
  kind: string
  name: string
  iconSrc?: string
  text: AbilityTextEntry | undefined
  rarity: Rarity
  unitName: string
  factionId: string
  level: number
  onLevelChange: (level: number) => void
  maxLevel: number
  /** The player's level, shown as "Yours: level n" when they own the unit. */
  playerLevel?: number
  iconClassName?: string
  /** Start the chart's y axis near the lowest value instead of 0 (relic values change little). */
  chartFromZero?: boolean
  headingLevel?: "h2" | "h3"
  /** A line under the name, e.g. which other characters share a relic. */
  note?: ReactNode
  /** Replaces the stepper, for a level the panel doesn't set (a MoW's mythic ability follows its blue
   *  stars); the chart then doesn't set a level either. */
  levelControl?: ReactNode
  "data-testid": string
}) {
  const { t, i18n } = useTranslation("library")
  const locale = i18n.language
  const Heading = headingLevel
  const series = useMemo(
    () => (text ? buildAbilitySeries(text, rarity, maxLevel) : []),
    [text, rarity, maxLevel]
  )
  const charted = useMemo(() => chartedSeries(series), [series])
  const changing = series.filter((entry) => !entry.constant)
  const constant = series.filter((entry) => entry.constant)
  const format = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    [locale]
  )
  const formatAt = (values: number[][], index: number) =>
    values[index].map((value) => format.format(value)).join("–")
  const yours =
    playerLevel === undefined
      ? null
      : t("unit.ability.yours", { level: playerLevel })
  const xLabels = useMemo(
    () =>
      Array.from({ length: maxLevel }, (_, index) =>
        t("unit.ability.levelShort", { level: index + 1 })
      ),
    [maxLevel, t]
  )

  return (
    <section
      className="flex min-w-0 flex-col gap-3 rounded-[10px] border bg-card p-4"
      aria-labelledby={`${testId}-name`}
      data-testid={testId}
    >
      <div className="flex flex-wrap items-center gap-3">
        {iconSrc ? (
          <EntityIcon
            src={iconSrc}
            alt=""
            className={iconClassName ?? "size-11 shrink-0"}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            {kind}
          </p>
          <Heading
            id={`${testId}-name`}
            className="text-base leading-tight font-semibold"
          >
            {name}
          </Heading>
          {note ? (
            <p
              className="text-xs text-muted-foreground"
              data-testid={`${testId}-note`}
            >
              {note}
            </p>
          ) : null}
        </div>
        {levelControl ? (
          levelControl
        ) : text ? (
          <LevelStepper
            level={level}
            max={maxLevel}
            label={t("unit.ability.level", { name })}
            levelText={t("unit.ability.levelShort", { level })}
            lowerLabel={t("unit.ability.lower")}
            raiseLabel={t("unit.ability.raise")}
            onChange={onLevelChange}
            data-testid={`${testId}-stepper`}
          />
        ) : yours ? (
          <span className="text-sm text-muted-foreground">{yours}</span>
        ) : null}
      </div>

      {text ? (
        <>
          <AbilityText
            text={text.description}
            level={level}
            variables={text.variables}
            constants={text.constants}
            scaledVariableNames={text.scaled}
            rarity={rarity}
            unitName={unitName}
            factionId={factionId}
            highlightValues
            className="text-[15px] leading-[1.55]"
          />
          {level < maxLevel && changing.length > 0 ? (
            <p
              className="text-sm text-muted-foreground"
              data-testid={`${testId}-next`}
            >
              {t("unit.ability.nextLevel", { level: level + 1 })}{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {changing
                  .map(
                    (entry) =>
                      `${formatAt(entry.values, level - 1)} → ${formatAt(entry.values, level)}`
                  )
                  .join(" · ")}
              </span>
              {yours ? ` · ${yours}` : null}
            </p>
          ) : null}
          {charted.length > 0 || constant.length > 0 ? (
            <div className="flex flex-col gap-3 border-t pt-3">
              {charted.map((entry) => {
                const label = entry.label || entry.names.join("–")
                const { from, to } = describeSeries(entry.values, locale)
                return (
                  <LevelChart
                    key={entry.names.join("-")}
                    title={t("unit.ability.chartTitle", { label })}
                    points={entry.values}
                    xLabels={xLabels}
                    xTicks={levelTicks(maxLevel)}
                    fromZero={chartFromZero}
                    markerIndex={level - 1}
                    onSelect={
                      levelControl
                        ? undefined
                        : (index) => onLevelChange(index + 1)
                    }
                    caption={t("unit.ability.chartCaption", {
                      label,
                      from,
                      to,
                      maxLevel,
                    })}
                    locale={locale}
                    data-testid={`${testId}-chart-${entry.names[0]}`}
                  />
                )
              })}
              {constant.map((entry) => (
                <p
                  key={entry.names.join("-")}
                  className="text-xs text-muted-foreground"
                >
                  {t("unit.ability.constant", {
                    label: entry.label || entry.names.join("–"),
                    value: formatAt(entry.values, 0),
                  })}
                </p>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <p
          className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground"
          data-testid={`${testId}-missing-text`}
        >
          {t("unit.ability.missingText")}
        </p>
      )}
    </section>
  )
}
