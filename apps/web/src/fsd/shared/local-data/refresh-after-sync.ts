import type { QueryClient } from "@tanstack/react-query"

import { localDataKeys, type LocalDataSource } from "./use-local-data"

const channelName = "tacticus-planner-local-data"

type RefreshMessage = { source: LocalDataSource; keys: string[] }
// Sign-out in one tab: every other tab drops the reads it holds from the deleted databases.
type ClearMessage = { cleared: true }

/** The keys a sync stored (`downloaded`) or dropped (`removed`), from its result or from the
 *  error a partly failed sync rejects with (`ManifestSyncError` carries the same lists). */
export function writtenKeys(outcome: unknown): string[] {
  if (typeof outcome !== "object" || outcome === null) return []
  const { downloaded, removed } = outcome as {
    downloaded?: unknown
    removed?: unknown
  }
  return [downloaded, removed].flatMap((list) =>
    Array.isArray(list) ? (list as string[]) : []
  )
}

function invalidate(
  queryClient: QueryClient,
  { source, keys }: RefreshMessage
) {
  if (keys.length === 0) return
  for (const key of keys) {
    void queryClient.invalidateQueries({
      queryKey: localDataKeys.item(source, key),
    })
  }
  // Composite reads do not name their datasets; they are cheap local reads.
  void queryClient.invalidateQueries({ queryKey: localDataKeys.composite })
}

function openChannel(): BroadcastChannel | null {
  return typeof BroadcastChannel === "undefined"
    ? null
    : new BroadcastChannel(channelName)
}

/** Refreshes exactly the datasets a sync wrote, here and in every other open tab. A sync that
 *  wrote nothing refreshes nothing. */
export function refreshLocalDataAfterSync(
  queryClient: QueryClient,
  source: LocalDataSource,
  keys: string[]
) {
  const message = { source, keys }
  invalidate(queryClient, message)
  if (keys.length === 0) return
  const channel = openChannel()
  channel?.postMessage(message)
  channel?.close()
}

/** Applies refreshes posted by other tabs; returns the unsubscribe. Without `BroadcastChannel`
 *  another tab picks the new data up on its next reload. */
export function listenForLocalDataRefresh(
  queryClient: QueryClient
): () => void {
  const channel = openChannel()
  if (!channel) return () => undefined
  channel.onmessage = (event: MessageEvent<RefreshMessage | ClearMessage>) => {
    if ("cleared" in event.data) removeLocalReads(queryClient)
    else invalidate(queryClient, event.data)
  }
  return () => channel.close()
}

function removeLocalReads(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: localDataKeys.all })
  queryClient.removeQueries({ queryKey: ["sync"] })
}

let appQueryClient: QueryClient | null = null

/** Registers the app's query client so sign-out can drop the local reads it holds. */
export function registerLocalDataQueryClient(queryClient: QueryClient) {
  appQueryClient = queryClient
}

/** Drops every cached local read and sync run (sign-out deletes the databases they came from), here
 *  and in every other open tab, so the next account starts from an empty cache and syncs again. */
export function clearLocalDataCache() {
  if (appQueryClient) removeLocalReads(appQueryClient)
  const channel = openChannel()
  channel?.postMessage({ cleared: true } satisfies ClearMessage)
  channel?.close()
}
