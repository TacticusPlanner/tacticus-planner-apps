import { useTranslation } from "react-i18next"
import {
  abilityBadgeIcon,
  energyIcon,
  forgeBadgeIcon,
  goldIcon,
  mowComponentIcon,
  orbAllianceIcon,
  orbIcon,
  shardIcon,
} from "@workspace/game-catalog"
import { rarityOrder, type Rarity } from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import type { ResourceNeed } from "@/features/goal-farming"
import { EntityIcon } from "@/shared/ui"

/** At most this many chips render; the rest collapse into one "+N" chip whose tooltip lists all. */
const MAX_VISIBLE_CHIPS = 6

type Chip = {
  key: string
  icon: string
  /** Alliance emblem drawn over the icon (V1's orb: rarity orb with the alliance on top). */
  overlay?: string
  /** Full localized resource name, used in the tooltip and the accessible name. */
  name: string
  /** Display text beside the icon (a formatted quantity, or ). */
  text: string
}

/** Icon chips for what a goal still needs, per goal kind (`goal-remaining-resources`): never upgrade
 *  materials; zero quantities omitted. The XP-book figure lives with the level line, not here. */
export function GoalResourceChips({
  goalType,
  entityType,
  remaining,
  energy,
}: {
  goalType: GoalKind
  entityType: string
  remaining: ResourceNeed | null
  energy: number | undefined
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
  const addByRarity = (
    kind: "orbs" | "abilityBadges" | "forgeBadges",
    amounts: Partial<Record<Rarity, number>> | undefined,
    icon: (rarity: Rarity) => string,
    overlay?: string
  ) => {
    for (const rarity of rarityOrder) {
      add(
        `${kind}-${rarity}`,
        icon(rarity),
        t(`goals.resourceChips.${kind}`, { rarity: rarityName(rarity) }),
        amounts?.[rarity],
        overlay
      )
    }
  }
  const addEnergy = () =>
    add("energy", energyIcon(), t("goals.resourceChips.energy"), energy)
  const addGold = (gold: number | undefined) =>
    add("gold", goldIcon(), t("goals.resourceChips.gold"), gold)
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
    addByRarity("abilityBadges", materials?.badgesByRarity, (rarity) =>
      abilityBadgeIcon(rarity, alliance)
    )
    if (entityType === "Mow") {
      addByRarity("forgeBadges", materials?.forgeBadgesByRarity, forgeBadgeIcon)
      add(
        "components",
        mowComponentIcon(alliance),
        t("goals.resourceChips.components"),
        materials?.components
      )
    }
    addGold(materials?.gold)
    addEnergy()
  } else if (goalType === "Upgrade") {
    addEnergy()
  }

  if (chips.length === 0) return null

  const label = (chip: Chip) =>
    t("goals.resourceChips.chipLabel", { name: chip.name, quantity: chip.text })
  const visible =
    chips.length > MAX_VISIBLE_CHIPS
      ? chips.slice(0, MAX_VISIBLE_CHIPS - 1)
      : chips
  const hidden = chips.slice(visible.length)
  const fullList = chips.map(label).join(", ")

  return (
    <ul
      className="flex max-h-12 max-w-[220px] flex-wrap gap-x-2 gap-y-1 overflow-hidden text-xs"
      data-testid="goal-resource-chips"
    >
      {visible.map((chip) => (
        <li data-testid="goal-resource-chip" key={chip.key}>
          <span
            aria-label={label(chip)}
            className="flex items-center gap-1 tabular-nums"
            role="img"
            title={label(chip)}
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
            <span aria-hidden>{chip.text}</span>
          </span>
        </li>
      ))}
      {hidden.length > 0 ? (
        <li data-testid="goal-resource-chips-overflow">
          <span
            aria-label={fullList}
            className="text-muted-foreground"
            role="img"
            title={fullList}
          >
            <span aria-hidden>+{hidden.length}</span>
          </span>
        </li>
      ) : null}
    </ul>
  )
}
