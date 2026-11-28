import { useCallback } from "react"
import { useSearchParams } from "react-router"

/**
 * The unit page's active tab, in the `tab` query parameter so it survives reload and can be linked.
 * The first tab is the default and is written as no parameter; an unknown value shows the default.
 * Switching changes only `tab`, so other parameters (the calculator's range) are kept.
 */
export function useUnitTab<Tab extends string>(
  tabs: readonly [Tab, ...Tab[]]
): [Tab, (tab: Tab) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get("tab")
  const defaultTab = tabs[0]
  const active =
    requested && (tabs as readonly string[]).includes(requested)
      ? (requested as Tab)
      : defaultTab

  const select = useCallback(
    (tab: Tab) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (tab === defaultTab) next.delete("tab")
          else next.set("tab", tab)
          return next
        },
        { preventScrollReset: true }
      )
    },
    [defaultTab, setSearchParams]
  )

  return [active, select]
}
