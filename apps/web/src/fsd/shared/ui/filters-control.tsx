import { useId, useRef, useState } from "react"
import type { ComponentProps, ReactNode } from "react"
import { ListFilter, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "./responsive-dialog"

/**
 * The one "Filters" button (ui-style-guide rule 2): an outline button with the filter icon, and the
 * active count as a badge so the label never changes width. Screen readers hear "Filters, 2 active".
 */
export function FiltersButton({
  count,
  testId,
  ...props
}: Omit<ComponentProps<typeof Button>, "children" | "variant"> & {
  count: number
  testId?: string
}) {
  const { t } = useTranslation("common")
  return (
    <Button
      aria-label={
        count > 0
          ? t("filtersControl.buttonActive", { count })
          : t("filtersControl.button")
      }
      data-testid={testId}
      variant="outline"
      {...props}
    >
      <ListFilter data-icon="inline-start" />
      {t("filtersControl.button")}
      {count > 0 ? (
        <Badge
          data-testid={testId ? `${testId}-badge` : undefined}
          variant="secondary"
        >
          {count}
        </Badge>
      ) : null}
    </Button>
  )
}

/**
 * The "Filters" button and the panel it opens (ui-style-guide rules 3 and 8). Changes apply as
 * they are made, so the panel ends with one "Done" and a ghost "Clear filters" at the left.
 *
 * - `size="compact"`: a popover on desktop, for a short list of fields that fits without scrolling.
 * - `size="form"`: a form-width dialog on desktop, for longer lists.
 *
 * On mobile both open the same bottom sheet. The panel hands focus back to the button on closing.
 */
export function FiltersControl({
  count,
  onClear,
  size,
  children,
  testId,
  title,
}: {
  /** Active filters, shown as the button's badge; 0 disables "Clear filters". */
  count: number
  onClear: () => void
  size: "compact" | "form"
  /** The fields, usually `FilterField`s. */
  children: ReactNode
  /** `<testId>` on the button, `<testId>-panel` on the panel, `<testId>-clear` on Clear filters. */
  testId?: string
  /** Defaults to "Filters". */
  title?: string
}) {
  const { t } = useTranslation("common")
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const heading = title ?? t("filtersControl.title")

  const footer = (
    <>
      <Button
        className="md:mr-auto"
        data-testid={testId ? `${testId}-clear` : undefined}
        disabled={count === 0}
        onClick={onClear}
        variant="ghost"
      >
        <X data-icon="inline-start" />
        {t("filtersControl.clear")}
      </Button>
      <Button onClick={() => setOpen(false)}>{t("filtersControl.done")}</Button>
    </>
  )

  if (size === "compact" && !isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FiltersButton aria-expanded={open} count={count} testId={testId} />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label={heading}
          className="flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3"
          data-testid={testId ? `${testId}-panel` : undefined}
        >
          <div className="flex flex-col gap-3">{children}</div>
          <div className="flex items-center justify-end gap-2 border-t pt-3">
            {footer}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      <FiltersButton
        aria-haspopup="dialog"
        aria-expanded={open}
        count={count}
        onClick={() => setOpen(true)}
        ref={buttonRef}
        testId={testId}
      />
      <ResponsiveDialog
        data-testid={testId ? `${testId}-panel` : undefined}
        desktopClassName="sm:max-w-2xl"
        onCloseAutoFocus={(event) => {
          // Opened from state, not a Radix trigger: hand focus back to the button.
          event.preventDefault()
          buttonRef.current?.focus()
        }}
        onOpenChange={setOpen}
        open={open}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{heading}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="flex flex-col gap-4 pb-2">{children}</div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter className="border-t">
          {footer}
        </ResponsiveDialogFooter>
      </ResponsiveDialog>
    </>
  )
}

/**
 * One filter with its visible label above the control. Pass `children` as a render function to
 * name the control by the label (`id` for an input or switch, `labelId` for `aria-labelledby`);
 * a control passed as plain children names itself (its `aria-label` repeats the visible label).
 */
export function FilterField({
  label,
  children,
  className,
  inline = false,
}: {
  label: string
  children: ReactNode | ((ids: { id: string; labelId: string }) => ReactNode)
  className?: string
  /** A switch or a short number input: label and control on one line. */
  inline?: boolean
}) {
  const id = useId()
  const labelId = `${id}-label`
  const named = typeof children === "function"
  return (
    <div
      className={cn(
        "flex min-w-0 gap-1.5",
        inline ? "items-center justify-between gap-2" : "flex-col",
        className
      )}
    >
      <Label
        className={cn("text-sm", inline ? undefined : "text-muted-foreground")}
        htmlFor={named ? id : undefined}
        id={labelId}
      >
        {label}
      </Label>
      {named ? children({ id, labelId }) : children}
    </div>
  )
}
