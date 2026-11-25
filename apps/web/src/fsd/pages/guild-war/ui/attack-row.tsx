import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { rarityIcon } from "@workspace/game-catalog"
import { progressionRarity, rankOrder } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"

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
}: {
  unit: GuildWarLineupUnit
  kind: "character" | "mow"
  cap: GuildWarAttack["rarityCap"]
}) {
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
    <li aria-label={name} className="flex">
      <TeamUnitPortrait
        unit={{
          kind,
          unitId: unit.unitId,
          owned: true,
          progression: capped.progression,
          rank: capped.rank,
        }}
      />
    </li>
  )
}

/** An attack's lineup as logged, shown at the cap it was logged at. */
function AttackLineup({ attack }: { attack: GuildWarAttack }) {
  const { t } = useTranslation("guildWar")
  return (
    <ul aria-label={t("attack.lineup")} className="flex flex-wrap gap-1">
      {attack.characters.map((unit) => (
        <LineupPortrait
          cap={attack.rarityCap}
          key={unit.unitId}
          kind="character"
          unit={unit}
        />
      ))}
      {attack.mow ? (
        <LineupPortrait cap={attack.rarityCap} kind="mow" unit={attack.mow} />
      ) : null}
    </ul>
  )
}

/** "Won · 1 lost", "Lost" or "No result". */
function AttackResultBadge({ attack }: { attack: GuildWarAttack }) {
  const { t } = useTranslation("guildWar")
  if (attack.result === "won") {
    return (
      <Badge variant="secondary">
        {attack.unitsLost === null
          ? t("attack.won")
          : t("attack.wonLost", { count: attack.unitsLost })}
      </Badge>
    )
  }
  if (attack.result === "lost") {
    return <Badge variant="destructive">{t("attack.lost")}</Badge>
  }
  return <Badge variant="outline">{t("attack.noResult")}</Badge>
}

/** Zone, slot and the slot's rarity cap of an attack: "Armoury · Slot 3" with the Epic icon. */
function AttackTargetText({
  attack,
  season,
}: {
  attack: GuildWarAttack
  season: GuildWarSeason | undefined
}) {
  const { t } = useTranslation(["guildWar", "progression"])
  const { zoneName } = useGuildWarNames()
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium">
      <EntityIcon
        alt={t(`progression:rarities.${attack.rarityCap}`)}
        size="icon"
        src={rarityIcon(attack.rarityCap)}
      />
      {t("attack.target", {
        zone: zoneName(season, attack.zoneId),
        slot: attack.slot + 1,
      })}
    </span>
  )
}

/** The enemy details of an attack in one line, when any were entered. */
function AttackEnemySummary({ attack }: { attack: GuildWarAttack }) {
  const { t } = useTranslation("guildWar")
  const unitName = useUnitName()
  const { buffName } = useGuildWarNames()
  const enemy = attack.enemy
  if (!enemy) return null
  const units = [
    ...enemy.characters.map((unit) => ({ unit, kind: "Character" as const })),
    ...(enemy.mow ? [{ unit: enemy.mow, kind: "Mow" as const }] : []),
  ]
  const parts = [
    ...units.map(({ unit, kind }) => {
      const name = unitName(kind, unit.unitId)
      return unit.state ? `${name} (${t(`enemy.states.${unit.state}`)})` : name
    }),
    ...enemy.buffIds.map((id) => buffName(id)),
  ]
  if (parts.length === 0) return null
  return (
    <p className="text-xs text-muted-foreground" data-testid="attack-enemy">
      {t("attack.enemy", { details: parts.join(", ") })}
    </p>
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
      <AttackEnemySummary attack={attack} />
    </li>
  )
}
