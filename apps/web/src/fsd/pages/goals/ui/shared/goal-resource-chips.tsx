import { useTranslation } from "react-i18next"
import {
  abilityBadgeIcon,
  energyIcon,
  forgeBadgeIcon,
  goldIcon,
  mowComponentIcon,
  onslaughtTokenIcon,
  orbAllianceIcon,
  orbIcon,
  shardIcon,
} from "@workspace/game-catalog"
import { rarityOrder, type Rarity } from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import type { ResourceNeed } from "@/features/goal-farming"
import { EntityIcon } from "@/shared/ui"

const EMPTY_AVAILABLE = {
  badgesByRarity: {},
  forgeBadgesByRarity: {},
  components: 0,
}

type Chip = {
  key: string
  icon: string
  /** Alliance emblem drawn over the icon (V1's orb: rarity orb with the alliance on top). */
  overlay?: string
  /** Full localized resource name, used in the tooltip and the accessible name. */
  name: string
  /** Available/needed quantities (Machine of War materials): shows "a/n", the label reads "a of n". */
  pool?: { available: number; needed: number }
  /** Display text beside the icon (a formatted quantity, or ). */
  text: string
  /** Shortened text shown instead of `text` when they differ (gold: "42k"); the label keeps the full value. */
  display?: string
  /** Extra tooltip line (the energy chip's standalone figures). */
  hint?: string
}

/** Icon chips for what a goal still needs, per goal kind (`goal-remaining-resources`): never upgrade
 *  materials; zero quantities omitted. The XP-book figure lives with the level line, not here. */
