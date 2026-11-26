import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Medal,
} from "lucide-react"
import { npcPortrait, powerIcon, rarityIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { NpcPortrait, useNpcLabels, useNpcsById } from "@/entities/npc"
import { EntityIcon, HintTrigger } from "@/shared/ui"
import { EnemyList, buildEnemyTile } from "@/widgets/battle-preview"
import type { EnemyNpcs } from "@/widgets/battle-preview"
import { RewardText, useEventRewardFormat } from "@/widgets/event-rewards"

import { useSurvivalContext } from "../model/survival-context"
import type { SurvivalWave } from "../model/survival-event"
import { killScoreIndex, waveGroups } from "../model/wave-view"
import type { WaveGroup, WaveRow } from "../model/wave-view"

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
                compact
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

/** Every enemy the group's waves field, as portraits with their total count: the folded view. */
function GroupEnemies({ group }: { group: WaveGroup }) {
  const { t } = useTranslation("survival")
  const { variationName } = useNpcLabels()
  const npcsRead = useNpcsById()
  const npcs = npcsRead.status === "ready" ? npcsRead.data : undefined
  return (
    <ul
      aria-label={t("enemies.groupEnemies")}
      className="flex flex-wrap gap-2"
      data-testid="survival-group-enemies"
    >
      {group.enemies.map((enemy) => {
        const name = variationName(
          enemy.npcId,
          npcs?.get(enemy.npcId)?.name ?? enemy.npcId
        )
        const label = t("enemies.enemyCount", { name, count: enemy.count })
        return (
          <li key={enemy.npcId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  aria-label={label}
                  className="relative inline-flex"
                  role="img"
                >
                  <NpcPortrait
                    name=""
                    size="portrait-sm"
                    variationId={enemy.npcId}
                  />
                  <span className="absolute -right-1 -bottom-1 rounded-full border bg-background px-1 text-xs font-semibold tabular-nums">
                    {enemy.count}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          </li>
        )
      })}
    </ul>
  )
}

/** The waves at one rarity cap: a heading that folds them, the enemies when folded, the waves when open. */
function WaveGroupSection({
  group,
  open,
  onToggle,
  children,
}: {
  group: WaveGroup
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const { t } = useTranslation(["survival", "progression"])
  const first = group.rows[0]?.wave.wave ?? 0
  const last = group.rows.at(-1)?.wave.wave ?? first
  const rarity = t(`progression:rarities.${group.rarity}` as never, {
    defaultValue: group.rarity,
  })
  const id = `survival-group-${first}`
  return (
    <li
      className="flex flex-col gap-3 border-t-2 border-primary/40 pt-3"
      data-testid={id}
    >
      <h3>
        <button
          aria-controls={`${id}-content`}
          aria-expanded={open}
          className="flex min-h-11 w-full items-center gap-2 rounded-md interactive-surface text-left"
          onClick={onToggle}
          type="button"
        >
          <ChevronRight
            aria-hidden
            className={`size-icon-sm shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
          />
          <EntityIcon
            alt=""
            size="icon-md"
            src={rarityIcon(group.rarity as Rarity)}
          />
          <span className="text-base font-semibold">
            {t("survival:enemies.rarityCap", { rarity })}
          </span>
          <span className="text-sm text-muted-foreground">
            {first === last
              ? t("survival:enemies.wave", { wave: first })
              : t("survival:enemies.waves", { from: first, to: last })}
          </span>
        </button>
      </h3>
      <div id={`${id}-content`}>
        {open ? (
          <ol className="flex flex-col gap-3">{children}</ol>
        ) : (
          <GroupEnemies group={group} />
        )}
      </div>
    </li>
  )
}

/** A group's key: its first wave. */
const firstWave = (group: WaveGroup) => group.rows[0]?.wave.wave ?? 0

/** Each medal's rewards, by medal. */
function useMedalRewards() {
  const { event } = useSurvivalContext()
  return new Map(
    event.scoring.medals.map((medal) => [medal.medal, medal.rewards])
  )
}

/**
 * Enemies (plan option 9 and 11): the waves in folding groups, one per rarity cap (folded, a group
 * shows every enemy it fields as portraits with their totals; "Expand all" opens them all), and one
 * card per wave with its round, power, score and the medal it earns, the enemies (each opens its card, with the points it is worth), a clone wave's note, and what
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
  const groups = waveGroups(event)
  // Folded rarity groups, by their first wave; every group starts folded.
  const [opened, setOpened] = useState<ReadonlySet<number>>(() => new Set())
  const allOpen = groups.every((group) => opened.has(firstWave(group)))
  const toggleAll = () =>
    setOpened(allOpen ? new Set() : new Set(groups.map(firstWave)))
  const toggle = (wave: number) =>
    setOpened((current) => {
      const next = new Set(current)
      if (next.has(wave)) next.delete(wave)
      else next.add(wave)
      return next
    })
  return (
    <section className="flex flex-col gap-3" data-testid="survival-waves">
      <div className="flex flex-wrap items-start justify-between gap-2">
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
        <Button
          data-testid="survival-expand-all"
          onClick={toggleAll}
          size="sm"
          variant="outline"
        >
          {allOpen ? (
            <ChevronsDownUp data-icon="inline-start" />
          ) : (
            <ChevronsUpDown data-icon="inline-start" />
          )}
          {allOpen ? t("enemies.collapseAll") : t("enemies.expandAll")}
        </Button>
      </div>
      <ol className="flex flex-col gap-4">
        {groups.map((group) => (
          <WaveGroupSection
            group={group}
            key={firstWave(group)}
            onToggle={() => toggle(firstWave(group))}
            open={opened.has(firstWave(group))}
          >
            {group.rows.map((row) => (
              <WaveCard
                isMobile={isMobile}
                key={row.wave.wave}
                kills={kills}
                medalRewards={medalRewards}
                npcs={npcs}
                row={row}
              />
            ))}
          </WaveGroupSection>
        ))}
      </ol>
    </section>
  )
}
