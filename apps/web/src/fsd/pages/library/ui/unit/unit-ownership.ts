/**
 * Which header state applies: the player owns the unit (a), is signed in and synced without it
 * (b), or has no roster to compare with — signed out, or signed in before the roster synced (c).
 */
export type UnitOwnership = "owned" | "notOwned" | "noRoster"

export function unitOwnership(
  rosterSynced: boolean,
  playerRecord: object | undefined
): UnitOwnership {
  if (!rosterSynced) return "noRoster"
  return playerRecord ? "owned" : "notOwned"
}
