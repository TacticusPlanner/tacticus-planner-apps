/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

const TodayPage = lazy(() =>
  import("./ui/today-page").then((module) => ({ default: module.TodayPage }))
)
const GuildRaidsPage = lazy(() =>
  import("./ui/guild-raids/guild-raids-page").then((module) => ({
    default: module.GuildRaidsPage,
  }))
)
const ShopsPage = lazy(() =>
  import("./ui/shops-page").then((module) => ({ default: module.ShopsPage }))
)
const ArenaPage = lazy(() =>
  import("./ui/arena/arena-page").then((module) => ({
    default: module.ArenaPage,
  }))
)
const SalvageRunPage = lazy(() =>
  import("./ui/salvage-run/salvage-run-page").then((module) => ({
    default: module.SalvageRunPage,
  }))
)
const OnslaughtPage = lazy(() =>
  import("./ui/onslaught/onslaught-page").then((module) => ({
    default: module.OnslaughtPage,
  }))
)

export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/dailies/raids" /> },
  // Raids is the Today page itself: the multi-day plan lives at Plan > Schedule.
  { path: "raids", element: <TodayPage /> },
  { path: "shops", element: <ShopsPage /> },
  { path: "arena", element: <ArenaPage /> },
  { path: "salvage-run", element: <SalvageRunPage /> },
  { path: "onslaught", element: <OnslaughtPage /> },
  { path: "guild-raids", element: <GuildRaidsPage /> },
]
