import type { ComponentProps, Ref } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Sheet, SheetContent } from "@workspace/ui/components/sheet"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

type ResponsiveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  /** Ignore pointer-downs outside the content (the form must not be lost to a stray click). */
  preventOutsideClose?: boolean
  contentClassName?: string
  contentRef?: Ref<HTMLDivElement>
  "data-testid"?: string
}

/**
 * A centered dialog at or above 768px and the bottom `Sheet` below it. Compose with
 * `ResponsiveDialogHeader` / `ResponsiveDialogTitle` / `ResponsiveDialogBody` /
 * `ResponsiveDialogFooter`: header and footer stay fixed while the body scrolls. The body is a
 * container-query root (`@container`), so children can lay out by the dialog's own width, e.g.
 * `@2xl:grid-cols-2`.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
  preventOutsideClose = false,
  contentClassName,
  contentRef,
  "data-testid": testId,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()
  const contentProps = {
    "data-testid": testId,
    onPointerDownOutside: preventOutsideClose
      ? (event: Event) => event.preventDefault()
      : undefined,
    ref: contentRef,
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
          "flex max-h-[90vh] w-full flex-col gap-0 p-0 sm:max-w-5xl",
          contentClassName
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
        "flex shrink-0 flex-col gap-1 px-6 pt-5 pr-14 pb-3",
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

export function ResponsiveDialogBody({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="responsive-dialog-body"
      className={cn(
        "@container flex min-h-0 flex-1 flex-col overflow-y-auto px-6",
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
        "flex shrink-0 flex-col gap-2 px-6 py-4 md:flex-row md:items-center md:justify-end",
        className
      )}
      {...props}
    />
  )
}
