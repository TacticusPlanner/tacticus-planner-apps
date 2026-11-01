import type { ReactNode } from "react"

import type { FeatureFlag } from "./feature-flags"
import { useFeatureFlagState } from "./use-feature-flag"

type FeatureGateProps = {
  flag: FeatureFlag
  children: ReactNode
  /** Rendered while the flag is off; nothing by default. */
  fallback?: ReactNode
  /**
   * Rendered instead of `fallback` while the flag reads off only because the
   * first flags fetch has not settled, e.g. so a redirect fallback does not
   * fire before the API answers. Defaults to `fallback`.
   */
  pending?: ReactNode
}

/** Renders `children` only while `flag` is on, e.g. around a route element or nav entry. */
export function FeatureGate({
  flag,
  children,
  fallback = null,
  pending = fallback,
}: FeatureGateProps) {
  const state = useFeatureFlagState(flag)
  if (state === "on") return children
  return state === "pending" ? pending : fallback
}
