import { Outlet, useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

const tabs = [
  {
    value: "character",
    path: "/lookup/character",
    labelKey: "unitLookup.tabs.character",
  },
  { value: "mow", path: "/lookup/mow", labelKey: "unitLookup.tabs.mow" },
  { value: "npc", path: "/lookup/npc", labelKey: "unitLookup.tabs.npc" },
] as const

/**
 * Parent route for the Lookup area: a routed tab bar (Character/MoW/NPC, each its own URL) plus
 * an `<Outlet/>` for the active tab's page. Only the Character tab has real content today; MoW and
 * NPC render a placeholder (see `LookupPlaceholder`) until those datasets/pages are built.
 */
export function LookupPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const activeTab =
    tabs.find((tab) => pathname.startsWith(tab.path))?.value ?? "character"

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
            <TabsTrigger key={tab.value} value={tab.value}>
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Outlet />
    </main>
  )
}
