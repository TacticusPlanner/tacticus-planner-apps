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
