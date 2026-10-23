// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

import { preloadOnMatch } from "@/shared/lib"

// The section layout, lazy-loaded by app/routes.tsx (exported from here so the page's public API
// never statically pulls the layout into the entry chunk).
const loadLibraryPage = () =>
  import("./ui/library-page").then((m) => ({ default: m.LibraryPage }))
export const LibraryPage = lazy(loadLibraryPage)
export const preloadLibraryPage = preloadOnMatch(loadLibraryPage)

const loadCharactersListPage = () =>
  import("./ui/characters/characters-list-page").then((m) => ({
    default: m.CharactersListPage,
  }))
const CharactersListPage = lazy(loadCharactersListPage)
const loadCharacterUnitPage = () =>
  import("./ui/character-unit/character-unit-page").then((m) => ({
    default: m.CharacterUnitPage,
  }))
const CharacterUnitPage = lazy(loadCharacterUnitPage)
const loadMowsListPage = () =>
  import("./ui/mows/mows-list-page").then((m) => ({
    default: m.MowsListPage,
  }))
const MowsListPage = lazy(loadMowsListPage)
const loadMowUnitPage = () =>
  import("./ui/mow-unit/mow-unit-page").then((m) => ({
    default: m.MowUnitPage,
  }))
const MowUnitPage = lazy(loadMowUnitPage)
const loadNpcsPage = () =>
  import("./ui/npcs/npcs-page").then((m) => ({ default: m.NpcsPage }))
const NpcsPage = lazy(loadNpcsPage)
const loadRaidBossesPage = () =>
  import("./ui/raid-bosses/raid-bosses-page").then((m) => ({
    default: m.RaidBossesPage,
  }))
const RaidBossesPage = lazy(loadRaidBossesPage)
const loadShopsBrowsePage = () =>
  import("./ui/shops/shops-browse-page").then((m) => ({
    default: m.ShopsBrowsePage,
  }))
const ShopsBrowsePage = lazy(loadShopsBrowsePage)

// Nested under "/library" вЂ” see app/routes.tsx, which owns the top-level path and the (unprotected)
// layout element, and just splices this array in as `children`.
export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/library/characters" /> },
  {
    path: "characters",
    element: <CharactersListPage />,
    loader: preloadOnMatch(loadCharactersListPage),
  },
  {
    path: "characters/:entityId",
    element: <CharacterUnitPage />,
    loader: preloadOnMatch(loadCharacterUnitPage),
  },
  {
    path: "machines-of-war",
    element: <MowsListPage />,
    loader: preloadOnMatch(loadMowsListPage),
  },
  {
    path: "machines-of-war/:entityId",
    element: <MowUnitPage />,
    loader: preloadOnMatch(loadMowUnitPage),
  },
  { path: "npcs", element: <NpcsPage />, loader: preloadOnMatch(loadNpcsPage) },
  {
    path: "npcs/:entityId",
    element: <NpcsPage />,
    loader: preloadOnMatch(loadNpcsPage),
  },
  {
    path: "raid-bosses",
    element: <RaidBossesPage />,
    loader: preloadOnMatch(loadRaidBossesPage),
  },
  {
    path: "raid-bosses/:entityId",
    element: <RaidBossesPage />,
    loader: preloadOnMatch(loadRaidBossesPage),
  },
  // Shops is a standalone reference route, not an entity collection — no `/:entityId` variant, so it
  // is outside the `library-entity-routes` contract.
  {
    path: "shops",
    element: <ShopsBrowsePage />,
    loader: preloadOnMatch(loadShopsBrowsePage),
  },
]
