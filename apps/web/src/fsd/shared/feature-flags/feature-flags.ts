/**
 * Feature flags the web app checks. Unfinished work merged to `main` stays
 * hidden behind one until it is ready. Add its name to this union in the PR
 * that hides the feature (`"LreTokenPlanV2" | "..."`), and turn it on in the
 * environment's Azure App Configuration store (`appcs-tp-stg`,
 * `appcs-tp-prod`). Delete it once the feature has shipped everywhere.
 */
export type FeatureFlag = never
