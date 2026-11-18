import { createContext, useContext, useMemo, useState } from "react"
import type { ComponentProps, ReactNode } from "react"
import { createPortal } from "react-dom"
import { Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

/**
 * The page header (ui-style-guide rule 1): title, the help action ("Tour this page"), the page's
 * Settings button at the right end of the title row, a one-line description, then the divider.
 *
 * The app shell renders it, because the title and description come from the route. A page fills
 * the settings slot from inside its own tree with `PageHeaderSettings`, which portals into the
 * slot the shell placed with `PageHeaderSettingsSlot`.
 */
export function PageHeader({
  title,
  help,
  settings,
  description,
  className,
}: {
  /** The page's `<h1>`. */
  title: ReactNode
  /** Help actions right after the title, e.g. "Tour this page". */
  help?: ReactNode
  /** The right end of the title row; the shell passes `PageHeaderSettingsSlot`. */
  settings?: ReactNode
  description?: string
  className?: string
}) {
  return (
    <header
      className={cn("border-b bg-page-header", className)}
      data-slot="page-header"
    >
      <div className="flex items-center gap-2 px-6 pt-4 pb-1">
        <div className="flex min-w-0 items-center gap-2">
          {title}
          {help}
        </div>
        {settings === undefined ? null : (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {settings}
          </div>
        )}
      </div>
      {description === undefined || description === "" ? null : (
        <p className="truncate px-6 pb-3 text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  )
}

type SlotContext = {
  target: HTMLElement | null
  setTarget: (element: HTMLElement | null) => void
}

const PageHeaderSlotContext = createContext<SlotContext | null>(null)

/** Lets a page reach the header's settings slot; the app shell wraps both in it. */
export function PageHeaderSlotProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const value = useMemo(() => ({ target, setTarget }), [target])
  return (
    <PageHeaderSlotContext.Provider value={value}>
      {children}
    </PageHeaderSlotContext.Provider>
  )
}

/** Where the page's settings land in the header. Rendered by the shell, never by a page. */
export function PageHeaderSettingsSlot({ className }: { className?: string }) {
  const slot = useContext(PageHeaderSlotContext)
  return (
    <div
      className={cn("flex items-center gap-2 empty:hidden", className)}
      data-testid="page-header-settings"
      ref={slot?.setTarget}
    />
  )
}

/**
 * Puts the page's settings entry point (normally `PageSettingsButton`) in the page header. Outside
 * a shell (a page rendered on its own in a test) it renders in place.
 */
export function PageHeaderSettings({ children }: { children: ReactNode }) {
  const slot = useContext(PageHeaderSlotContext)
  if (!slot) return <>{children}</>
  if (!slot.target) return null
  return createPortal(children, slot.target)
}

/**
 * The page's one "Settings" button: labelled on desktop, an icon with the same accessible name in
 * the crowded mobile header (beside the icon-only tour button).
 */
export function PageSettingsButton({
  onClick,
  testId,
  ...props
}: {
  /** Optional when the button is a Radix trigger (`asChild`), which passes its own handler. */
  onClick?: ComponentProps<typeof Button>["onClick"]
  testId?: string
} & Omit<ComponentProps<typeof Button>, "onClick" | "children">) {
  const { t } = useTranslation("common")
  const isMobile = useIsMobile()
  const label = t("settings.label")
  return isMobile ? (
    <Button
      aria-label={label}
      className="size-10 rounded-full"
      data-testid={testId}
      onClick={onClick}
      size="icon"
      title={label}
      variant="ghost"
      {...props}
    >
      <Settings />
    </Button>
  ) : (
    <Button data-testid={testId} onClick={onClick} variant="outline" {...props}>
      <Settings data-icon="inline-start" />
      {label}
    </Button>
  )
}
