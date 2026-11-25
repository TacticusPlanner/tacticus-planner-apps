import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Skull } from "lucide-react"
import {
  guildWarBuffIcon,
  guildWarZoneIcon,
  rarityIcon,
} from "@workspace/game-catalog"
import {
  progressionRarity,
  rankOrder,
  startingProgression,
} from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import { TeamUnitPortrait, capRosterUnit } from "@/entities/team"
import { formatShortDate } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { GuildWarSeason } from "../lib/season"
import type { GuildWarAttack, GuildWarLineupUnit } from "../model/types"
import { useGuildWarNames } from "../model/use-guild-war-names"

function LineupPortrait({
  unit,
  kind,
  cap,
  lost,
}: {
  unit: GuildWarLineupUnit
  kind: "character" | "mow"
  cap: GuildWarAttack["rarityCap"]
  lost: boolean
}) {
  const { t } = useTranslation("guildWar")
  const unitName = useUnitName()
  const capped = capRosterUnit(
    {
      progression: unit.progression,
      // A rank the app does not know yet (Adamantine 3) shows no badge.
      rank: rankOrder.find((rank) => rank === unit.rank),
      xpLevel: unit.xpLevel,
      abilityLevels: [unit.abilityLevels[0] ?? 0, unit.abilityLevels[1] ?? 0],
    },
    cap,
    progressionRarity
  )
  const name = unitName(kind === "mow" ? "Mow" : "Character", unit.unitId)
  return (
    <li
      aria-label={lost ? t("attack.unitLost", { name }) : name}
      className="relative flex"
      data-lost={lost ? "true" : undefined}
    >
      <TeamUnitPortrait
        className={cn(lost && "opacity-60 grayscale")}
        unit={{
          kind,
          unitId: unit.unitId,
          owned: true,
          progression: capped.progression,
          rank: capped.rank,
        }}
      />
      {lost ? (
        <Skull
          aria-hidden="true"
          className="absolute -top-1 -left-1 size-icon-sm rounded-full bg-background p-0.5 text-destructive"
        />
      ) : null}
    </li>
  )
}

/** An attack's lineup as logged, shown at the cap it was logged at, the units lost greyed out. */
function AttackLineup({ attack }: { attack: GuildWarAttack }) {
  const { t } = useTranslation("guildWar")
  const lost = new Set(attack.lostUnitIds ?? [])
  return (
    <ul aria-label={t("attack.lineup")} className="flex flex-wrap gap-1">
      {attack.characters.map((unit) => (
        <LineupPortrait
          cap={attack.rarityCap}
          key={unit.unitId}
          kind="character"
          lost={lost.has(unit.unitId)}
          unit={unit}
        />
      ))}
      {attack.mow ? (
        <LineupPortrait
          cap={attack.rarityCap}
          kind="mow"
          lost={lost.has(attack.mow.unitId)}
          unit={attack.mow}
        />
      ) : null}
    </ul>
  )
}

/** "Won · 1 lost", "Lost" or "No result". */
function AttackResultBadge({ attack }: { attack: GuildWarAttack }) {
  const { t } = useTranslation("guildWar")
  const lost = attack.lostUnitIds?.length ?? 0
  if (attack.result === "won") {
    return (
      <Badge variant="secondary">
        {lost === 0 ? t("attack.won") : t("attack.wonLost", { count: lost })}
      </Badge>
    )
  }
  if (attack.result === "lost") {
    return <Badge variant="destructive">{t("attack.lost")}</Badge>
  }
  return <Badge variant="outline">{t("attack.noResult")}</Badge>
}

/** Zone and the defenders' rarity of an attack: the zone's picture, "Armoury · Epic" and the Epic
 *  icon. */
function AttackTargetText({
  attack,
  season,
}: {
  attack: GuildWarAttack
  season: GuildWarSeason | undefined
}) {
  const { t } = useTranslation(["guildWar", "progression"])
  const { zoneName } = useGuildWarNames()
  const visualId = season?.zones.find(
    (zone) => zone.id === attack.zoneId
  )?.visualId
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium">
      <EntityIcon
        alt=""
        className="object-contain"
        size="icon-md"
        src={visualId ? guildWarZoneIcon(visualId) : undefined}
      />
      {t("attack.target", {
        zone: zoneName(season, attack.zoneId),
        rarity: t(`progression:rarities.${attack.rarityCap}`),
      })}
      <EntityIcon alt="" size="icon" src={rarityIcon(attack.rarityCap)} />
    </span>
  )
}

