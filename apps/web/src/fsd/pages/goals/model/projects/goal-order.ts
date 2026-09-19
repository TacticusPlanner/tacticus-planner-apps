/**
 * Splices a dragged goal into the project's complete in-flight priority order, anchored against its
 * new *visible* neighbor — not gated on the current sort/filter/group matching true priority order
 * (design.md: dragging is always well-defined this way, regardless of what's currently displayed).
 * Anchors before the nearest following visible neighbor that's actually in `fullOrderedIds` (a
 * historical goal can be visible — interleaved by Sort — but isn't part of the in-flight order being
 * spliced, so it's skipped over as an anchor, not treated as a dead end), or after the nearest
 * preceding one when nothing usable follows.
 */
export function spliceGoalOrder(
  fullOrderedIds: readonly string[],
  visibleOrderedIds: readonly string[],
  movedId: string
): string[] {
  const withoutMoved = fullOrderedIds.filter((id) => id !== movedId)
  const inFullList = new Set(withoutMoved)
  const visibleIndex = visibleOrderedIds.indexOf(movedId)

  const nextVisibleId = visibleOrderedIds
    .slice(visibleIndex + 1)
    .find((id) => inFullList.has(id))
  if (nextVisibleId !== undefined) {
    const insertAt = withoutMoved.indexOf(nextVisibleId)
    return [
      ...withoutMoved.slice(0, insertAt),
      movedId,
      ...withoutMoved.slice(insertAt),
    ]
  }

  const prevVisibleId = visibleOrderedIds
    .slice(0, Math.max(visibleIndex, 0))
    .reverse()
    .find((id) => inFullList.has(id))
  if (prevVisibleId !== undefined) {
    const insertAt = withoutMoved.indexOf(prevVisibleId)
    return [
      ...withoutMoved.slice(0, insertAt + 1),
      movedId,
      ...withoutMoved.slice(insertAt + 1),
    ]
  }

  // No usable neighbor to anchor against (every other visible row is historical, or there was only
  // one visible row) — append rather than drop the goal silently.
  return [...withoutMoved, movedId]
}
