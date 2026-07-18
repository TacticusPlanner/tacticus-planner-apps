import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { Settings } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { PageContainer } from "@/widgets/page-container"

import { PlanningSettingsDialog } from "./planning-settings-dialog"

const tabs = [
  { value: "goals", path: "/goals", labelKey: "goals.tabs.goals" },
  {
    value: "project",
    path: "/goals/project",
    labelKey: "goals.tabs.projects",
  },
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
  return <GoalsLayoutContent />
}

function GoalsLayoutContent() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activeTab = pathname.startsWith("/goals/project")
    ? "project"
    : pathname.startsWith("/goals/insights")
      ? "insights"
      : "goals"

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-3">
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
        <Button
          data-testid="goals-planning-settings"
          variant="outline"
          size="sm"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings data-icon="inline-start" />
          {t("goals.planningSettings.button")}
        </Button>
      </div>
      <Outlet />
      {settingsOpen ? (
        <PlanningSettingsDialog open onOpenChange={setSettingsOpen} />
      ) : null}
    </PageContainer>
  )
}
