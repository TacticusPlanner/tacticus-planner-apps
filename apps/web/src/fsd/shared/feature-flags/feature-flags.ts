/**
 * Feature flags the web app checks. Unfinished work merged to `main` stays
 * hidden behind one until it is ready. Add its name to this union in the PR
 * that hides the feature (`"LreTokenPlanV2" | "..."`), and turn it on in the
 * environment's Azure App Configuration store (`appcs-tp-stg`,
 * `appcs-tp-prod`). Delete it once the feature has shipped everywhere.
 */
export type FeatureFlag =
  /** Manual battles: "Play manually" markers, battle medals and "Raidable only". */
  | "ManualBattles"
  /** The My Game Incursion page (each MoW's tiers, run map, battles and rewards). */
  | "Incursion"
  /** The Legendary Event Overview's Event board (all lanes' objectives and teams at once). */
  | "LreEventBoard"
  /** Copying a tester's production data into their staging account (account dialog, Staging tab). */
  | "StagingTransfer"
