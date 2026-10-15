import {
  onslaughtSectors,
  type OnslaughtSector,
  type OnslaughtTier,
} from "@/entities/player-data-override"

/** Moving up a sector starts at tier 1, moving down lands on 4 (complete). */
export function tierAfterSectorChange(
  from: OnslaughtSector,
  to: OnslaughtSector,
  tier: OnslaughtTier
): OnslaughtTier {
  const delta = onslaughtSectors.indexOf(to) - onslaughtSectors.indexOf(from)
  return delta > 0 ? 1 : delta < 0 ? 4 : tier
}

/** The tiers the Tier select offers. Tier 4 is not a tier you farm: it is stored when the
 *  "Sector complete" checkbox is on and pays the tier-3 rewards. */
export const farmableTiers = [1, 2, 3] as const

/** The Tier select's value: a completed sector (4) shows its last farmable tier, 3. */
export function selectedTier(tier: OnslaughtTier): 1 | 2 | 3 {
  return tier === 4 ? 3 : tier
}

/** Checking "Sector complete" stores tier 4; unchecking it returns to tier 3. */
export function tierAfterCompleteToggle(complete: boolean): OnslaughtTier {
  return complete ? 4 : 3
}
