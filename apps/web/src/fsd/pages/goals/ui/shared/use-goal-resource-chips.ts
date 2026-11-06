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
  type GameIcon,
} from "@workspace/game-catalog"
import { rarityOrder, type Rarity } from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import type { ResourceNeed } from "@/features/goal-farming"
import { shopCurrencyIcon } from "@/features/shop-rewards"
import { sumPools } from "./goal-resource-totals"

const EMPTY_AVAILABLE = {
  badgesByRarity: {},
  forgeBadgesByRarity: {},
  components: 0,
}

/** What a chip counts. A goal card lays out its rows by this, so a renamed kind fails to compile there. */
export type GoalResourceChipKind =
  | "energy"
  | "gold"
  | "onslaughtTokens"
  | "orbs"
  | "abilityBadges"
  | "forgeBadges"
  | "components"
  | "shards"
  | "mythicShards"
  | "shopCurrency"

export type GoalResourceChip = {
  key: string
  kind: GoalResourceChipKind
  icon: GameIcon | undefined
  /** Alliance emblem drawn over the icon (V1's orb: rarity orb with the alliance on top). */
  overlay?: string
  /** Full localized resource name, used in the tooltip and the accessible name. */
  name: string
  /** Available/needed quantities (Machine of War materials): shows "a/n", the label reads "a of n". */
  pool?: { available: number; needed: number }
  /** The raw count behind `text` (summed when chips fold into one). */
  quantity?: number
  /** Display text beside the icon (a formatted quantity, or ). */
  text: string
  /** Shortened text shown instead of `text` when they differ (gold: "42k"); the label keeps the full value. */
  display?: string
  /** Extra tooltip line (the energy chip's standalone figures). */
  hint?: string
  /** Per-rarity chips folded into this one (UserJot "Improve goals table layout"): the chip shows
   *  their total and opens a popover listing each rarity. */
  parts?: GoalResourceChip[]
}

export type GoalResourceChipsInput = {
  goalType: GoalKind
  entityType: string
  remaining: ResourceNeed | null
  energy: number | undefined
  /** Projected Onslaught tokens (runs) from the goal's estimate; absent or 0 shows no chip. */
  onslaughtTokens?: number
  /** Projected shop currency still to spend, by currency id (`goal-remaining-resources`); absent or
   *  empty shows no chip. */
  shopSpend?: ReadonlyMap<string, number>
}

/** What a goal still needs as chips, per goal kind (`goal-remaining-resources`): never upgrade
 *  materials; zero quantities omitted. The XP-book figure lives with the level line, not here. */
