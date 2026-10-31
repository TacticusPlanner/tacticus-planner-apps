import type { ReactNode } from "react"

import type { FeatureFlag } from "./feature-flags"
import { useFeatureFlag } from "./use-feature-flag"

type FeatureGateProps = {
  flag: FeatureFlag
  children: ReactNode
  /** Rendered while the flag is off; nothing by default. */
  fallback?: ReactNode
}

/** Renders `children` only while `flag` is on, e.g. around a route element or nav entry. */
export function FeatureGate({
  flag,
  children,
  fallback = null,
}: FeatureGateProps) {
  return useFeatureFlag(flag) ? children : fallback
}
