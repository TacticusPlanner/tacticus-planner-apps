import { useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CommandShortcut } from "@workspace/ui/components/command-shortcut"

import { isMacPlatform } from "@/shared/lib"

import { AuthControl } from "../providers/auth-control"
import { UserJotFeedbackButton } from "../providers/userjot-feedback-button"
import { AppLogo, AppLogoHomeLink } from "./app-logo"
import { DesktopNavigationDialog } from "./desktop-navigation-dialog"
import type { NavItem } from "./nav-items"
import type { QuickActionsController } from "./quick-actions"

/** Slim global bar: app identity, navigation search (Ctrl/Cmd+K), and the account/preferences menu. */
export function DesktopTopBar({
  getEntryPath,
  isAuthenticated,
  quickActions,
  visibleItems,
}: {
  getEntryPath: (item: NavItem) => string
  isAuthenticated: boolean
  quickActions: QuickActionsController
  visibleItems: NavItem[]
}) {
  const { t } = useTranslation()
  const [navigationOpen, setNavigationOpen] = useState(false)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const shortcut = isMacPlatform() ? "⌘K" : "Ctrl+K"

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || !(event.metaKey || event.ctrlKey)) return
      if (event.key === "k") {
        event.preventDefault()
        setNavigationOpen((open) => !open)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div
      className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b bg-topbar px-3"
      data-testid="desktop-top-bar"
    >
      <AppLogoHomeLink
        className="flex min-w-0 shrink-0 items-center gap-2 rounded-md outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        isAuthenticated={isAuthenticated}
      >
        <AppLogo className="size-8 shrink-0" />
        <span className="hidden truncate text-sm font-semibold tracking-tight lg:inline">
          {t("app.name")}
        </span>
      </AppLogoHomeLink>
      <div className="flex min-w-0 flex-1 justify-center">
        <button
          aria-label={t("nav.search")}
          className="flex h-8 w-full max-w-xl min-w-0 items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="desktop-navigation-search"
          onClick={() => setNavigationOpen(true)}
          ref={launcherRef}
          type="button"
        >
          <Search className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">
            {t("nav.search")}
          </span>
          <CommandShortcut className="hidden lg:inline">
            {shortcut}
          </CommandShortcut>
        </button>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div data-testid="desktop-feedback">
          <UserJotFeedbackButton />
        </div>
        <div data-testid="desktop-account-menu">
          <AuthControl />
        </div>
      </div>
      <DesktopNavigationDialog
        getEntryPath={getEntryPath}
        items={visibleItems}
        onOpenChange={setNavigationOpen}
        open={navigationOpen}
        quickActions={quickActions}
        returnFocusRef={launcherRef}
      />
    </div>
  )
}
