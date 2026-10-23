export type ManifestSyncProgress<K extends string> = {
  downloaded: number
  total: number
  current?: K
}

export type ManifestSyncResult<K extends string> = {
  downloaded: K[]
  removed: K[]
}

export type ManifestSyncOptions<K extends string, I> = {
  /** The changed items the manifest selected for download. */
  items: readonly I[]
  keyOf: (item: I) => K
  /** Fetches one item and writes it to local storage. */
  download: (item: I) => Promise<void>
  /** Runs only when every item downloaded; returns the keys it removed (withdrawn items). */
  finalize: () => Promise<K[]>
  /** Names the items in the failure message, e.g. "catalog dataset". */
  label: string
  onProgress?: (progress: ManifestSyncProgress<K>) => void
}

/** A sync that failed part-way; `downloaded` lists the items stored before it gave up. */
export class ManifestSyncError<K extends string> extends Error {
  readonly downloaded: K[]
  readonly removed: K[]

  constructor(message: string, downloaded: K[], removed: K[] = []) {
    super(message)
    this.name = "ManifestSyncError"
    this.downloaded = downloaded
    this.removed = removed
  }
}

const downloadConcurrency = 4

/** Runs `worker` over `items` with at most `limit` calls pending at once, in input order. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0

  async function lane() {
    while (next < items.length) {
      const index = next++
      results[index] = await worker(items[index] as T)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane))
  return results
}

/**
 * The download half of a manifest-driven delta sync, shared by the catalog and player data:
 * downloads every changed item (at most 4 at once), collects per-item failures instead of aborting,
 * and only finalizes (advances manifest metadata, drops withdrawn items) when nothing failed.
 */
export async function runManifestSync<K extends string, I>({
  items,
  keyOf,
  download,
  finalize,
  label,
  onProgress,
}: ManifestSyncOptions<K, I>): Promise<ManifestSyncResult<K>> {
  const total = items.length
  const downloaded: K[] = []
  const failures: { key: K; error: unknown }[] = []

  onProgress?.({ downloaded: 0, total })

  await mapWithConcurrency(items, downloadConcurrency, async (item) => {
    const key = keyOf(item)
    onProgress?.({ downloaded: downloaded.length, total, current: key })

    try {
      await download(item)
      downloaded.push(key)
    } catch (error) {
      failures.push({ key, error })
    }

    onProgress?.({ downloaded: downloaded.length, total, current: key })
  })

  if (failures.length > 0) {
    // The failed items' metadata was not written, so the next sync re-selects them.
    const detail = failures
      .map((failure) => `${failure.key}: ${describeError(failure.error)}`)
      .join("; ")

    throw new ManifestSyncError(
      `Failed to sync ${failures.length} ${label}(s) — ${detail}`,
      downloaded
    )
  }

  const removed = await finalize()
  return { downloaded, removed }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
