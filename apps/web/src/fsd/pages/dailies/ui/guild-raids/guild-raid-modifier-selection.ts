import type { GuildRaidModifierView } from "./guild-raid-status-view-model"

function isConfirmedActive(modifier: GuildRaidModifierView): boolean {
  return modifier.activation.kind === "known" && modifier.activation.active
}

/**
 * The modifier collapsed view highlights: the first one (array order is threshold-descending) that
 * hasn't been confirmed active yet. An "unknown" activation is treated as not-yet-confirmed rather
 * than skipped, since we can't rule out it still being ahead.
 */
export function nextModifierToActivate(
  modifiers: GuildRaidModifierView[]
): GuildRaidModifierView | undefined {
  return modifiers.find((modifier) => !isConfirmedActive(modifier))
}

export function countActivatedModifiers(
  modifiers: GuildRaidModifierView[]
): number {
  return modifiers.filter(isConfirmedActive).length
}