/** The enemy an attack met, when any was entered: its units with their rarity, rank and outcome,
 *  the zone buffs that were active, and the map. */
function AttackEnemy({
  attack,
  season,
}: {
  attack: GuildWarAttack
  season: GuildWarSeason | undefined
}) {
  const { t } = useTranslation("guildWar")
  const unitName = useUnitName()
  const { buffName } = useGuildWarNames()
  const enemy = attack.enemy
  if (!enemy) return null
  const units = [
    ...enemy.characters.map((unit) => ({ unit, kind: "character" as const })),
    ...(enemy.mow ? [{ unit: enemy.mow, kind: "mow" as const }] : []),
  ]
  const mapIndex = season?.maps.findIndex(
    (map) => map.boardId === enemy.boardId
  )
  if (units.length === 0 && enemy.buffIds.length === 0 && !enemy.boardId) {
    return null
  }
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1"
      data-testid="attack-enemy"
    >
      <span className="text-xs text-muted-foreground">{t("attack.enemy")}</span>
      {units.length > 0 ? (
        <ul aria-label={t("attack.enemy")} className="flex flex-wrap gap-1">
          {units.map(({ unit, kind }) => {
            const name = unitName(
              kind === "mow" ? "Mow" : "Character",
              unit.unitId
            )
            const label = unit.state
              ? `${name} (${t(`enemy.states.${unit.state}`)})`
              : name
            return (
              <li
                aria-label={label}
                className="relative flex"
                data-state={unit.state ?? undefined}
                key={unit.unitId}
              >
                <TeamUnitPortrait
                  className={cn(
                    unit.state === "killed" && "opacity-60 grayscale"
                  )}
                  unit={{
                    kind,
                    unitId: unit.unitId,
                    owned: true,
                    progression: unit.rarity
                      ? startingProgression(unit.rarity)
                      : undefined,
                    rank: rankOrder.find((rank) => rank === unit.rank),
                  }}
                />
                {unit.state === "killed" ? (
                  <Skull
                    aria-hidden="true"
                    className="absolute -top-1 -left-1 size-icon-sm rounded-full bg-background p-0.5 text-destructive"
                  />
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
      {enemy.buffIds.map((id) => (
        <span className="flex items-center gap-1 text-xs" key={id}>
          <EntityIcon alt="" size="icon-sm" src={guildWarBuffIcon(id)} />
          {buffName(id)}
        </span>
      ))}
      {enemy.boardId ? (
        <span className="text-xs text-muted-foreground">
          {mapIndex !== undefined && mapIndex >= 0
            ? t("enemy.mapOption", { number: mapIndex + 1 })
            : enemy.boardId}
        </span>
      ) : null}
    </div>
  )
}

/** One attack: target, when, result, lineup and enemy, plus the row's own actions. */
export function AttackRow({
  attack,
  season,
  locale,
  actions,
}: {
  attack: GuildWarAttack
  season: GuildWarSeason | undefined
  locale: string
  actions?: ReactNode
}) {
  return (
    <li
      className="flex flex-col gap-2 rounded-xl border bg-card p-3"
      data-attack={attack.id}
      data-testid="guild-war-attack"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <AttackTargetText attack={attack} season={season} />
        <span className="text-xs text-muted-foreground">
          {formatShortDate(attack.attackedAt, locale)}
        </span>
        <AttackResultBadge attack={attack} />
        {actions === undefined ? null : (
          <span className="ml-auto">{actions}</span>
        )}
      </div>
      <AttackLineup attack={attack} />
      <AttackEnemy attack={attack} season={season} />
      {attack.notes ? (
        <p
          className="text-sm wrap-break-word text-muted-foreground italic"
          data-testid="attack-notes"
        >
          {attack.notes}
        </p>
      ) : null}
    </li>
  )
}
