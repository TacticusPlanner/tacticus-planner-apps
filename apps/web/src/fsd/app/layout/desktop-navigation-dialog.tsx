import { Suspense } from "react"
import type { RefObject } from "react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Kbd } from "@workspace/ui/components/kbd"

import { isMacPlatform } from "@/shared/lib"

import type { NavItem } from "./nav-items"
import { LazyNavigationPalette } from "./navigation-palette-lazy"
import type { QuickActionsController } from "./quick-actions"
import type { NavigationSearchSource } from "./navigation-search-analytics"

export function DesktopNavigationDialog({
  getEntryPath,
  items,
  open,
  onOpenChange,
  openedVia,
  quickActions,
  returnFocusRef,
}: {
  getEntryPath: (item: NavItem) => string
  items: NavItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** How it was last opened (the shortcut or the top bar's search button). */
  openedVia: NavigationSearchSource
  quickActions: QuickActionsController
  /** Where focus goes on close. The dialog has no Radix trigger and its input autofocuses, so
   *  Radix would otherwise restore focus to the (unmounted) input. */
  returnFocusRef?: RefObject<HTMLElement | null>
}) {
  const { t } = useTranslation()
  const modifier = isMacPlatform() ? "⌘" : "Ctrl"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // A command palette: anchored near the top so its field stays put as results change.
        aria-describedby={undefined}
        className="top-[12vh] flex max-h-[76vh] translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        data-testid="desktop-navigation-dialog"
        onCloseAutoFocus={(event) => {
          if (returnFocusRef?.current) {
            event.preventDefault()
            returnFocusRef.current.focus()
          }
          // A selected quick action launches only now, once this modal layer has released focus
          // and pointer restrictions, so the target form/widget/tour never overlaps this one.
          quickActions.flush()
        }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{t("nav.navigation")}</DialogTitle>
        <Suspense fallback={<div className="h-14" />}>
          <LazyNavigationPalette
            focusOnOpen
            density="compact"
            footer={
              <div
                aria-hidden="true"
                className="flex shrink-0 items-center gap-4 border-t px-4 py-2 text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  {t("nav.palette.move")}
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>↵</Kbd>
                  {t("nav.palette.open")}
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>Esc</Kbd>
                  {t("nav.palette.close")}
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <Kbd>{modifier}</Kbd>
                  <Kbd>K</Kbd>
                  {t("nav.palette.anywhere")}
                </span>
              </div>
            }
            getEntryPath={getEntryPath}
            inputEnd={
              <DialogClose
                aria-label={t("common.close")}
                className="shrink-0 rounded-sm outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Kbd className="pointer-events-auto cursor-pointer">Esc</Kbd>
              </DialogClose>
            }
            inputPlacement="top"
            items={items}
            onActionSelect={(id) => {
              if (quickActions.select(id)) onOpenChange(false)
            }}
            onNavigate={() => onOpenChange(false)}
            openedVia={openedVia}
            quickActions={quickActions}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  )
}
