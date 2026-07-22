export const xpIncomeFeatureInterest = {
  eventName: "feature_interest_submitted",
  featureId: "xp_income",
} as const

export type XpIncomeFeatureInterest = typeof xpIncomeFeatureInterest

/**
 * Intentional integration seam for the future analytics provider. The placeholder must not emit
 * telemetry or persist anything until that provider and its consent/privacy behavior are ready.
 */
export function recordXpIncomeFeatureInterest(
  event: XpIncomeFeatureInterest
): void {
  void event
}
