import { useTranslation } from "react-i18next"

import { EnemyList } from "@/widgets/battle-preview"

import type { BattlePreviewViewModel } from "./battles.view-model"

/** The selected battle's header: number, enemy power and total enemy count, formatted for the UI
 *  language. */
export function BattleHeader({ battle }: { battle: BattlePreviewViewModel }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  return (
    <div
      className="flex flex-wrap items-baseline gap-x-4 gap-y-1"
      data-testid="battle-header"
    >
      <h3 className="font-semibold" data-testid="battle-title">
        {t("battles.battleTitle", { number: battle.number })}
      </h3>
      <p className="text-sm text-muted-foreground">
        {t("battles.enemyPower")}{" "}
        <span
          className="font-medium text-foreground tabular-nums"
          data-testid="battle-power"
        >
          {number.format(battle.power)}
        </span>
      </p>
      <p
        className="text-sm text-muted-foreground tabular-nums"
        data-testid="battle-enemy-total"
      >
        {t("battles.enemyCount", {
          count: battle.enemyCount,
          formatted: number.format(battle.enemyCount),
        })}
      </p>
    </div>
  )
}

/** The battle's waves in round order, each with its round, power and enemy tiles. */
export function BattleWaves({
  battle,
  isMobile,
}: {
  battle: BattlePreviewViewModel
  isMobile: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  return (
    <ol className="flex min-w-0 flex-col gap-3" data-testid="battle-waves">
      {battle.waves.map((wave) => (
        <li
          className="flex min-w-0 flex-col gap-2 rounded-xl border p-3"
          data-testid="battle-wave"
          key={wave.number}
        >
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-semibold">
              {t("battles.wave", { number: wave.number })}
            </span>
            <span className="text-muted-foreground">
              {t("battles.round", { round: wave.round })}
            </span>
            <span className="text-muted-foreground">
              {t("battles.wavePower", { power: number.format(wave.power) })}
            </span>
          </p>
          {wave.enemies.length === 0 ? (
            <p
              className="text-sm text-muted-foreground"
              data-testid="battle-wave-empty"
            >
              {t("battles.noEnemies")}
            </p>
          ) : (
            <EnemyList isMobile={isMobile} tiles={wave.enemies} />
          )}
        </li>
      ))}
    </ol>
  )
}
