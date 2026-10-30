import { queryOptions } from "@tanstack/react-query"

import { safeStorage } from "@/shared/lib"

import { fetchEnabledFeatureFlags } from "./feature-flags.api"

const storageKey = "tp.featureFlags"

// The API caches flags for 60s (Cache-Control), so refetching sooner gains nothing.
const featureFlagsStaleTime = 60_000

/**
 * The last flags this browser saw, so a returning visitor's gated features do
 * not flash in or out while the request is in flight. Anything unreadable
 * reads as "no flags on".
 */
function readStoredFlags(): string[] {
  try {
    const parsed: unknown = JSON.parse(safeStorage.get(storageKey) ?? "[]")
    return Array.isArray(parsed)
      ? parsed.filter((flag): flag is string => typeof flag === "string")
      : []
  } catch {
    return []
  }
}

export const featureFlagsQueryOptions = () =>
  queryOptions({
    queryKey: ["feature-flags"],
    queryFn: async ({ signal }) => {
      const enabled = await fetchEnabledFeatureFlags(signal)
      safeStorage.set(storageKey, JSON.stringify(enabled))
      return enabled
    },
    // Stored flags render at once, then the fetch replaces them; a failed
    // fetch keeps them (or keeps everything off on a first visit).
    initialData: readStoredFlags,
    initialDataUpdatedAt: 0,
    staleTime: featureFlagsStaleTime,
  })
