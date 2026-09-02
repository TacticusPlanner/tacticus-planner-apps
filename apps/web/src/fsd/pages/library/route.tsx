// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

const CharacterLookupPage = lazy(() =>
  import("./ui/character/character-lookup-page").then((m) => ({
    default: m.CharacterLookupPage,
  }))
)
const LookupPlaceholder = lazy(() =>
  import("./ui/library-placeholder").then((m) => ({
    default: m.LookupPlaceholder,
  }))
)

// Nested under "/library" вЂ” see app/routes.tsx, which owns the top-level path and the (unprotected)
// layout element, and just splices this array in as `children`.
export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/library/characters" /> },
  { path: "characters", element: <CharacterLookupPage /> },
  { path: "characters/:characterId", element: <CharacterLookupPage /> },
  { path: "machines-of-war", element: <LookupPlaceholder tab="mow" /> },
  {
    path: "machines-of-war/:entityId",
    element: <LookupPlaceholder tab="mow" />,
  },
  { path: "npcs", element: <LookupPlaceholder tab="npc" /> },
  { path: "npcs/:entityId", element: <LookupPlaceholder tab="npc" /> },
  { path: "raid-bosses", element: <LookupPlaceholder tab="raidBoss" /> },
  {
    path: "raid-bosses/:entityId",
    element: <LookupPlaceholder tab="raidBoss" />,
  },
]
