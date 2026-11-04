/** A tier's rarity and its 1-based number among the tiers of that rarity ("Epic 2"). */
export function tierLabels(
  tiers: readonly { index: number; rarity: string }[]
): Map<number, { rarity: string; number: number }> {
  const seen = new Map<string, number>()
  return new Map(
    tiers.map((tier) => {
      const number = (seen.get(tier.rarity) ?? 0) + 1
      seen.set(tier.rarity, number)
      return [tier.index, { rarity: tier.rarity, number }]
    })
  )
}
