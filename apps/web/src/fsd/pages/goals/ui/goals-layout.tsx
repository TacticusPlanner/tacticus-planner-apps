import { Outlet, useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

const tabs = [
  { value: "goals", path: "/goals", labelKey: "goals.tabs.goals" },
  {
    value: "insights",
    path: "/goals/insights",
    labelKey: "goals.tabs.insights",
  },
] as const

/**
 * Parent route for the Goals area (plan §16 phase 7): a routed tab bar (Goals list/grid | Insights,
 * each its own URL) plus an `<Outlet/>` for the active tab's page — mirrors `pages/lookup`'s
 * `LookupPage`.
 */
export function GoalsLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const activeTab = pathname.startsWith("/goals/insights")
    ? "insights"
    : "goals"

  return (
    <main className="mx-auto flex w-full max-w-400 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const tab = tabs.find((t) => t.value === value)
          if (tab) void navigate(tab.path)
        }}
      >
        <TabsList variant="line">
          {tabs.map((tab) => (
            <TabsTrigger
              data-testid={`goals-layout-tab-${tab.value}`}
              key={tab.value}
              value={tab.value}
            >
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Outlet />
    </main>
  )
}
