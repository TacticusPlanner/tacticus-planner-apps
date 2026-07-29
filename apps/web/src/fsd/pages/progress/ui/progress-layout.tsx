import { Outlet, useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { PageContainer } from "@/widgets/page-container"

const tabs = [
  { value: "onslaught", path: "/progress/onslaught" },
  { value: "campaigns", path: "/progress/campaigns" },
  { value: "campaign-events", path: "/progress/campaign-events" },
  { value: "xp-income", path: "/progress/xp-income" },
] as const

export function ProgressLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const active = pathname.endsWith("/xp-income")
    ? "xp-income"
    : pathname.endsWith("/campaign-events")
      ? "campaign-events"
      : pathname.endsWith("/campaigns")
        ? "campaigns"
        : "onslaught"

  return (
    <PageContainer>
      <Tabs
        value={active}
        onValueChange={(value) => {
          const tab = tabs.find((entry) => entry.value === value)
          if (tab) void navigate(tab.path)
        }}
      >
        <TabsList variant="line" className="max-w-full overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {t(`progress.tabs.${tab.value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Outlet />
    </PageContainer>
  )
}
