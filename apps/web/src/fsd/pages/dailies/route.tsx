/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

import { RaidsLayout } from "./ui/raids-layout"

const TodayPage = lazy(() =>
  import("./ui/today-page").then((module) => ({ default: module.TodayPage }))
)
const RaidsPlanPage = lazy(() =>
  import("./ui/raids-plan-page").then((module) => ({
    default: module.RaidsPlanPage,
  }))
)
const DailiesPlaceholderPage = lazy(() =>
  import("./ui/placeholder-page").then((module) => ({
    default: module.DailiesPlaceholderPage,
  }))
)
const ShopsPage = lazy(() =>
  import("./ui/shops-page").then((module) => ({ default: module.ShopsPage }))
)

export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/dailies/raids" /> },
  {
    path: "raids",
    element: <RaidsLayout />,
    children: [
      { index: true, element: <Navigate replace to="/dailies/raids/today" /> },
      { path: "today", element: <TodayPage /> },
      { path: "plan", element: <RaidsPlanPage /> },
    ],
  },
  { path: "shops", element: <ShopsPage /> },
  ...["onslaught", "salvage-run", "arena", "guild-raids"].map((path) => ({
    path,
    element: <DailiesPlaceholderPage />,
  })),
]
