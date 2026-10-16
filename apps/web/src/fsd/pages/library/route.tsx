// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

const CharactersListPage = lazy(() =>
  import("./ui/characters/characters-list-page").then((m) => ({
    default: m.CharactersListPage,
  }))
)
const CharacterUnitPage = lazy(() =>
  import("./ui/character-unit/character-unit-page").then((m) => ({
    default: m.CharacterUnitPage,
  }))
)
const MowsListPage = lazy(() =>
  import("./ui/mows/mows-list-page").then((m) => ({
    default: m.MowsListPage,
  }))
)
const MowUnitPage = lazy(() =>
  import("./ui/mow-unit/mow-unit-page").then((m) => ({
    default: m.MowUnitPage,
  }))
)
const NpcsPage = lazy(() =>
  import("./ui/npcs/npcs-page").then((m) => ({ default: m.NpcsPage }))
)
const RaidBossesPage = lazy(() =>
  import("./ui/raid-bosses/raid-bosses-page").then((m) => ({
    default: m.RaidBossesPage,
  }))
)
const ShopsBrowsePage = lazy(() =>
  import("./ui/shops/shops-browse-page").then((m) => ({
    default: m.ShopsBrowsePage,
  }))
)

// Nested under "/library" вЂ” see app/routes.tsx, which owns the top-level path and the (unprotected)
// layout element, and just splices this array in as `children`.
export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/library/characters" /> },
  { path: "characters", element: <CharactersListPage /> },
  { path: "characters/:entityId", element: <CharacterUnitPage /> },
  { path: "machines-of-war", element: <MowsListPage /> },
  { path: "machines-of-war/:entityId", element: <MowUnitPage /> },
  { path: "npcs", element: <NpcsPage /> },
  { path: "npcs/:entityId", element: <NpcsPage /> },
  { path: "raid-bosses", element: <RaidBossesPage /> },
  { path: "raid-bosses/:entityId", element: <RaidBossesPage /> },
  // Shops is a standalone reference route, not an entity collection — no `/:entityId` variant, so it
  // is outside the `library-entity-routes` contract.
  { path: "shops", element: <ShopsBrowsePage /> },
]
