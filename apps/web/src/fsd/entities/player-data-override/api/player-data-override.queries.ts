/**
 * Root key of every player-data override query. The overrides are one row with one revision, so
 * saving any of them changes the revision the others must send: pass this as a revisioned draft's
 * `sharedRevisionKey`.
 */
export const playerDataOverrideKey = ["player-data-overrides"] as const
