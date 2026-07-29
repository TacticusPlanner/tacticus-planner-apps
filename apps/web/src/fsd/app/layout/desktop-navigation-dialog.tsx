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

import { filterNavigationItems } from "./navigation-filter"
import type { NavItem } from "./nav-items"

export function DesktopNavigationDialog({
  items,
  open,
  onOpenChange,
}: {
  items: NavItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
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
                    to={item.path}
                  >
                    <item.icon className="size-5" />
                    {t(item.labelKey)}
                  </Link>
                  {item.children?.length ? (
                    <div className="mt-1 ml-8 space-y-1 border-l pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          aria-current={
                            pathname === child.path ? "page" : undefined
                          }
                          className={cn(
                            "flex min-h-9 items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                            pathname === child.path
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                          onClick={() => handleOpenChange(false)}
                          to={child.path}
                        >
                          {t(child.labelKey)}
                        </Link>
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
