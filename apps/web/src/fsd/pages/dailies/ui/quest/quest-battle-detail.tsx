import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { battleBoardImage } from "@workspace/game-catalog"
import type { UpgradeStorageModel } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"

import {
  battleMax,
  isBoardPickup,
  ObjectiveChips,
  type QuestBattle,
  type QuestScoring,
  type QuestObjectiveBadge,
  type QuestTierCap,
} from "@/features/quest-event"
import type { NpcRecord } from "@/entities/npc"
import { UpgradeIcon } from "@/shared/ui"
import {
  BoardMap,
  buildEnemyTile,
  EnemyList,
  type EnemyNpcs,
} from "@/widgets/battle-preview"

import type { QuestDropNeed } from "../../model/quest-drop-need"

/**
 * One quest battle in full (spec: quest-event-battle-detail): the header with the lineup rules (slots,
 * the tier's rarity cap, Lightning Victory turns, enemy power, maximum points), the board, the enemies
 * apart from the board pickups, the objective chips, and the drop with its odds and goal need.
 */
export function QuestBattleDetail({
  battle,
  heroName,
  cap,
  npcs,
  retryNpcs,
  upgrade,
  need,
  isMobile,
  boardOpen,
  onBoardOpenChange,
  team,
  badges,
  scoring,
}: {
  battle: QuestBattle
  heroName: string
  cap: QuestTierCap
  npcs: EnemyNpcs
  retryNpcs: (() => void) | undefined
  upgrade: UpgradeStorageModel | undefined
  need: QuestDropNeed
  isMobile: boolean
  boardOpen: boolean
  onBoardOpenChange: (open: boolean) => void
  /** The suggested team, under the header (desktop); null where the page shows it elsewhere. */
  team: ReactNode
  badges: readonly QuestObjectiveBadge[] | undefined
  scoring: QuestScoring
}) {
  const { t, i18n } = useTranslation(["quest", "progression", "upgrades"])
  const number = new Intl.NumberFormat(i18n.language)
  const percent = new Intl.NumberFormat(i18n.language, {
    style: "percent",
    maximumFractionDigits: 0,
  })
  const npcOf = (id: string): NpcRecord | undefined =>
    typeof npcs === "string" ? undefined : npcs.get(id)
  const pickups = battle.enemies.filter((enemy) =>
    isBoardPickup(enemy.id, npcOf(enemy.id))
  )
  const enemies = battle.enemies.filter(
    (enemy) => !isBoardPickup(enemy.id, npcOf(enemy.id))
  )
  const enemyCount = enemies.reduce((sum, enemy) => sum + enemy.count, 0)
  const tiles = (list: typeof battle.enemies, prefix: string) =>
    list.map((enemy, index) =>
      buildEnemyTile(enemy, `${prefix}-${index}`, npcs)
    )
  const tierName = t(`progression:rarities.${battle.tier}`)
  const stars = cap.progression.slice(cap.progression.indexOf(":") + 1)
  const capValues = {
    rarity: tierName,
    stars: t(`progression:stars.${stars}` as never, { defaultValue: stars }),
    rank: t(`progression:ranks.${cap.rank}` as never, {
      defaultValue: cap.rank,
    }),
    ability: cap.abilityLevel,
    item: cap.itemLevel ?? 0,
  }
  const dropName = t(`upgrades:${battle.loot.upgradeId}`, {
    defaultValue: upgrade?.label ?? battle.loot.upgradeId,
  })
  const odds =
    battle.loot.chanceDenominator > 0
      ? battle.loot.chanceNumerator / battle.loot.chanceDenominator
      : 0

  const board = (
    <BoardMap
      alt={t("quest:detail.boardAlt", { number: battle.number })}
      disclosureId="quest-battle-board"
      isMobile={isMobile}
      mapId={battle.boardId}
      onOpenChange={onBoardOpenChange}
      open={boardOpen}
      src={battleBoardImage(battle.boardId)}
      toggleLabel={t("quest:detail.board")}
    />
  )
  const enemyList = (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-2" data-testid="quest-battle-enemies">
        <h4 className="text-sm font-semibold">
          {t("quest:detail.enemies")}{" "}
          <span
            className="font-normal text-muted-foreground"
            data-testid="quest-battle-enemy-count"
          >
            {t("quest:detail.enemyCount", {
              count: enemyCount,
              formatted: number.format(enemyCount),
            })}
          </span>
        </h4>
        <EnemyList isMobile={isMobile} tiles={tiles(enemies, "enemy")} />
      </div>
      {pickups.length > 0 ? (
        <div className="flex flex-col gap-2" data-testid="quest-battle-pickups">
          <h4 className="text-sm font-semibold">{t("quest:detail.pickups")}</h4>
          <EnemyList
            isMobile={isMobile}
            tiles={tiles(pickups, "pickup").map((tile) => ({
              ...tile,
              row: undefined,
              level: "resolved" as const,
            }))}
          />
        </div>
      ) : null}
    </div>
  )

  return (
    <article
      aria-labelledby="quest-battle-detail-title"
      className="flex min-w-0 flex-col gap-4"
      data-battle={battle.number}
      data-testid="quest-battle-detail"
    >
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold" id="quest-battle-detail-title">
          {t("quest:detail.title", { number: battle.number, tier: tierName })}
        </h3>
        <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
          <li data-testid="quest-battle-slots-line">
            {t("quest:detail.slots", {
              count: battle.deploySlots,
              hero: heroName,
            })}
          </li>
          <li data-testid="quest-battle-cap">
            {cap.itemLevel === null
              ? t("quest:detail.capNoItems", capValues)
              : t("quest:detail.cap", capValues)}
          </li>
          <li>
            {t("quest:detail.lightning", {
              count: battle.lightningVictoryTurns,
            })}
          </li>
          <li data-testid="quest-battle-power">
            {battle.power === null || battle.power === undefined
              ? t("quest:detail.powerUnknown")
              : t("quest:detail.power", { power: number.format(battle.power) })}
          </li>
          <li data-testid="quest-battle-max">
            {t("quest:detail.maxPoints", {
              points: number.format(battleMax(battle, scoring)),
            })}
          </li>
        </ul>
      </header>
      {team}
      <ObjectiveChips
        badges={badges}
        heroName={heroName}
        objectives={battle.objectives}
      />
      {retryNpcs ? (
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="quest-npcs-error"
        >
          <p className="text-sm text-destructive">
            {t("quest:detail.npcsError")}
          </p>
          <Button onClick={retryNpcs} size="sm" variant="outline">
            {t("quest:status.retry")}
          </Button>
        </div>
      ) : null}
      {isMobile ? (
        <>
          {board}
          {enemyList}
        </>
      ) : (
        <div className="flex min-w-0 items-start gap-4">
          {board}
          <div className="min-w-0 flex-1">{enemyList}</div>
        </div>
      )}
      <section
        className="flex flex-col gap-2 rounded-xl border p-3"
        data-testid="quest-battle-drop"
      >
        <h4 className="text-sm font-semibold">{t("quest:detail.drop")}</h4>
        <div className="flex items-center gap-3">
          <UpgradeIcon
            className="size-10"
            id={battle.loot.upgradeId}
            rarity={upgrade?.rarity}
          />
          <div className="min-w-0">
            <p className="truncate font-medium">{dropName}</p>
            <p
              className="text-sm text-muted-foreground tabular-nums"
              data-testid="quest-battle-odds"
            >
              {t("quest:detail.odds", {
                numerator: battle.loot.chanceNumerator,
                denominator: battle.loot.chanceDenominator,
                percent: percent.format(odds),
              })}
            </p>
          </div>
        </div>
        <DropNeed need={need} />
        <p className="text-xs text-muted-foreground">{t("quest:detail.jar")}</p>
      </section>
    </article>
  )
}

function DropNeed({ need }: { need: QuestDropNeed }) {
  const { t, i18n } = useTranslation("quest")
  const number = new Intl.NumberFormat(i18n.language)
  if (need.status === "loading") return null
  if (need.status === "error") {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="quest-drop-need-error"
      >
        {t("detail.needError")}
      </p>
    )
  }
  if (need.status === "none") {
    return (
      <p className="text-sm" data-testid="quest-drop-need">
        {t("detail.noGoal")}
      </p>
    )
  }
  return (
    <div
      className="flex flex-col gap-0.5 text-sm"
      data-testid="quest-drop-need"
    >
      <p className="font-medium tabular-nums">
        {t("detail.have", {
          have: number.format(need.have),
          need: number.format(need.need),
        })}
      </p>
      {need.units.length > 0 ? (
        <p className="text-muted-foreground">
          {t("detail.neededBy")}: {need.units.join(", ")}
        </p>
      ) : null}
    </div>
  )
}