export function GoalResourceChips({
  goalType,
  entityType,
  remaining,
  energy,
  onslaughtTokens,
}: {
  goalType: GoalKind
  entityType: string
  remaining: ResourceNeed | null
  energy: number | undefined
  /** Projected Onslaught tokens (runs) from the goal's estimate; absent or 0 shows no chip. */
  onslaughtTokens?: number
}) {
  const { t, i18n } = useTranslation()
  const fmt = (value: number) =>
    new Intl.NumberFormat(i18n?.resolvedLanguage).format(value)
  const rarityName = (rarity: Rarity) =>
    t(`goals.resourceChips.rarity.${rarity}`)
  const chips: Chip[] = []
  const add = (
    key: string,
    icon: string,
    name: string,
    quantity: number | undefined,
    overlay?: string
  ) => {
    if (quantity && quantity > 0) {
      chips.push({ key, icon, overlay, name, text: fmt(quantity) })
    }
  }
  const addPool = (
    key: string,
    icon: string,
    name: string,
    needed: number | undefined,
    available: number | undefined
  ) => {
    if (!needed || needed <= 0) return
    const pool = { available: available ?? 0, needed }
    chips.push({
      key,
      icon,
      name,
      pool,
      text: `${fmt(pool.available)}/${fmt(needed)}`,
    })
  }
  const addByRarity = (
    kind: "orbs" | "abilityBadges" | "forgeBadges",
    amounts: Partial<Record<Rarity, number>> | undefined,
    icon: (rarity: Rarity) => string,
    overlay?: string,
    available?: Partial<Record<Rarity, number>>
  ) => {
    for (const rarity of rarityOrder) {
      const name = t(`goals.resourceChips.${kind}`, {
        rarity: rarityName(rarity),
      })
      if (available) {
        addPool(
          `${kind}-${rarity}`,
          icon(rarity),
          name,
          amounts?.[rarity],
          available[rarity]
        )
      } else {
        add(`${kind}-${rarity}`, icon(rarity), name, amounts?.[rarity], overlay)
      }
    }
  }
  const addEnergy = () => {
    add("energy", energyIcon(), t("goals.resourceChips.energy"), energy)
    const standalone = remaining?.standalone
    const chip = chips.find((c) => c.key === "energy")
    if (chip && standalone) {
      chip.hint = t("goals.resourceChips.standalone", {
        slots: fmt(standalone.slots),
        energy: fmt(standalone.energy),
      })
    }
  }
  const addTokens = () =>
    add(
      "onslaughtTokens",
      onslaughtTokenIcon(),
      t("goals.resourceChips.onslaughtTokens"),
      onslaughtTokens
    )
  // V1 parity (numberToThousandsString): below 1,000 as is, otherwise floor(value / 1000) + "k".
  const addGold = (gold: number | undefined) => {
    if (!gold || gold <= 0) return
    chips.push({
      key: "gold",
      icon: goldIcon(),
      name: t("goals.resourceChips.gold"),
      text: fmt(gold),
      display: gold < 1000 ? fmt(gold) : `${Math.floor(gold / 1000)}k`,
    })
  }
  const addShards = () => {
    add(
      "shards",
      shardIcon("Regular"),
      t("goals.resourceChips.shards"),
      remaining?.shards
    )
    add(
      "mythicShards",
      shardIcon("Mythic"),
      t("goals.resourceChips.mythicShards"),
      remaining?.mythicShards
    )
  }
  const materials = remaining?.abilityMaterials
  // Alliance picks the badge/component/orb art; a unit without one shows the Imperial art.
  const alliance = remaining?.alliance ?? "Imperial"

  if (goalType === "Rank") {
    addGold(remaining?.levelGold)
    addEnergy()
  } else if (goalType === "Ascension") {
    addByRarity(
      "orbs",
      remaining?.orbsByType,
      orbIcon,
      orbAllianceIcon(alliance)
    )
    addShards()
    addEnergy()
  } else if (goalType === "Unlock") {
    addShards()
    addEnergy()
  } else if (goalType === "Ability") {
    const isMow = entityType === "Mow"
    // Machine of War materials read available/needed; a Character's stay net-remaining.
    const pool = isMow ? (materials?.available ?? EMPTY_AVAILABLE) : undefined
    addByRarity(
      "abilityBadges",
      materials?.badgesByRarity,
      (rarity) => abilityBadgeIcon(rarity, alliance),
      undefined,
      pool?.badgesByRarity
    )
    if (isMow) {
      addByRarity(
        "forgeBadges",
        materials?.forgeBadgesByRarity,
        forgeBadgeIcon,
        undefined,
        pool?.forgeBadgesByRarity
      )
      addPool(
        "components",
        mowComponentIcon(alliance),
        t("goals.resourceChips.components"),
        materials?.components,
        pool?.components
      )
    }
    addGold(materials?.gold)
    addEnergy()
  } else if (goalType === "Upgrade") {
    addEnergy()
  }

  addTokens()

  if (chips.length === 0) return null

  // Same leading order on every goal (energy, gold, tokens); the rest keep their per-kind order
  // (Array.sort is stable).
  const leading = ["energy", "gold", "onslaughtTokens"]
  const rank = (chip: Chip) => {
    const index = leading.indexOf(chip.key)
    return index === -1 ? leading.length : index
  }
  chips.sort((a, b) => rank(a) - rank(b))

  const label = (chip: Chip) =>
    chip.pool
      ? t("goals.resourceChips.poolLabel", {
          name: chip.name,
          available: fmt(chip.pool.available),
          needed: fmt(chip.pool.needed),
        })
      : t("goals.resourceChips.chipLabel", {
          name: chip.name,
          quantity: chip.text,
        })
  const tooltip = (chip: Chip) =>
    chip.hint
      ? `${label(chip)}
${chip.hint}`
      : label(chip)
  return (
    <ul
      className="flex flex-wrap gap-x-2 gap-y-1 text-xs"
      data-testid="goal-resource-chips"
    >
      {chips.map((chip) => (
        <li data-testid="goal-resource-chip" key={chip.key}>
          <span
            aria-label={tooltip(chip)}
            className="flex items-center gap-1 tabular-nums"
            role="img"
            title={tooltip(chip)}
          >
            <span className="relative inline-flex">
              <EntityIcon alt="" className="size-5" src={chip.icon} />
              {chip.overlay ? (
                <img
                  alt=""
                  className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 object-contain"
                  src={chip.overlay}
                />
              ) : null}
            </span>
            <span aria-hidden>{chip.display ?? chip.text}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
