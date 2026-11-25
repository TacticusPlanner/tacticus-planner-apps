import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { guildWarTokenIcon, guildWarZoneIcon } from "@workspace/game-catalog"

import { TeamUnitPortrait } from "@/entities/team"
import { EntityIcon, RarityIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { GuildWarSeason } from "../../lib/season"
import type { historyTotals, WinRate } from "../../model/history-totals"
import { useGuildWarNames } from "../../model/use-guild-war-names"

type Totals = ReturnType<typeof historyTotals>

const percent = (rate: WinRate) => Math.round((rate.won / rate.decided) * 100)

function RateText({ rate, count }: { rate: WinRate; count?: number }) {
  const { t } = useTranslation("guildWar")
  return (
    <span className="shrink-0 text-sm tabular-nums">
      {rate.decided > 0
        ? t("history.winRate", {
            rate: percent(rate),
            count: count ?? rate.decided,
          })
        : t("history.attackCount", { count: count ?? 0 })}
    </span>
  )
}

function RateRow({ label, rate }: { label: ReactNode; rate: WinRate }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="flex min-w-0 items-center gap-1.5">{label}</span>
      <RateText rate={rate} />
    </li>
  )
}

/** One block of the totals: a heading, then its rows or a line saying there are none yet. */
function TotalsBlock({
  title,
  empty,
  testId,
  children,
}: {
  title: string
  empty: string
  testId: string
  children: ReactNode[]
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {children.length > 0 ? (
        <ul className="flex flex-col gap-1.5" data-testid={testId}>
          {children}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  )
}

function CharacterPortrait({ unitId }: { unitId: string }) {
  return (
    <TeamUnitPortrait unit={{ kind: "character", unitId, owned: undefined }} />
  )
}

/** The loaded wars at a glance: attacks (tokens spent), won, lost and units lost. */
function Overall({ overall }: { overall: Totals["overall"] }) {
  const { t } = useTranslation("guildWar")
  const stats = [
    {
      key: "attacks",
      label: t("history.overall.attacks"),
      value: overall.attacks,
      icon: <EntityIcon alt="" size="icon" src={guildWarTokenIcon()} />,
    },
    { key: "won", label: t("history.overall.won"), value: overall.won },
    { key: "lost", label: t("history.overall.lost"), value: overall.lost },
    {
      key: "unitsLost",
      label: t("history.overall.unitsLost"),
      value: overall.unitsLost,
    },
  ]
  return (
    <dl
      className="flex flex-wrap gap-x-8 gap-y-3 md:col-span-3"
      data-testid="guild-war-overall"
    >
      {stats.map((stat) => (
        <div className="flex flex-col gap-0.5" key={stat.key}>
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          <dd className="flex items-center gap-1.5 text-xl font-semibold tabular-nums">
            {stat.icon}
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * The totals across the loaded wars: the overall results; win rates by zone tier, zone and slot
 * rarity; the characters used most; the lineups used more than once; and the enemy characters met
 * most in lost attacks.
 */
export function HistoryTotals({
  totals,
  seasons,
}: {
  totals: Totals
  seasons: readonly GuildWarSeason[]
}) {
  const { t } = useTranslation(["guildWar", "progression"])
  const { tierName, zoneName } = useGuildWarNames()
  const unitName = useUnitName()
  const zoneOf = (zoneId: string) => {
    const season = seasons.find((entry) =>
      entry.zones.some((zone) => zone.id === zoneId)
    )
    return {
      season,
      visualId: season?.zones.find((zone) => zone.id === zoneId)?.visualId,
    }
  }
  return (
    <section
      aria-labelledby="guild-war-totals-heading"
      className="grid gap-x-6 gap-y-5 rounded-xl border bg-card p-4 md:grid-cols-3"
      data-testid="guild-war-totals"
    >
      <h2 className="sr-only" id="guild-war-totals-heading">
        {t("history.totals")}
      </h2>
      <Overall overall={totals.overall} />
      <TotalsBlock
        empty={t("history.noResults")}
        testId="guild-war-by-tier"
        title={t("history.byTier")}
      >
        {totals.byTier.map((rate) => (
          <RateRow key={rate.key} label={tierName(rate.key)} rate={rate} />
        ))}
      </TotalsBlock>
      <TotalsBlock
        empty={t("history.noResults")}
        testId="guild-war-by-zone"
        title={t("history.byZone")}
      >
        {totals.byZone.map((rate) => {
          const { season, visualId } = zoneOf(rate.key)
          return (
            <RateRow
              key={rate.key}
              label={
                <>
                  <EntityIcon
                    alt=""
                    className="object-contain"
                    size="icon-md"
                    src={visualId ? guildWarZoneIcon(visualId) : undefined}
                  />
                  <span className="truncate">{zoneName(season, rate.key)}</span>
                </>
              }
              rate={rate}
            />
          )
        })}
      </TotalsBlock>
      <TotalsBlock
        empty={t("history.noResults")}
        testId="guild-war-by-rarity"
        title={t("history.byRarity")}
      >
        {totals.byRarity.map((rate) => (
          <RateRow
            key={rate.key}
            label={
              <>
                <RarityIcon rarity={rate.key} />
                {t(`progression:rarities.${rate.key}`)}
              </>
            }
            rate={rate}
          />
        ))}
      </TotalsBlock>
      <TotalsBlock
        empty={t("history.noCharacters")}
        testId="guild-war-characters"
        title={t("history.characters")}
      >
        {totals.characters.map((usage) => (
          <li
            aria-label={unitName("Character", usage.key)}
            className="flex items-center justify-between gap-3"
            key={usage.key}
          >
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <CharacterPortrait unitId={usage.key} />
              <span className="truncate">
                {unitName("Character", usage.key)}
              </span>
            </span>
            <RateText count={usage.count} rate={usage} />
          </li>
        ))}
      </TotalsBlock>
      <TotalsBlock
        empty={t("history.noLineups")}
        testId="guild-war-lineups"
        title={t("history.lineups")}
      >
        {totals.lineups.map((lineup) => (
          <li
            className="flex items-center justify-between gap-2"
            key={lineup.key}
          >
            <ul className="flex flex-wrap gap-1">
              {lineup.characterIds.map((id) => (
                <li aria-label={unitName("Character", id)} key={id}>
                  <CharacterPortrait unitId={id} />
                </li>
              ))}
            </ul>
            <RateText count={lineup.count} rate={lineup} />
          </li>
        ))}
      </TotalsBlock>
      <TotalsBlock
        empty={t("history.noEnemies")}
        testId="guild-war-enemies"
        title={t("history.enemies")}
      >
        {totals.enemies.map((enemy) => (
          <li
            aria-label={unitName("Character", enemy.key)}
            className="flex items-center justify-between gap-3"
            key={enemy.key}
          >
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <CharacterPortrait unitId={enemy.key} />
              <span className="truncate">
                {unitName("Character", enemy.key)}
              </span>
            </span>
            <span className="shrink-0 text-sm tabular-nums">
              {t("history.lossCount", { count: enemy.count })}
            </span>
          </li>
        ))}
      </TotalsBlock>
    </section>
  )
}
