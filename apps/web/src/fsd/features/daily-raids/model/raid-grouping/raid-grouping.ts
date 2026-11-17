/**
 * How raid suggestions are laid out wherever they show (Today, Bonus Raids, HSE, HRE, Home):
 * `upgrade` gives each upgrade its own card listing the battles that drop it, `campaign` gathers the
 * battles under one header per campaign.
 */
export type RaidGrouping = "upgrade" | "campaign"

export const RAID_GROUPINGS = [
  "upgrade",
  "campaign",
] as const satisfies readonly RaidGrouping[]

/** One group per campaign; one card per upgrade (the earlier layout) is the opt-in. */
export const DEFAULT_RAID_GROUPING: RaidGrouping = "campaign"

export function isRaidGrouping(value: unknown): value is RaidGrouping {
  return (RAID_GROUPINGS as readonly unknown[]).includes(value)
}
