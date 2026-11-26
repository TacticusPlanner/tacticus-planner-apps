import { lazy } from "react"

const loadNavigationPalette = () =>
  import("./navigation-palette").then((m) => ({
    default: m.NavigationPalette,
  }))

/** Navigation search's list, loaded on first use: it carries cmdk, which the startup bundle must
 *  not (see bundle-budget.json). */
export const LazyNavigationPalette = lazy(loadNavigationPalette)

/** Starts loading the list before search opens (pointer over or focus on a search launcher). */
export function preloadNavigationPalette(): void {
  void loadNavigationPalette()
}