export function useGoalResourceChips({
  goalType,
  entityType,
  remaining,
  energy,
  onslaughtTokens,
  shopSpend,
}: GoalResourceChipsInput): GoalResourceChip[] {
  const { t, i18n } = useTranslation(["common", "shops"])
  const format = new Intl.NumberFormat(i18n?.resolvedLanguage)
  const fmt = (value: number) => format.format(value)
  const rarityName = (rarity: Rarity) =>
    t(`goals.resourceChips.rarity.${rarity}`)
  const chips: GoalResourceChip[] = []
  const add = (
    kind: GoalResourceChipKind,
    key: string,
    icon: GameIcon | undefined,
    name: string,
    quantity: number | undefined,
    overlay?: string
  ) => {
    if (quantity && quantity > 0) {
      chips.push({
        key,
        kind,
        icon,
        overlay,
        name,
        quantity,
        text: fmt(quantity),
      })
    }
  }
  const addPool = (
    kind: GoalResourceChipKind,
    key: string,
    icon: GameIcon,
    name: string,
    needed: number | undefined,
    available: number | undefined,
    overlay?: string
  ) => {
    if (!needed || needed <= 0) return
    const pool = { available: available ?? 0, needed }
    chips.push({
      key,
      kind,
      icon,
      overlay,
      name,
      pool,
      text: `${fmt(pool.available)}/${fmt(needed)}`,
    })
  }
  const addByRarity = (
    kind: "orbs" | "abilityBadges" | "forgeBadges",
    amounts: Partial<Record<Rarity, number>> | undefined,
    icon: (rarity: Rarity) => GameIcon,
    overlay?: string,
    available?: Partial<Record<Rarity, number>>
  ) => {
    const start = chips.length
    for (const rarity of rarityOrder) {
      const name = t(`goals.resourceChips.${kind}`, {
        rarity: rarityName(rarity),
      })
      const key = `${kind}-${rarity}`
      if (available) {
        addPool(
          kind,
          key,
          icon(rarity),
          name,
          amounts?.[rarity],
          available[rarity],
          overlay
        )
      } else {
        add(kind, key, icon(rarity), name, amounts?.[rarity], overlay)
      }
    }
    // Two or more rarities fold into one chip (the highest rarity's art) so a long Remaining list
    // stays scannable; a lone rarity keeps its own chip.
    const parts = chips.splice(start)
    if (parts.length < 2) {
      chips.push(...parts)
      return
    }
    const top = parts.at(-1) as GoalResourceChip
    const name = t(`goals.resourceChips.${kind}Total`)
    if (available) {
      // Surplus of one rarity can't stand in for another, so a rarity counts at most what it needs.
      const total = sumPools(parts)
      chips.push({
        key: kind,
        kind,
        icon: top.icon,
        overlay: top.overlay,
        name,
        pool: total,
        text: `${fmt(total.available)}/${fmt(total.needed)}`,
        parts,
      })
    } else {
      const total = parts.reduce((sum, part) => sum + (part.quantity ?? 0), 0)
      chips.push({
        key: kind,
        kind,
        icon: top.icon,
        overlay: top.overlay,
        name,
        text: fmt(total),
        parts,
      })
    }
  }
  const addEnergy = () => {
    add(
      "energy",
      "energy",
      energyIcon(),
      t("goals.resourceChips.energy"),
      energy
    )
    const standalone = remaining?.standalone
    const chip = chips.find((c) => c.kind === "energy")
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
      "onslaughtTokens",
      onslaughtTokenIcon(),
      t("goals.resourceChips.onslaughtTokens"),
      onslaughtTokens
    )
  const addShopCurrency = () => {
    for (const [currency, amount] of shopSpend ?? []) {
      add(
        "shopCurrency",
        `shopCurrency-${currency}`,
        shopCurrencyIcon(currency),
        t(`shops:currency.${currency}`, { defaultValue: currency }),
        Math.round(amount)
      )
    }
  }
  // V1 parity (numberToThousandsString): below 1,000 as is, otherwise floor(value / 1000) + "k".
  const addGold = (gold: number | undefined) => {
    if (!gold || gold <= 0) return
    chips.push({
      key: "gold",
      kind: "gold",
      icon: goldIcon(),
      name: t("goals.resourceChips.gold"),
      text: fmt(gold),
      display: gold < 1000 ? fmt(gold) : `${Math.floor(gold / 1000)}k`,
    })
  }
  const addShards = () => {
    add(
      "shards",
      "shards",
      shardIcon("Regular"),
      t("goals.resourceChips.shards"),
      remaining?.shards
    )
    add(
      "mythicShards",
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
    // In the plan, orbs read available/needed like V1's "x/y"; a paused goal's stay a plain need.
    const orbPool = remaining?.orbPool
    addByRarity(
      "orbs",
      orbPool ? orbPool.neededByRarity : remaining?.orbsByType,
      orbIcon,
      orbAllianceIcon(alliance),
      orbPool?.availableByRarity
    )
    addShards()
    addEnergy()
  } else if (goalType === "Unlock") {
    addShards()
    addEnergy()
  } else if (goalType === "Ability") {
    const isMow = entityType === "Mow"
    // Ability materials read available/needed (V1's "x/y"), Character badges as well as Machine of War
    // materials; a Character entry without stock data stays a plain need.
    const pool = isMow
      ? (materials?.available ?? EMPTY_AVAILABLE)
      : materials?.available
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
  addShopCurrency()

  // Same leading order on every goal (energy, gold, tokens); the rest keep their per-kind order
  // (Array.sort is stable).
  const leading: GoalResourceChipKind[] = ["energy", "gold", "onslaughtTokens"]
  const rank = (chip: GoalResourceChip) => {
    const index = leading.indexOf(chip.kind)
    return index === -1 ? leading.length : index
  }
  return chips.sort((a, b) => rank(a) - rank(b))
}
