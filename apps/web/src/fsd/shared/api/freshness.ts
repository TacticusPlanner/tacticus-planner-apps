// How long server-owned per-user data stays fresh in the query cache. Only this
// client writes it, and every mutation writes its response into the cache, so a
// remount within the window is served from the cache (spec: client-data-freshness).
export const SERVER_DATA_STALE_TIME = 5 * 60 * 1000
