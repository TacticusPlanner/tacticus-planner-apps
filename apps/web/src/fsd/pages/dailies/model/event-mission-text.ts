// The game's own mission text (spec event-shop-planner: Rewards are read-only references; design D5a):
// `Quests/<task>_description` templates with `{[TARGET_AMOUNT]}`-style placeholders, the game's
// `[i2p_Plural]…[i2p_One]…` plural forms and `<style=…>` markup.

/**
 * Fills a game text template: picks the `[i2p_One]` form for a count of 1 and `[i2p_Plural]`
 * otherwise, replaces `{[NAME]}` placeholders and drops `<style=…>` tags. A placeholder without a
 * value stays as written.
 */
export function fillGameText(
  template: string,
  values: Readonly<Record<string, string | number>>,
  count?: number
): string {
  let text = template
  if (text.includes("[i2p_")) {
    // "[i2p_Plural]A[i2p_One]B" splits into ["", "Plural", "A", "One", "B"].
    const parts = text.split(/\[i2p_(\w+)\]/)
    const forms = new Map<string, string>()
    for (let index = 1; index + 1 < parts.length; index += 2) {
      forms.set(parts[index]!, parts[index + 1]!)
    }
    text =
      (count === 1 ? forms.get("One") : forms.get("Plural")) ?? parts[2] ?? text
  }
  return text
    .replace(/\{\[(\w+)\]\}/g, (placeholder, name: string) =>
      name in values ? String(values[name]) : placeholder
    )
    .replace(/<\/?style[^>]*>/g, "")
}

interface RewardRange {
  type: string
  min: number
  max: number
}

/** The rewards of several missions added up per reward type, in first-seen order. */
export function sumRewards(
  missions: readonly { rewards: readonly RewardRange[] }[]
): RewardRange[] {
  const totals = new Map<string, RewardRange>()
  for (const mission of missions) {
    for (const reward of mission.rewards) {
      const total = totals.get(reward.type)
      if (total) {
        total.min += reward.min
        total.max += reward.max
      } else {
        totals.set(reward.type, { ...reward })
      }
    }
  }
  return [...totals.values()]
}

export interface LadderTile {
  requiredProgress: number
  /** `min` when the ladder notes this reward's spread once ("rolls up to +10%"), else `range`. */
  rewards: { reward: RewardRange; shown: "min" | "range" }[]
  /** Carries a reward most tiers don't (a token, stamina, a profile theme). */
  special: boolean
}

export interface LadderView {
  tiles: LadderTile[]
  /** The event currency the ladder pays in total, when it pays any. */
  total: RewardRange | null
  /** Ranged rewards whose max is the same percent above min on every tier. */
  spreads: { type: string; percent: number }[]
}

/**
 * A reward ladder as tiles (canvas M2): which tiers stand out, what event currency it pays in total, and
 * which ranges can be noted once instead of on every tile.
 */
export function ladderView(
  tiers: readonly {
    requiredProgress: number
    rewards: readonly RewardRange[]
  }[]
): LadderView {
  const tiersWith = new Map<string, number>()
  for (const tier of tiers) {
    for (const type of new Set(tier.rewards.map((reward) => reward.type))) {
      tiersWith.set(type, (tiersWith.get(type) ?? 0) + 1)
    }
  }
  const common = (type: string) => (tiersWith.get(type) ?? 0) * 2 > tiers.length

  const percents = new Map<string, Set<number>>()
  for (const tier of tiers) {
    for (const reward of tier.rewards) {
      const set = percents.get(reward.type) ?? new Set<number>()
      set.add(
        reward.min > 0
          ? Math.round(((reward.max - reward.min) / reward.min) * 100)
          : 0
      )
      percents.set(reward.type, set)
    }
  }
  const spreads = [...percents.entries()]
    .filter(([, set]) => set.size === 1 && [...set][0]! > 0)
    .map(([type, set]) => ({ type, percent: [...set][0]! }))
  const noted = new Set(spreads.map((spread) => spread.type))

  const currency = sumRewards(tiers).find((reward) =>
    reward.type.startsWith("seasonalEventCurrency")
  )

  return {
    tiles: tiers.map((tier) => ({
      requiredProgress: tier.requiredProgress,
      rewards: tier.rewards.map((reward) => ({
        reward,
        shown: noted.has(reward.type) ? "min" : "range",
      })),
      special: tier.rewards.some((reward) => !common(reward.type)),
    })),
    total: currency ?? null,
    spreads,
  }
}
