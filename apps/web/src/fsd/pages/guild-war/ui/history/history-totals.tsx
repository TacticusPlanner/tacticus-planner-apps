import { useTranslation } from "react-i18next"

import { TeamUnitPortrait } from "@/entities/team"
import { RarityIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { historyTotals, WinRate } from "../../model/history-totals"
import { useGuildWarNames } from "../../model/use-guild-war-names"

function RateRow({ label, rate }: { label: React.ReactNode; rate: WinRate }) {
  const { t } = useTranslation("guildWar")
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-1.5">{label}</span>
      <span className="tabular-nums">
        {t("history.winRate", {
          rate: Math.round((rate.won / rate.decided) * 100),
          count: rate.decided,
        })}
      </span>
    </li>
  )
}

/** Win rates by zone tier and slot rarity, and the most used lineups, across the loaded wars. */
export function HistoryTotals({
  totals,
}: {
  totals: ReturnType<typeof historyTotals>
}) {
  const { t } = useTranslation(["guildWar", "progression"])
  const { tierName } = useGuildWarNames()
  const unitName = useUnitName()
  return (
    <section
      aria-labelledby="guild-war-totals-heading"
      className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-3"
      data-testid="guild-war-totals"
    >
      <h2 className="sr-only" id="guild-war-totals-heading">
        {t("history.totals")}
      </h2>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("history.byTier")}</h3>
        {totals.byTier.length > 0 ? (
          <ul className="flex flex-col gap-1" data-testid="guild-war-by-tier">
            {totals.byTier.map((rate) => (
              <RateRow key={rate.key} label={tierName(rate.key)} rate={rate} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("history.noResults")}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("history.byRarity")}</h3>
        {totals.byRarity.length > 0 ? (
          <ul className="flex flex-col gap-1" data-testid="guild-war-by-rarity">
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
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("history.noResults")}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("history.lineups")}</h3>
        {totals.lineups.length > 0 ? (
          <ul className="flex flex-col gap-2" data-testid="guild-war-lineups">
            {totals.lineups.map((lineup) => (
              <li
                className="flex items-center justify-between gap-2"
                key={lineup.characterIds.join()}
              >
                <ul className="flex flex-wrap gap-1">
                  {lineup.characterIds.map((id) => (
                    <li aria-label={unitName("Character", id)} key={id}>
                      <TeamUnitPortrait
                        unit={{
                          kind: "character",
                          unitId: id,
                          owned: undefined,
                        }}
                      />
                    </li>
                  ))}
                </ul>
                <span className="shrink-0 text-sm tabular-nums">
                  {t("history.lineupCount", { count: lineup.count })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("history.noLineups")}
          </p>
        )}
      </div>
    </section>
  )
}
