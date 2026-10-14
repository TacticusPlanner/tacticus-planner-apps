/**
 * Where a unit page was opened from, carried in router history state so it survives reload and
 * back/forward but never appears in a shared URL. It decides the back button's target and label and
 * the order prev/next walk. Without it (a bookmark or shared link) the page falls back to its list's
 * default order.
 */
export type UnitOrigin = {
  kind: "list" | "collection"
  /** The units in the order the origin showed them. */
  ids: readonly string[]
}

type OriginState = { unitOrigin?: UnitOrigin }

export function readUnitOrigin(state: unknown): UnitOrigin | undefined {
  const origin = (state as OriginState | null | undefined)?.unitOrigin
  if (
    !origin ||
    (origin.kind !== "list" && origin.kind !== "collection") ||
    !Array.isArray(origin.ids)
  ) {
    return undefined
  }
  return origin
}

export function unitOriginState(origin: UnitOrigin): OriginState {
  return { unitOrigin: origin }
}

export type UnitNeighbours = {
  /** 0-based position in the order, or -1 when the unit isn't in it. */
  index: number
  total: number
  previousId?: string
  nextId?: string
}

export function unitNeighbours(
  ids: readonly string[],
  unitId: string
): UnitNeighbours {
  const index = ids.indexOf(unitId)
  if (index === -1) return { index, total: ids.length }
  return {
    index,
    total: ids.length,
    previousId: index > 0 ? ids[index - 1] : undefined,
    nextId: index < ids.length - 1 ? ids[index + 1] : undefined,
  }
}
