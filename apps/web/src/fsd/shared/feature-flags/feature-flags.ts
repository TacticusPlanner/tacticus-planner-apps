/**
 * Feature flags the web app checks. Unfinished work merged to `main` stays
 * hidden behind one until it is ready. Add its name to this union in the PR
 * that hides the feature (`"LreTokenPlanV2" | "..."`), and turn it on in the
 * API: `appsettings.Staging.json` for staging, the Azure App Configuration
 * store for production. Delete it once the feature has shipped everywhere.
 */
export type FeatureFlag = never
