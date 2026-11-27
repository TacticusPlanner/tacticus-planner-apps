import type { CatalogItem } from "./owned-items"
import type { ReclaimStack } from "./reclaim"
import { readFlag, writeUrlQuery } from "@/shared/lib"

/** The Reclaim tab's search and chips, carried in the URL. */
export type ReclaimQuery = {
  q: string
  /** Only stacks with copies safe to reclaim (on by default). */
  safe: boolean
  /** Only copies above level 1. */
  upgraded: boolean
}

export const DEFAULT_RECLAIM_QUERY: ReclaimQuery = {
  q: "",
  safe: true,
  upgraded: false,
}

export const readReclaimQuery = (params: URLSearchParams): ReclaimQuery => ({
  q: params.get("q") ?? "",
  safe: readFlag(params, "safe", true),
  upgraded: readFlag(params, "upgraded"),
})

export const writeReclaimQuery = (
  params: URLSearchParams,
  patch: Partial<ReclaimQuery>
): URLSearchParams => writeUrlQuery(params, patch, DEFAULT_RECLAIM_QUERY)

/** The stacks the query keeps; `nameOf` is the item's displayed name, which the search matches. */
export function filterReclaimStacks<Item extends CatalogItem>(
  stacks: readonly ReclaimStack<Item>[],
  query: ReclaimQuery,
  { nameOf, locale }: { nameOf: (item: Item) => string; locale: string }
): ReclaimStack<Item>[] {
  const search = query.q.trim().toLocaleLowerCase(locale)
  return stacks.filter(
    (stack) =>
      (!query.safe || stack.safe > 0) &&
      (!query.upgraded || stack.level > 1) &&
      (search === "" ||
        nameOf(stack.item).toLocaleLowerCase(locale).includes(search))
  )
}

/** Stacks in groups by slot type, keeping their order. */
export function groupReclaimStacks<Item extends CatalogItem>(
  stacks: readonly ReclaimStack<Item>[]
): { slot: string; stacks: ReclaimStack<Item>[] }[] {
  const groups = new Map<string, ReclaimStack<Item>[]>()
  for (const stack of stacks) {
    const group = groups.get(stack.item.type) ?? []
    group.push(stack)
    groups.set(stack.item.type, group)
  }
  return [...groups].map(([slot, entries]) => ({ slot, stacks: entries }))
}
