/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

import { preloadOnMatch } from "@/shared/lib"

// The section layout, lazy-loaded by app/routes.tsx (exported from here so the page's public API
// never statically pulls the layout into the entry chunk).
const loadDailiesLayout = () =>
  import("./ui/dailies-layout").then((m) => ({ default: m.DailiesLayout }))
export const DailiesLayout = lazy(loadDailiesLayout)
export const preloadDailiesLayout = preloadOnMatch(loadDailiesLayout)

const loadTodayPage = () =>
  import("./ui/today-page").then((module) => ({ default: module.TodayPage }))
const TodayPage = lazy(loadTodayPage)
const loadHsePage = () =>
  import("./ui/hse-page").then((module) => ({ default: module.HsePage }))
const HsePage = lazy(loadHsePage)
const loadHrePage = () =>
  import("./ui/hre-page").then((module) => ({ default: module.HrePage }))
const HrePage = lazy(loadHrePage)
const loadGuildRaidsPage = () =>
  import("./ui/guild-raids/guild-raids-page").then((module) => ({
    default: module.GuildRaidsPage,
  }))
const GuildRaidsPage = lazy(loadGuildRaidsPage)
const loadShopsPage = () =>
  import("./ui/shops-page").then((module) => ({ default: module.ShopsPage }))
const ShopsPage = lazy(loadShopsPage)

export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/dailies/raids" /> },
  // Raids is the Today page itself: the multi-day plan lives at Plan > Schedule.
  {
    path: "raids",
    element: <TodayPage />,
    loader: preloadOnMatch(loadTodayPage),
  },
  { path: "hse", element: <HsePage />, loader: preloadOnMatch(loadHsePage) },
  { path: "hre", element: <HrePage />, loader: preloadOnMatch(loadHrePage) },
  {
    path: "shops",
    element: <ShopsPage />,
    loader: preloadOnMatch(loadShopsPage),
  },
  {
    path: "guild-raids",
    element: <GuildRaidsPage />,
    loader: preloadOnMatch(loadGuildRaidsPage),
  },
]
