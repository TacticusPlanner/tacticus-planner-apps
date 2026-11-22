import type { ComponentProps, Ref } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Sheet, SheetContent } from "@workspace/ui/components/sheet"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

/** Desktop widths (ui-style-guide rule 8): narrow for confirms, one choice or up to three fields;
 *  form for forms, pickers and filters; wide for tables, side-by-side panels and browsing. */
export type ResponsiveDialogWidth = "narrow" | "form" | "wide"

const WIDTH_CLASS: Record<ResponsiveDialogWidth, string> = {
  narrow: "sm:max-w-md",
  form: "sm:max-w-2xl",
  wide: "sm:max-w-5xl",
}

type ResponsiveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  /** Ignore pointer-downs outside the content (the form must not be lost to a stray click). */
  preventOutsideClose?: boolean
  /** The centered dialog's width at or above 768px. Below it the sheet is always full screen. */
  width?: ResponsiveDialogWidth
  /** Classes for both shells. Never a width: that is `width`, which leaves the phone sheet alone. */
  contentClassName?: string
  /** Extra classes for the centered dialog only (at or above 768px), e.g. a fixed height. */
  desktopClassName?: string
  contentRef?: Ref<HTMLDivElement>
  /** Called as the content takes focus on opening; `preventDefault()` keeps the default (the first
   *  field) from taking it. */
  onOpenAutoFocus?: (event: Event) => void
  /** Called as focus leaves the content on closing. A dialog opened from state (not a Radix
   *  trigger) uses it to send focus back to the control that opened it. */
  onCloseAutoFocus?: (event: Event) => void
  "data-testid"?: string
}

/**
 * A centered dialog at or above 768px and the bottom `Sheet` below it. Compose with
 * `ResponsiveDialogHeader` / `ResponsiveDialogTitle` / `ResponsiveDialogBody` /
 * `ResponsiveDialogFooter`: header and footer stay fixed while the body scrolls. The shell owns the
 * spacing (body padding, the footer's top border); pass `width` for the desktop size. The body is a
 * container-query root (`@container`), so children can lay out by the dialog's own width, e.g.
 * `@2xl:grid-cols-2`.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
  preventOutsideClose = false,
  width = "wide",
  contentClassName,
  desktopClassName,
  contentRef,
  onOpenAutoFocus,
  onCloseAutoFocus,
  "data-testid": testId,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()
  const contentProps = {
    "data-testid": testId,
    onPointerDownOutside: preventOutsideClose
      ? (event: Event) => event.preventDefault()
      : undefined,
    ref: contentRef,
    onOpenAutoFocus,
    onCloseAutoFocus,
  }

  return isMobile ? (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent {...contentProps} className={contentClassName}>
        {children}
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        {...contentProps}
        className={cn(
          "flex max-h-[calc(100vh-1rem)] w-full flex-col gap-0 p-0",
          WIDTH_CLASS[width],
          contentClassName,
          desktopClassName
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function ResponsiveDialogHeader({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="responsive-dialog-header"
      className={cn(
        "flex shrink-0 flex-col gap-1 px-6 pt-4 pr-14 pb-2",
        className
      )}
      {...props}
    />
  )
}

/** Radix's dialog title, shared by both shells. */
export function ResponsiveDialogTitle(
  props: ComponentProps<typeof DialogTitle>
) {
  return <DialogTitle {...props} />
}

/** Radix's dialog description, shared by both shells: one line, `text-sm text-muted-foreground`.
 *  Always use it (not a plain `<p>`) under the title: it names the dialog for screen readers and,
 *  inside the header, clears the close button. */
export function ResponsiveDialogDescription(
  props: ComponentProps<typeof DialogDescription>
) {
  return <DialogDescription {...props} />
}

export function ResponsiveDialogBody({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="responsive-dialog-body"
      className={cn(
        "@container flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-2 pb-4",
        className
      )}
      {...props}
    />
  )
}

export function ResponsiveDialogFooter({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="responsive-dialog-footer"
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-2 border-t px-6 py-3 max-md:*:data-[slot=button]:flex-1 md:flex-nowrap md:justify-end",
        className
      )}
      {...props}
    />
  )
}
