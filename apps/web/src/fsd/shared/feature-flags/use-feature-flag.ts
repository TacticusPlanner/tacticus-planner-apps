import { useQuery } from "@tanstack/react-query"

import type { FeatureFlag } from "./feature-flags"
import { featureFlagsQueryOptions } from "./feature-flags.query"

/** The flags on in this environment (none until the API says otherwise). */
export function useEnabledFeatureFlags(): readonly string[] {
  const { data } = useQuery(featureFlagsQueryOptions())
  return data
}

/** Whether `flag` is on in this environment. Off until the API says otherwise. */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return useEnabledFeatureFlags().includes(flag)
}

/**
 * `flag`'s state, with "pending" while it reads off only because the first
 * fetch is still in flight (no fetch has succeeded yet). A failed fetch settles
 * it as "off".
 */
export function useFeatureFlagState(
  flag: FeatureFlag
): "on" | "off" | "pending" {
  const { data, dataUpdatedAt, fetchStatus } = useQuery(
    featureFlagsQueryOptions()
  )
  if (data.includes(flag)) return "on"
  return dataUpdatedAt === 0 && fetchStatus === "fetching" ? "pending" : "off"
}
