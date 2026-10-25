import type { TFunction } from "i18next"

import { rankTargetKey, rankTargetKeyLabel } from "./rank-target-key"
import type { CreateGoalConfigRequest, GoalConfig, GoalKind } from "./types"

/** The end-target groups a goal's key reads: a stored goal's config or a creation spec's. */
type TargetConfig = Pick<
  GoalConfig | CreateGoalConfigRequest,
  "rank" | "progression" | "ability" | "upgrade"
>

/** Written for an ability track whose end is not above its start: the goal leaves that track alone. */
const NOT_ADVANCED = "-"

/**
 * The canonical identity of a goal's *end* target for every goal type, mirroring the API's
 * `GoalTargetKey` (goal-target-milestones): Rank is {@link rankTargetKey}; Ascension its end
 * progression; Ability `"<active>:<passive>"` with `-` for an unadvanced track; Upgrade its targets
 * sorted by id as `"<id>x<qty>"` joined by `,`, then each present range group as `|r`/`|a`/`|p<start>-<end>`.
 * Start/baseline, farming strategy and sources are never part of it. Null for Unlock (one per unit) or a
 * goal without its target group. Two in-flight goals of one unit and type with the same key are a
 * duplicate; the server stays authoritative (`slotOccupied`).
 */
export function goalTargetKey(
  goalType: GoalKind,
  config: TargetConfig
): string | null {
  switch (goalType) {
    case "Rank":
      return config.rank ? rankTargetKey(config.rank) : null
    case "Ascension":
      return config.progression ? config.progression.end : null
    case "Ability":
      return config.ability
        ? `${track(config.ability.activeStart, config.ability.activeEnd)}:${track(config.ability.passiveStart, config.ability.passiveEnd)}`
        : null
    case "Upgrade":
      return config.upgrade ? upgradeKey(config.upgrade) : null
    default:
      return null
  }
}

/** {@link goalTargetKey} of a stored goal or creation spec. */
export function goalTargetKeyOf(goal: {
  goalType: GoalKind
  config: TargetConfig
}): string | null {
  return goalTargetKey(goal.goalType, goal.config)
}

function track(start: number, end: number): string {
  return end > start ? String(end) : NOT_ADVANCED
}

type Range = { start?: number | null; end?: number | null } | null | undefined

function upgradeKey(upgrade: NonNullable<TargetConfig["upgrade"]>): string {
  // Ordinal (UTF-16 code unit) order, as the server's StringComparer.Ordinal.
  const materials = [...upgrade.targets]
    .map((target) => ({ id: target.upgradeId.trim(), qty: target.quantity }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : a.qty - b.qty))
    .map((target) => `${target.id}x${target.qty}`)
    .join(",")
  const range = (group: string, value: Range) =>
    value ? `|${group}${value.start}-${value.end}` : ""
  return (
    materials +
    range("r", upgrade.rankRange) +
    range("a", upgrade.activeRange) +
    range("p", upgrade.passiveRange)
  )
}

/**
 * A goal's end target in words, for conflict and dependency copy: "Diamond III (3/6)", "Legendary Red
 * Four Stars", "50/45" (or "50/–" for an unadvanced track), "3 materials". Null for Unlock or a goal
 * without its target group.
 */
export function goalTargetLabel(
  t: TFunction,
  goal: { goalType: GoalKind; config: TargetConfig }
): string | null {
  const key = goalTargetKeyOf(goal)
  if (key === null) return null
  switch (goal.goalType) {
    case "Rank":
      return rankTargetKeyLabel(t, key)
    case "Ascension":
      return progressionLabel(t, key)
    case "Ability":
      return key.replaceAll(NOT_ADVANCED, "–").replace(":", "/")
    case "Upgrade":
      return t("goals.target.upgradeMaterials", {
        count: goal.config.upgrade?.targets.length ?? 0,
      })
    default:
      return null
  }
}

/** "Legendary Red Four Stars" for the wire progression `"Legendary:RedFourStars"`. */
export function progressionLabel(t: TFunction, progression: string): string {
  const [rarity = progression, stars] = progression.split(":")
  const rarityLabel = t(`rarities.${rarity}`, {
    ns: "progression",
    defaultValue: rarity,
  })
  if (!stars || stars === "None") return rarityLabel
  const starsLabel = t(`stars.${stars}`, {
    ns: "progression",
    defaultValue: stars,
  })
  return `${rarityLabel} ${starsLabel}`
}
