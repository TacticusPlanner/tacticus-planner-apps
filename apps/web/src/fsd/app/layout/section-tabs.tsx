import { useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import type { NavItem } from "./nav-items"

/**
 * Renders the active top-level section's child pages as a routed tab row, shared by both the
 * desktop and mobile headers - replacing each page's own previously-separate `Tabs` block
 * (`GoalsLayout`, `ProgressLayout`, `LibraryPage`, `GuildRegisteredView`, `DailiesLayout`). Renders
 * nothing for a section with no children (e.g. Home).
 */
export function SectionTabs({ item }: { item: NavItem }) {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies", "library"])
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const children = item.children

  if (!children?.length) return null

  const active =
    children.find(
      (child) =>
        pathname === child.path || pathname.startsWith(child.path + "/")
    )?.path ?? children[0].path

  return (
    <Tabs
      value={active}
      onValueChange={(value) => {
        void navigate(value)
      }}
    >
      {/* overflow-y-hidden avoids a spurious vertical scrollbar: overflow-x-auto alone forces
          overflow-y to also compute as 'auto' per the CSS overflow spec, which then clips and
          scrolls on any sub-pixel vertical overflow (e.g. the "line" variant's underline). */}
      <TabsList
        className="max-w-full justify-start overflow-x-auto overflow-y-hidden"
        data-testid="section-tabs"
        variant="line"
      >
        {children.map((child) => (
          <TabsTrigger
            data-testid={`section-tab-${child.path.slice(1).replaceAll("/", "-")}`}
            key={child.path}
            value={child.path}
          >
            {t(child.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
