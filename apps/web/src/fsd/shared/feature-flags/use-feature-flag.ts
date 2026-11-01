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
