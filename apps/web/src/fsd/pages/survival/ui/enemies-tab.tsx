import { useTranslation } from "react-i18next"
import { Medal } from "lucide-react"
import { npcPortrait, powerIcon } from "@workspace/game-catalog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useNpcLabels, useNpcsById } from "@/entities/npc"
import { EntityIcon, HintTrigger } from "@/shared/ui"
import { EnemyList, buildEnemyTile } from "@/widgets/battle-preview"
import type { EnemyNpcs } from "@/widgets/battle-preview"
import { RewardText, useEventRewardFormat } from "@/widgets/event-rewards"

import { useSurvivalContext } from "../model/survival-context"
import type { SurvivalWave } from "../model/survival-event"
import { killScoreIndex, waveRows } from "../model/wave-view"
import type { WaveRow } from "../model/wave-view"

/** "60.1B" with the full number in a tooltip; exact below 10,000. */
function Power({ value }: { value: number }) {
  const { t, i18n } = useTranslation("survival")
  const exact = new Intl.NumberFormat(i18n.language).format(value)
  const shown =
    value >= 10_000
      ? new Intl.NumberFormat(i18n.language, {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(value)
      : exact
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={t("enemies.power", { power: exact })}
          className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums"
          role="img"
        >
          <EntityIcon alt="" size="icon" src={powerIcon()} />
          {shown}
        </span>
      </TooltipTrigger>
      <TooltipContent>{t("enemies.power", { power: exact })}</TooltipContent>
    </Tooltip>
  )
}

/** What changes once the wave is cleared: the enemies' rarity and the power-ups granted. */
function AfterWave({ wave }: { wave: SurvivalWave }) {
  const { t } = useTranslation(["survival", "progression"])
  const { variationName } = useNpcLabels()
  const parts = [
    ...(wave.enemyRarityOnClear
      ? [
          <span key="rarity">
            {t("survival:enemies.rarityUp", {
              rarity: t(
                `progression:rarities.${wave.enemyRarityOnClear}` as never,
                { defaultValue: wave.enemyRarityOnClear }
              ),
            })}
          </span>,
        ]
      : []),
    ...wave.powerUpsOnClear.map((powerUp) => (
      <span className="inline-flex items-center gap-1" key={powerUp.id}>
        <EntityIcon
          alt=""
          size="icon"
          src={npcPortrait(powerUp.npcId ?? powerUp.id)}
        />
        {variationName(powerUp.id, powerUp.id)}
        {powerUp.count > 1 ? (
          <span className="tabular-nums">×{powerUp.count}</span>
        ) : null}
      </span>
    )),
  ]
  if (parts.length === 0) return null
  return (
    <p
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
      data-testid="survival-after-wave"
    >
      <span className="font-medium text-foreground">
        {t("survival:enemies.afterWave")}
      </span>
      {parts.flatMap((part, index) =>
        index === 0
          ? [part]
          : [
              <span aria-hidden="true" key={`dot-${index}`}>
                ·
              </span>,
              part,
            ]
      )}
    </p>
  )
}

function WaveCard({
  row,
  npcs,
  kills,
  medalRewards,
  isMobile,
}: {
  row: WaveRow
  npcs: EnemyNpcs
  kills: ReadonlyMap<string, number>
  medalRewards: ReturnType<typeof useMedalRewards>
  isMobile: boolean
}) {
  const { t } = useTranslation("survival")
  const format = useEventRewardFormat()
  const { wave, medal, final } = row
  const tiles = wave.enemies.map((enemy, index) =>
    buildEnemyTile(
      { id: enemy.npcId, ladderIndex: enemy.statsIndex, count: enemy.count },
      `${wave.wave}-${index}`,
      npcs
    )
  )
  const title = t("enemies.wave", { wave: wave.wave })
  return (
    <li
      className="flex flex-col gap-2 rounded-lg border bg-card p-3"
      data-final={final ? "true" : undefined}
      data-testid={`survival-wave-${wave.wave}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold">
          {final ? (
            <HintTrigger
              hint={t("enemies.finalHint", { wave: wave.wave })}
              label={`${t("enemies.final")}: ${title}`}
            >
              {t("enemies.final")}
            </HintTrigger>
          ) : (
            title
          )}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t("enemies.round", { round: wave.round })}
        </span>
        {wave.cloneHealthPct === undefined ? (
          <Power value={wave.power} />
        ) : null}
        <span className="text-xs text-muted-foreground tabular-nums">
          {t("enemies.score", { score: format.number(wave.score) })}
        </span>
        {medal ? (
          <span
            className="inline-flex items-center gap-1 text-xs"
            data-testid="survival-wave-medal"
          >
            <Medal aria-hidden className="size-icon-sm text-primary" />
            <span className="font-medium">
              {t(`medals.${medal}` as never, { defaultValue: medal })}
            </span>
            {medalRewards.get(medal) ? (
              <RewardText
                format={format}
                rewards={medalRewards.get(medal) ?? []}
              />
            ) : null}
          </span>
        ) : null}
      </div>
      {wave.cloneHealthPct === undefined ? (
        <EnemyList
          detailExtra={(tile) => {
            // Tiles are keyed `<wave>-<index>` in the wave's enemy order.
            const enemy = wave.enemies[Number(tile.key.split("-", 2)[1])]
            const points = enemy
              ? kills.get(`${enemy.npcId}:${enemy.statsIndex}`)
              : undefined
            return points === undefined ? null : (
              <p className="mt-2 text-sm">
                {t("enemies.killPoints", { points: format.number(points) })}
              </p>
            )
          }}
          isMobile={isMobile}
          tiles={tiles}
        />
      ) : (
        <p className="text-sm" data-testid="survival-clone-wave">
          {t("enemies.clone", { pct: wave.cloneHealthPct })}
        </p>
      )}
      <AfterWave wave={wave} />
    </li>
  )
}

/** Each medal's rewards, by medal. */
function useMedalRewards() {
  const { event } = useSurvivalContext()
  return new Map(
    event.scoring.medals.map((medal) => [medal.medal, medal.rewards])
  )
}

/**
 * Enemies (plan option 9 and 11): one card per wave with its round, power, score and the medal it
 * earns, the enemies (each opens its card, with the points it is worth), a clone wave's note, and what
 * the wave's clear brings. The last wave reads "Final wave": it is built to be out of reach.
 */
export function EnemiesTab() {
  const { t } = useTranslation("survival")
  const { event } = useSurvivalContext()
  const isMobile = useIsMobile()
  const format = useEventRewardFormat()
  const npcsRead = useNpcsById()
  const npcs: EnemyNpcs =
    npcsRead.status === "ready"
      ? npcsRead.data
      : npcsRead.status === "error"
        ? "unavailable"
        : "pending"
  const kills = killScoreIndex(event)
  const medalRewards = useMedalRewards()
  const { scoring } = event
  return (
    <section className="flex flex-col gap-3" data-testid="survival-waves">
      <p className="text-sm text-muted-foreground">
        {scoring.cloneWaveScore === undefined
          ? t("enemies.intro", {
              skipped: format.number(scoring.skippedTurnScore),
            })
          : t("enemies.introClone", {
              skipped: format.number(scoring.skippedTurnScore),
              clone: format.number(scoring.cloneWaveScore),
            })}
      </p>
      <ol className="flex flex-col gap-3">
        {waveRows(event).map((row) => (
          <WaveCard
            isMobile={isMobile}
            key={row.wave.wave}
            kills={kills}
            medalRewards={medalRewards}
            npcs={npcs}
            row={row}
          />
        ))}
      </ol>
    </section>
  )
}
