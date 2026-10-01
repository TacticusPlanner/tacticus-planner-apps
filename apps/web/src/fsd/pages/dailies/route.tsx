/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

const TodayPage = lazy(() =>
  import("./ui/today-page").then((module) => ({ default: module.TodayPage }))
)
const HsePage = lazy(() =>
  import("./ui/hse-page").then((module) => ({ default: module.HsePage }))
)
const GuildRaidsPage = lazy(() =>
  import("./ui/guild-raids/guild-raids-page").then((module) => ({
    default: module.GuildRaidsPage,
  }))
)
const ShopsPage = lazy(() =>
  import("./ui/shops-page").then((module) => ({ default: module.ShopsPage }))
)

export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/dailies/raids" /> },
  // Raids is the Today page itself: the multi-day plan lives at Plan > Schedule.
  { path: "raids", element: <TodayPage /> },
  { path: "hse", element: <HsePage /> },
  { path: "shops", element: <ShopsPage /> },
  { path: "guild-raids", element: <GuildRaidsPage /> },
]
