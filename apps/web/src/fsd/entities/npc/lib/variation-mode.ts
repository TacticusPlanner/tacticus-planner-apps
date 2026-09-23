export type NpcVariationMode =
  | "standard"
  | "lhe"
  | "legendary"
  | "survival"
  | "campaign"
  | "championEvent"
  | "tutorial"
  | "leviathan"
  | "kronos"
  | "gorgon"
  | "syncPvp"
  | "unknown"

// Ordered: the first matching rule wins. Nothing in the data names these modes — they are read off the
// id's tail — so a new suffix falls through to `unknown` (label = raw id) rather than mislabelling.
const SUFFIX_RULES: readonly [RegExp, NpcVariationMode][] = [
  [/_SyncPvp/i, "syncPvp"],
  [/FTUEtest$/i, "tutorial"],
  [/Tut(?=[A-Z]|$)/, "tutorial"],
  [/Leviathan$/, "leviathan"],
  [/Kronos$/, "kronos"],
  [/Gorgon$/, "gorgon"],
  [/_?LHE$/, "lhe"],
  [/LEG$/, "legendary"],
  [/Surv$/, "survival"],
  [/CE\d*$/, "championEvent"],
  [/C1(?=[A-Z]|$)/, "campaign"],
]

/**
 * The game mode a variation id's suffix denotes. `isGroupDefault` marks the group's base entry, which
 * carries no suffix and reads as "Standard"; any other unsuffixed id is `unknown`.
 */
export function variationMode(
  variationId: string,
  isGroupDefault: boolean
): NpcVariationMode {
  for (const [pattern, mode] of SUFFIX_RULES) {
    if (pattern.test(variationId)) return mode
  }
  return isGroupDefault ? "standard" : "unknown"
}

/** i18n key (in the `library` namespace) for a mode label. */
export function variationModeLabelKey(mode: NpcVariationMode): string {
  return `npcs.variationMode.${mode}`
}
