import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  chestIcon,
  type ChestTier,
  type NpcStorageModel,
} from "@workspace/game-catalog"
import { Badge } from "@workspace/ui/components/badge"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import { NpcLevelBadge, NpcPortrait, useNpcLabels } from "@/entities/npc"
import { EntityIcon } from "@/shared/ui"

import {
  enemyStatRow,
  enhancementSubject,
  type Incursion,
  type IncursionBattle,
  type IncursionNode,
} from "../../model/incursions.model"
import { MAX_STARS } from "../../model/incursion-progress.model"
import { IncursionRewards } from "./incursion-rewards"

const CHEST_TIERS: Record<string, ChestTier> = {
  Bronze: "bronze",
  Silver: "silver",
  Gold: "gold",
  Diamond: "diamond",
}

const STARS = [1, 2, 3] as const
const STAR_CHOICES = [0, 1, 2, 3] as const

/** The player's stars on a battle and how to change them; absent while signed out. */
export type BattleStarsProgress = {
  stars: number
  onChange: (stars: number) => void
}

function StarsPicker({
  label,
  testId,
  progress,
}: {
  label: string
  testId: string
  progress: BattleStarsProgress
}) {
  const { t } = useTranslation("incursions")
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {t("progress.starsEarned")}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label={t("progress.starsFor", { battle: label })}
        value={String(progress.stars)}
        onValueChange={(value) => {
          if (value) progress.onChange(Number(value))
        }}
      >
        {STAR_CHOICES.map((count) => (
          <ToggleGroupItem
            key={count}
            value={String(count)}
            aria-label={t("progress.stars", { count })}
            data-testid={`${testId}-stars-${count}`}
          >
            {count}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

function BattleBody({
  battle,
  npcsById,
  stars,
}: {
  battle: IncursionBattle
  npcsById: ReadonlyMap<string, NpcStorageModel>
  /** Stars already earned, whose one-time rewards are shown as claimed. */
  stars: number
}) {
  const { t } = useTranslation("incursions")
  const { variationName } = useNpcLabels()
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        {battle.difficultyMultiplier !== 100 ? (
          <span>
            {t("battle.difficulty", { value: battle.difficultyMultiplier })}
          </span>
        ) : null}
        {battle.lightningVictoryTurns ? (
          <span>
            {t("battle.lightningVictory", {
              turns: battle.lightningVictoryTurns,
            })}
          </span>
        ) : null}
      </div>
      <ul
        className="flex flex-wrap gap-2"
        aria-label={t("battle.enemies")}
        data-testid="incursion-battle-enemies"
      >
        {battle.enemies.map((enemy) => {
          const npc = npcsById.get(enemy.npcId)
          const name = variationName(enemy.npcId, npc?.name ?? enemy.npcId)
          const row = npc ? enemyStatRow(npc, enemy.level) : undefined
          return (
            <li
              key={`${enemy.npcId}:${enemy.level}`}
              className="flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-xs"
              title={name}
            >
              <NpcPortrait
                variationId={enemy.npcId}
                name={name}
                className="size-7"
              />
              <span className="tabular-nums">×{enemy.count}</span>
              {row ? <NpcLevelBadge row={row} /> : null}
            </li>
          )
        })}
      </ul>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
        {battle.baseRewards.length > 0 ? (
          <>
            <dt className="text-xs text-muted-foreground">
              {t("battle.everyWin")}
            </dt>
            <dd>
              <IncursionRewards rewards={battle.baseRewards} />
            </dd>
          </>
        ) : null}
        {STARS.map((count, at) => (
          <div
            key={count}
            className={cn("contents", count <= stars && "[&>*]:opacity-50")}
            data-claimed={count <= stars || undefined}
          >
            <dt className="text-xs text-muted-foreground">
              {count <= stars
                ? t("battle.starsClaimed", { count })
                : t("battle.stars", { count })}
            </dt>
            <dd>
              <IncursionRewards rewards={[battle.starRewards[at] ?? ""]} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** One run-map node: a battle with its enemies and rewards, an enhancement pick or a chest. */
export function IncursionNodeCard({
  node,
  incursion,
  battlesById,
  npcsById,
  after,
  progress,
}: {
  node: IncursionNode
  incursion: Incursion
  battlesById: ReadonlyMap<string, IncursionBattle>
  npcsById: ReadonlyMap<string, NpcStorageModel>
  /** The names of the nodes this one follows, when the previous step branches. */
  after?: string
  /** The player's stars, for a battle node while signed in. */
  progress?: BattleStarsProgress
}) {
  const { t } = useTranslation(["incursions", "traits"])
  const battle = node.battleId ? battlesById.get(node.battleId) : undefined
  const enhancement = node.enhancementId
    ? incursion.enhancements[node.enhancementId]
    : undefined

  let title: string
  let body: ReactNode = null
  if (node.kind === "battle" && battle) {
    title = t("battle.name", { name: node.name })
    body = (
      <>
        {progress ? (
          <StarsPicker
            label={title}
            testId={`incursion-node-${node.index}`}
            progress={progress}
          />
        ) : null}
        <BattleBody
          battle={battle}
          npcsById={npcsById}
          stars={progress?.stars ?? 0}
        />
      </>
    )
  } else if (node.kind === "enhancement" && enhancement) {
    const subject = enhancementSubject(enhancement)
    title = t(`enhancement.type.${enhancement.type}` as never, {
      defaultValue: enhancement.type,
      count: enhancement.unitAmount ?? 1,
      units: enhancement.unitAmount ?? 1,
      subject: subject ? t(`traits:${subject}`, { defaultValue: subject }) : "",
    })
  } else if (node.kind === "chest" && node.chest) {
    const type = node.chest.type
    title = t("chest.title", {
      type: t(`chest.type.${type}` as never, { defaultValue: type }),
    })
    body = <IncursionRewards rewards={node.chest.rewards} />
  } else {
    title = node.name
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border p-3",
        battle?.challenge && "border-amber-500/60",
        node.kind !== "battle" && "bg-muted/40"
      )}
      data-testid={`incursion-node-${node.index}`}
      data-kind={node.kind}
    >
      <div className="flex flex-wrap items-center gap-2">
        {node.kind === "chest" && node.chest ? (
          <EntityIcon
            src={chestIcon(CHEST_TIERS[node.chest.type] ?? "bronze")}
            alt=""
            className="size-6"
          />
        ) : null}
        <span className="text-sm font-medium">{title}</span>
        {node.kind === "enhancement" ? (
          <Badge variant="outline">{t("enhancement.title")}</Badge>
        ) : null}
        {enhancement?.stacks ? (
          <Badge variant="secondary">{t("enhancement.stacks")}</Badge>
        ) : null}
        {battle?.challenge ? <Badge>{t("battle.challenge")}</Badge> : null}
        {battle && progress && progress.stars >= MAX_STARS ? (
          <Badge
            variant="secondary"
            title={t("progress.raidableHint")}
            data-testid={`incursion-node-${node.index}-raidable`}
          >
            {t("progress.raidable")}
          </Badge>
        ) : null}
        {after ? (
          <span className="text-xs text-muted-foreground">
            {t("map.after", { names: after })}
          </span>
        ) : null}
      </div>
      {body}
    </div>
  )
}
