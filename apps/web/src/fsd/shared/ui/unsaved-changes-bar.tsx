import type { ReactNode } from "react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

export type UnsavedChangesBarProps = {
  open: boolean
  isSaving: boolean
  message: ReactNode
  saveLabel: ReactNode
  discardLabel: ReactNode
  onSave: () => void
  onDiscard: () => void
}

/**
 * Save/Discard bar for a page with unsaved edits. Render it as the page's last child: it is
 * `sticky`, so it pins to the bottom of the viewport while the page scrolls yet stays in the page's
 * flow — it spans only the content column and never covers the last item once scrolled to the end.
 * On mobile it sits above the fixed bottom nav, level with the scroll-to-top button, and leaves
 * that button's column free.
 */
export function UnsavedChangesBar({
  open,
  isSaving,
  message,
  saveLabel,
  discardLabel,
  onSave,
  onDiscard,
}: UnsavedChangesBarProps) {
  const isMobile = useIsMobile()
  if (!open) return null
  return (
    <div
      role="region"
      aria-label={typeof message === "string" ? message : undefined}
      data-testid="unsaved-changes-bar"
      data-mobile={isMobile ? "true" : undefined}
      className={cn(
        "sticky z-30 flex items-center gap-2 rounded-xl border bg-background/95 px-3 shadow-lg backdrop-blur",
        isMobile
          ? "bottom-[calc(var(--mobile-nav-height)+1rem)] mr-14 min-h-12 py-1.5"
          : "bottom-4 py-2"
      )}
    >
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {message}
      </span>
      <Button
        size="sm"
        variant="ghost"
        disabled={isSaving}
        onClick={onDiscard}
        data-testid="unsaved-changes-discard"
      >
        {discardLabel}
      </Button>
      <Button
        size="sm"
        disabled={isSaving}
        onClick={onSave}
        data-testid="unsaved-changes-save"
      >
        {isSaving ? <Spinner /> : null}
        {saveLabel}
      </Button>
    </div>
  )
}
