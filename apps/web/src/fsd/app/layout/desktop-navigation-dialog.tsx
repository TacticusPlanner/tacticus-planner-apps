import { useState } from "react"
import { Link, useLocation } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import { NavChildRow } from "./nav-child-row"
import { filterNavigationItems } from "./navigation-filter"
import type { NavItem } from "./nav-items"

export function DesktopNavigationDialog({
  getEntryPath,
  items,
  open,
  onOpenChange,
}: {
  getEntryPath: (item: NavItem) => string
  items: NavItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies", "library"])
  const { pathname } = useLocation()
  const [search, setSearch] = useState("")
  const filteredItems = filterNavigationItems(items, search, t)

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) setSearch("")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[80vh] flex-col sm:max-w-xl"
        data-testid="desktop-navigation-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("nav.navigation")}</DialogTitle>
          <DialogDescription>{t("nav.navigationHint")}</DialogDescription>
        </DialogHeader>
        <Input
          aria-label={t("nav.search")}
          autoFocus
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("nav.search")}
          type="search"
          value={search}
        />
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto py-2">
          {filteredItems.length ? (
            filteredItems.map((item) => {
              const isActive =
                pathname === item.path || pathname.startsWith(`${item.path}/`)

              return (
                <div key={item.path}>
                  <Link
                    aria-current={pathname === item.path ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => handleOpenChange(false)}
                    to={getEntryPath(item)}
                  >
                    <item.icon className="size-5 shrink-0" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{t(item.labelKey)}</span>
                      <span className="truncate text-xs font-normal text-muted-foreground">
                        {t(item.descriptionKey)}
                      </span>
                    </span>
                  </Link>
                  {item.children?.length ? (
                    <div className="mt-1 ml-8 space-y-1 border-l pl-3">
                      {item.children.map((child) => (
                        <NavChildRow
                          key={child.path}
                          child={child}
                          isActive={pathname === child.path}
                          onSelect={() => handleOpenChange(false)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              {t("nav.noResults")}
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="w-full" variant="secondary">
              {t("common.close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
