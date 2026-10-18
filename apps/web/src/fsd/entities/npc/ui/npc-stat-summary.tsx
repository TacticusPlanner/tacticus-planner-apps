import { useTranslation } from "react-i18next"
import {
  damageTypeIcon,
  factionIcon,
  statIcon,
  traitIcon,
} from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import { useNpcLabels } from "../lib/use-npc-labels"
import type { NpcRecord, NpcStatRow } from "../model/types"
import { NpcLevelBadge } from "./npc-level-badge"
import { NpcPortrait } from "./npc-portrait"

/**
 * A compact read-only card for one NPC variation at one ladder row: portrait, localized name and
 * faction, level, health / damage / armour, attacks and traits. Without a `row` (a level that could
 * not be resolved) the stats, level and attacks are left out; the caller says why.
 */
export function NpcStatSummary({
  npc,
  row,
}: {
  npc: NpcRecord
  row: NpcStatRow | undefined
}) {
  const { t } = useTranslation(["library", "damageTypes", "traits"])
  const { variationName, factionName } = useNpcLabels()
  const name = variationName(npc.id, npc.name)
  const number = (value: number) => value.toLocaleString()

  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="npc-stat-summary">
      <div className="flex min-w-0 items-center gap-3">
        <NpcPortrait className="size-12" name={name} variationId={npc.id} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate font-semibold">{name}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <EntityIcon
              alt=""
              className="size-4"
              src={factionIcon(npc.factionId)}
            />
            {factionName(npc.factionId)}
          </p>
          {row ? <NpcLevelBadge row={row} /> : null}
        </div>
      </div>
      {row ? (
        <dl
          className="grid grid-cols-3 gap-2"
          data-testid="npc-stat-summary-stats"
        >
          {(
            [
              ["health", row.health],
              ["damage", row.damage],
              ["armour", row.armour],
            ] as const
          ).map(([kind, value]) => (
            <div
              className="flex flex-col items-center gap-0.5 rounded-lg border bg-card px-2 py-1.5"
              key={kind}
            >
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <EntityIcon alt="" className="size-4" src={statIcon(kind)} />
                {t(`library:npcs.stats.${kind}`)}
              </dt>
              <dd
                className="font-semibold tabular-nums"
                data-testid={`npc-stat-summary-${kind}`}
              >
                {number(value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {row ? <Attacks npc={npc} /> : null}
      {npc.traits.length > 0 ? (
        <ul
          aria-label={t("library:npcs.traits")}
          className="flex flex-wrap gap-1.5"
        >
          {npc.traits.map((trait) => (
            <li
              className="flex items-center gap-1 rounded-md border bg-card px-1.5 py-1 text-xs"
              key={trait}
            >
              <EntityIcon alt="" className="size-4" src={traitIcon(trait)} />
              {t(`traits:${trait}`, { defaultValue: trait })}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function Attacks({ npc }: { npc: NpcRecord }) {
  const { t } = useTranslation(["library", "damageTypes"])
  const attacks = [
    npc.meleeDamage.trim() === ""
      ? null
      : {
          kind: "melee" as const,
          damage: npc.meleeDamage,
          hits: npc.meleeHits,
        },
    npc.rangedDamage
      ? {
          kind: "ranged" as const,
          damage: npc.rangedDamage,
          hits: npc.rangedHits ?? 0,
        }
      : null,
  ].filter((attack) => attack !== null)
  if (attacks.length === 0) return null
  return (
    <ul
      aria-label={t("library:npcs.attacks.title")}
      className="flex flex-col gap-1"
    >
      {attacks.map((attack) => (
        <li
          className="flex items-center gap-2 text-sm"
          data-testid={`npc-stat-summary-${attack.kind}`}
          key={attack.kind}
        >
          <EntityIcon alt="" className="size-5" src={statIcon(attack.kind)} />
          <span className="font-medium">
            {t(`library:npcs.attacks.${attack.kind}`)}
          </span>
          {attack.kind === "ranged" && npc.distance != null ? (
            <span className="text-muted-foreground">
              {t("library:npcs.attacks.range", { range: npc.distance })}
            </span>
          ) : null}
          <EntityIcon
            alt=""
            className="size-4"
            src={damageTypeIcon(attack.damage)}
          />
          <span className="truncate">
            {t(`damageTypes:${attack.damage}`, {
              defaultValue: attack.damage,
            })}
          </span>
          <span className="ml-auto text-muted-foreground tabular-nums">
            {t("library:npcs.attacks.hits", { count: attack.hits })}
          </span>
        </li>
      ))}
    </ul>
  )
}
