import { useTranslation } from "react-i18next"
import { damageTypeIcon, statIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import type { NpcVariation } from "@/entities/npc"

/**
 * The attack-kind icon. A ranged attack carries its range as a number painted on the icon, the way
 * the game and V1's `AttackProfileRow` show it, rather than as a separate "Range n" label. The icon is
 * a hollow crosshair, so the number sits on the card background and uses `text-foreground` to stay
 * legible in both themes (V1 hard-codes white; it only has a dark theme). The range is repeated in
 * screen-reader-only text, since a bare "3" conveys nothing on its own.
 */
function AttackKindIcon({
  kind,
  range,
  rangeLabel,
}: {
  kind: "melee" | "ranged"
  range?: number | null
  rangeLabel: string
}) {
  if (kind === "melee" || range == null) {
    return (
      <EntityIcon src={statIcon(kind)} alt="" className="size-6 shrink-0" />
    )
  }

  return (
    <span className="relative flex size-6 shrink-0 items-center justify-center">
      <EntityIcon
        src={statIcon("ranged")}
        alt=""
        className="absolute inset-0 size-full"
      />
      <span
        aria-hidden
        className="relative text-[10px] leading-none font-bold text-foreground"
      >
        {range}
      </span>
      <span className="sr-only">{rangeLabel}</span>
    </span>
  )
}

/** One chip per weapon: kind (with range on the icon), damage type, and hit count. */
function AttackChip({
  kind,
  damageType,
  hits,
  range,
}: {
  kind: "melee" | "ranged"
  damageType: string
  hits: number
  range?: number | null
}) {
  const { t } = useTranslation(["library", "damageTypes"])

  return (
    <li
      className="flex min-w-0 items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-sm"
      data-testid={`npc-attack-${kind}`}
    >
      <AttackKindIcon
        kind={kind}
        range={range}
        rangeLabel={t("library:npcs.attacks.range", { range })}
      />
      <span className="font-medium">{t(`library:npcs.attacks.${kind}`)}</span>
      <EntityIcon
        src={damageTypeIcon(damageType)}
        alt=""
        className="size-5 shrink-0"
      />
      <span className="truncate">
        {t(`damageTypes:${damageType}`, { defaultValue: damageType })}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-1 text-muted-foreground">
        <EntityIcon src={statIcon("hits")} alt="" className="size-4" />
        {t("library:npcs.attacks.hits", { count: hits })}
      </span>
    </li>
  )
}

/**
 * The variation's weapons: a melee chip always, plus a ranged chip when it has one. Laid out on the
 * same two-column grid as the ability columns below, so the two sections share one rhythm instead of
 * each packing content-width chips to a ragged edge.
 */
export function NpcAttacks({
  variation,
  compact = false,
}: {
  variation: NpcVariation
  /** Mobile: one column instead of the two-column grid shared with abilities. */
  compact?: boolean
}) {
  const { t } = useTranslation("library")
  // Most units always have a melee attack, but a few non-combat ones (Watcher, Spore Mine) are served
  // with an empty damage profile and zero hits — rendering a chip for those invents an attack.
  const hasMelee = variation.meleeDamage.trim() !== ""

  if (!hasMelee && !variation.rangedDamage) {
    return (
      <section className="flex flex-col gap-2" data-testid="npc-attacks">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t("npcs.attacks.title")}
        </h3>
        <p
          className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground"
          data-testid="npc-attacks-empty"
        >
          {t("npcs.attacks.none")}
        </p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-2" data-testid="npc-attacks">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t("npcs.attacks.title")}
      </h3>
      <ul
        className={cn(
          // Same column gap as the ability grid below, so both sections share column origins.
          "grid gap-x-6 gap-y-2",
          compact ? "grid-cols-1" : "grid-cols-2"
        )}
      >
        {hasMelee ? (
          <AttackChip
            kind="melee"
            damageType={variation.meleeDamage}
            hits={variation.meleeHits}
          />
        ) : null}
        {variation.rangedDamage ? (
          <AttackChip
            kind="ranged"
            damageType={variation.rangedDamage}
            hits={variation.rangedHits ?? 0}
            range={variation.distance}
          />
        ) : null}
      </ul>
    </section>
  )
}
