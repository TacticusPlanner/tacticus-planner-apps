import { ChevronDown } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import type { NavItem } from "./nav-items"

// Above this many children, an inline nav row beside the section title no longer reads well in
// one header row - fall back to a breadcrumb dropdown instead (see design.md's "Desktop header
// composition" decision). Matches today's largest section (Dailies, 6) so every current section
// renders inline; only a future section growing past 6 would hit the dropdown.
const MAX_INLINE_TABS = 6

function slug(path: string) {
  return path.slice(1).replaceAll("/", "-")
}

/**
 * Renders the desktop header's title row: the active top-level section's own name, plus - when
 * it has child pages - either an inline row of plain nav-style links (few children) or a
 * breadcrumb dropdown reading "Section > Active child" (many children) that replaces the plain
 * title with a picker. Unlike the mobile header, the section name here never swaps to the active
 * child's own label - only `pageDescription`, rendered separately beneath this row, does that.
 */
export function DesktopSectionHeader({
  item,
  title,
}: {
  item: NavItem | undefined
  title: string | undefined
}) {
  // Also declares the `dailies` namespace: Dailies' child labels live there instead of
  // `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies"])
  const { pathname } = useLocation()
  const navigate = useNavigate()

  if (!title) return <span />

  const children = item?.children
  if (!children?.length) {
    return (
      <h1
        className="truncate text-2xl font-semibold tracking-tight"
        data-testid="section-header-title"
      >
        {title}
      </h1>
    )
  }

  const activeChild =
    children.find(
      (child) =>
        pathname === child.path || pathname.startsWith(child.path + "/")
    ) ?? children[0]

  if (children.length > MAX_INLINE_TABS) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex min-w-0 items-center gap-1.5 rounded-md text-2xl font-semibold tracking-tight hover:text-foreground/80"
          data-testid="section-header-dropdown"
        >
          <span className="truncate">{title}</span>
          <span aria-hidden="true" className="text-muted-foreground">
            ›
          </span>
          <span className="truncate">{t(activeChild.labelKey)}</span>
          <ChevronDown
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {children.map((child) => (
            <DropdownMenuItem
              data-testid={`section-header-dropdown-item-${slug(child.path)}`}
              key={child.path}
              onSelect={() => {
                void navigate(child.path)
              }}
            >
              {t(child.labelKey)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-4">
      <h1
        className="shrink-0 truncate text-2xl font-semibold tracking-tight"
        data-testid="section-header-title"
      >
        {title}
      </h1>
      <nav
        aria-label={title}
        className="flex min-w-0 items-center gap-4 overflow-x-auto overflow-y-hidden"
        data-testid="section-tabs"
      >
        {children.map((child) => {
          const isActive = child.path === activeChild.path
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "shrink-0 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-state={isActive ? "active" : "inactive"}
              data-testid={`section-tab-${slug(child.path)}`}
              key={child.path}
              to={child.path}
            >
              {t(child.labelKey)}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
