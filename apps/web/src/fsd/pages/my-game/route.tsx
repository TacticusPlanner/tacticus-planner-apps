// This is the route-config module (it exports the `routes` arrays, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate } from "react-router"
import type { RouteObject } from "react-router"

import { redirectOnlyHandle } from "@/shared/analytics"
import { preloadOnMatch } from "@/shared/lib"

// The section layout, lazy-loaded by app/routes.tsx (exported from here so the page's public API
// never statically pulls the layout into the entry chunk).
const loadMyGameLayout = () =>
  import("./ui/my-game-layout").then((m) => ({ default: m.MyGameLayout }))
export const MyGameLayout = lazy(loadMyGameLayout)
export const preloadMyGameLayout = preloadOnMatch(loadMyGameLayout)

const loadCollectionPage = () =>
  import("./ui/collection/collection-page").then((m) => ({
    default: m.CollectionPage,
  }))
const CollectionPage = lazy(loadCollectionPage)
const loadCampaignsPage = () =>
  import("./ui/campaigns-page").then((m) => ({ default: m.CampaignsPage }))
const CampaignsPage = lazy(loadCampaignsPage)
const loadCampaignEventsPage = () =>
  import("./ui/campaign-events-page").then((m) => ({
    default: m.CampaignEventsPage,
  }))
const CampaignEventsPage = lazy(loadCampaignEventsPage)
const loadIncursionsPage = () =>
  import("./ui/incursions-page").then((m) => ({
    default: m.IncursionsPage,
  }))
const IncursionsPage = lazy(loadIncursionsPage)
const loadIncursionsOverview = () =>
  import("./ui/incursions/incursions-overview").then((m) => ({
    default: m.IncursionsOverview,
  }))
const IncursionsOverview = lazy(loadIncursionsOverview)
const loadIncursionMowPage = () =>
  import("./ui/incursions/incursion-mow-page").then((m) => ({
    default: m.IncursionMowPage,
  }))
const IncursionMowPage = lazy(loadIncursionMowPage)
const loadIncursionTierPage = () =>
  import("./ui/incursions/incursion-tier-page").then((m) => ({
    default: m.IncursionTierPage,
  }))
const IncursionTierPage = lazy(loadIncursionTierPage)
const loadInventoryPage = () =>
  import("./ui/inventory/inventory-page").then((m) => ({
    default: m.InventoryPage,
  }))
const InventoryPage = lazy(loadInventoryPage)
const loadInventoryUpgradesTab = () =>
  import("./ui/inventory/inventory-upgrades-tab").then((m) => ({
    default: m.InventoryUpgradesTab,
  }))
const InventoryUpgradesTab = lazy(loadInventoryUpgradesTab)
const loadInventoryAscensionTab = () =>
  import("./ui/inventory/inventory-ascension-tab").then((m) => ({
    default: m.InventoryAscensionTab,
  }))
const InventoryAscensionTab = lazy(loadInventoryAscensionTab)
const loadItemsPage = () =>
  import("./ui/items/items-page").then((m) => ({ default: m.ItemsPage }))
const ItemsPage = lazy(loadItemsPage)
const loadItemsPiecesTab = () =>
  import("./ui/items/items-pieces-tab").then((m) => ({
    default: m.ItemsPiecesTab,
  }))
const ItemsPiecesTab = lazy(loadItemsPiecesTab)
const loadItemsSuggestionsTab = () =>
  import("./ui/items/items-suggestions-tab").then((m) => ({
    default: m.ItemsSuggestionsTab,
  }))
const ItemsSuggestionsTab = lazy(loadItemsSuggestionsTab)
const loadItemsReclaimTab = () =>
  import("./ui/items/items-reclaim-tab").then((m) => ({
    default: m.ItemsReclaimTab,
  }))
const ItemsReclaimTab = lazy(loadItemsReclaimTab)
const loadTeamsPage = () =>
  import("./ui/teams/teams-page").then((m) => ({ default: m.TeamsPage }))
const TeamsPage = lazy(loadTeamsPage)

// Nested under "/my-game" — see app/routes.tsx, which owns the top-level path and the layout
// element. My Game mixes a public page with sign-in-only ones, so the routes come in two lists:
// app/routes.tsx mounts `publicRoutes` as they are and wraps each of `protectedRoutes` in its
// ProtectedRoute (which this page slice cannot import). The "onslaught" child lives in
// app/routes.tsx too: it's a *different* page slice (pages/onslaught), and FSD forbids one page
// slice importing another's internals directly.
export const publicRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate replace to="/my-game/collection" />,
    handle: redirectOnlyHandle,
  },
  {
    path: "collection",
    element: <CollectionPage />,
    loader: preloadOnMatch(loadCollectionPage),
  },
]

export const protectedRoutes: RouteObject[] = [
  {
    path: "inventory",
    element: <InventoryPage />,
    loader: preloadOnMatch(loadInventoryPage),
    // Each tab is its own route, so a tab can be linked and keeps its own query.
    children: [
      {
        index: true,
        element: <Navigate replace to="/my-game/inventory/upgrades" />,
        handle: redirectOnlyHandle,
      },
      {
        path: "upgrades",
        element: <InventoryUpgradesTab />,
        loader: preloadOnMatch(loadInventoryUpgradesTab),
      },
      {
        path: "ascension",
        element: <InventoryAscensionTab />,
        loader: preloadOnMatch(loadInventoryAscensionTab),
      },
    ],
  },
  {
    path: "items",
    element: <ItemsPage />,
    loader: preloadOnMatch(loadItemsPage),
    // The page reads and joins the synced items once; its tabs share them through the outlet.
    children: [
      {
        index: true,
        element: <Navigate replace to="/my-game/items/pieces" />,
        handle: redirectOnlyHandle,
      },
      {
        path: "pieces",
        element: <ItemsPiecesTab />,
        loader: preloadOnMatch(loadItemsPiecesTab),
      },
      {
        path: "suggestions",
        element: <ItemsSuggestionsTab />,
        loader: preloadOnMatch(loadItemsSuggestionsTab),
      },
      {
        path: "reclaim",
        element: <ItemsReclaimTab />,
        loader: preloadOnMatch(loadItemsReclaimTab),
      },
    ],
  },
  {
    path: "campaigns",
    element: <CampaignsPage />,
    loader: preloadOnMatch(loadCampaignsPage),
  },
  {
    path: "campaign-events",
    element: <CampaignEventsPage />,
    loader: preloadOnMatch(loadCampaignEventsPage),
  },
  {
    path: "incursions",
    element: <IncursionsPage />,
    loader: preloadOnMatch(loadIncursionsPage),
    // The section loads its data once; its pages share it (and unsaved stars) through the outlet.
    children: [
      {
        index: true,
        element: <IncursionsOverview />,
        loader: preloadOnMatch(loadIncursionsOverview),
      },
      {
        path: ":mowId",
        element: <IncursionMowPage />,
        loader: preloadOnMatch(loadIncursionMowPage),
      },
      {
        path: ":mowId/:tier",
        element: <IncursionTierPage />,
        loader: preloadOnMatch(loadIncursionTierPage),
      },
    ],
  },
  {
    path: "teams",
    element: <TeamsPage />,
    loader: preloadOnMatch(loadTeamsPage),
  },
]
