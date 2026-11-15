import { DEFAULT_SIGNED_IN_PATH, resolveNextPath } from "./resolve-next-path"

/**
 * Where finishing setup lands. A remembered destination wins; otherwise, when setup imported goals
 * from V1, the Goals page opens on the import's project, so the import visibly worked — the default
 * landing gives no sign of it.
 */
export function arrivalPath(
  next: string | null,
  importProjectId: string | null
): string {
  const resolved = resolveNextPath(next)
  if (!importProjectId) return resolved
  if (resolved !== DEFAULT_SIGNED_IN_PATH && resolved !== "/") return resolved
  return `/plan/goals?project=${encodeURIComponent(importProjectId)}`
}
