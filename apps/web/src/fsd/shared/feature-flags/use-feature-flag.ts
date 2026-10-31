import { useQuery } from "@tanstack/react-query"

import type { FeatureFlag } from "./feature-flags"
import { featureFlagsQueryOptions } from "./feature-flags.query"

/** Whether `flag` is on in this environment. Off until the API says otherwise. */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { data } = useQuery(featureFlagsQueryOptions())
  return data.includes(flag)
}
