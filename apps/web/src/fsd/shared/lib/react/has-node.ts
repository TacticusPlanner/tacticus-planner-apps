import type { ReactNode } from "react"

/**
 * Whether an optional slot was filled: `{hasNode(footer) ? <Footer>{footer}</Footer> : null}`.
 * A falsy node (undefined, null, false, "" or 0) counts as empty, like a plain truthiness check,
 * so a slot passed `cond && <X />` stays empty when `cond` is false.
 */
export function hasNode(node: ReactNode): boolean {
  return Boolean(node)
}
