import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import type { NavItem } from "./nav-items"

/**
 * Renders the active top-level section's child pages as a routed tab row. Rendered by the mobile
 * header only - the desktop header shows a static breadcrumb and no picker, and desktop reaches
 * child pages through the sidebar flyout instead. Replaces each page's own previously-separate
 * `Tabs` block (`GoalsLayout`, `ProgressLayout`, `LibraryPage`, `GuildRegisteredView`,
 * `DailiesLayout`). Renders nothing for a section with no children (e.g. Home).
 */
export function SectionTabs({ item }: { item: NavItem }) {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies", "library"])
  const { pathname } = useLocation()
  const navigate = useNavigate()
  // Radix activates a trigger on mousedown and again on the focus that immediately follows it. While
  // react-router's transition is still in flight the second call still sees the tab as unselected,
  // so one click asks to navigate twice and pushes two identical history entries - a Back button
  // that needs two presses. A ref, not state: it is stable across renders, so the second call reads
  // the first call's target even though its own closure is a render behind.
  const navigatingTo = useRef<string | null>(null)
  useEffect(() => {
    navigatingTo.current = null
  }, [pathname])
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
        if (value === pathname || navigatingTo.current === value) return
        navigatingTo.current = value
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
            // Covers the one activation Radix never reports: the tab is already the selected value
            // (the prefix match above keeps a nested route showing its parent tab), so
            // `onValueChange` does not fire and the tab is otherwise inert. Both guards are
            // load-bearing against a double navigation when a *different* tab is clicked: Radix
            // activates on mousedown, so `onValueChange` navigates before this handler runs, and
            // react-router's `startTransition` means the re-render may or may not have committed by
            // then - either the pathname already matches, or this tab is not yet `active`.
            onClick={() => {
              if (!child.isLandingPage) return
              if (active !== child.path || pathname === child.path) return
              void navigate(child.path)
            }}
            value={child.path}
          >
            {t(child.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
