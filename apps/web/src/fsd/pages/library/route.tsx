// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"
import { getMows } from "@workspace/game-catalog/queries"

const CharacterLookupPage = lazy(() =>
  import("./ui/character/character-lookup-page").then((m) => ({
    default: m.CharacterLookupPage,
  }))
)
const LibraryCollectionPage = lazy(() =>
  import("./ui/library-collection-page").then((m) => ({
    default: m.LibraryCollectionPage,
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
  { path: "characters", element: <CharacterLookupPage /> },
  { path: "characters/:entityId", element: <CharacterLookupPage /> },
  {
    path: "machines-of-war",
    element: (
      <LibraryCollectionPage
        collection="machines-of-war"
        getRecords={getMows}
      />
    ),
  },
  {
    path: "machines-of-war/:entityId",
    element: (
      <LibraryCollectionPage
        collection="machines-of-war"
        getRecords={getMows}
      />
    ),
  },
  { path: "npcs", element: <NpcsPage /> },
  { path: "npcs/:entityId", element: <NpcsPage /> },
  { path: "raid-bosses", element: <RaidBossesPage /> },
  { path: "raid-bosses/:entityId", element: <RaidBossesPage /> },
  // Shops is a standalone reference route, not an entity collection — no `/:entityId` variant, so it
  // is outside the `library-entity-routes` contract.
  { path: "shops", element: <ShopsBrowsePage /> },
]
