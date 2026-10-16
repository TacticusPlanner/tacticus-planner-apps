/**
 * Which header state applies: the player owns the unit (a), is signed in and synced without it
 * (b), or has no roster to compare with — signed out, or signed in before the roster synced (c).
 * `loading` holds every state's line and banner while a signed-in player's data is still read, so a
 * synced player doesn't see the "no roster" banner first.
 */
export type UnitOwnership = "owned" | "notOwned" | "noRoster" | "loading"

export function unitOwnership(
  rosterSynced: boolean,
  playerRecord: object | undefined,
  loading = false
): UnitOwnership {
  if (loading) return "loading"
  if (!rosterSynced) return "noRoster"
  return playerRecord ? "owned" : "notOwned"
}
