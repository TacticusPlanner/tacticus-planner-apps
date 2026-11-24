import { useId, useState } from "react"
import type { ReactNode } from "react"
import { SlidersHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "./responsive-dialog"
import { useViewPlacement, ViewPlacementContext } from "./view-placement"

const present = (node: ReactNode) =>
  node !== undefined && node !== null && node !== false

/**
 * The page toolbar (ui-style-guide rule 2): one row under the header with three fixed slots, left
 * to right. Find (search, the "Filters" button, filter selects) grows; View (Layout, Group by,
 * Sort) sits at the right; Actions (the page's create action) at the far right. Quick-filter chips
 * take the row below, and `below` anything that belongs to the toolbar but is not a control (an
 * open filter panel, a filter's note).
 *
 * On mobile the View slot collapses into one "View" button that opens a sheet holding the same
 * controls, stacked and full width, so row 1 is just Find, View and Actions.
 */
export function PageToolbar({
  find,
  chips,
  view,
  actions,
  below,
  label,
  testId,
  viewTestId,
}: {
  find?: ReactNode
  chips?: ReactNode
  view?: ReactNode
  actions?: ReactNode
  below?: ReactNode
  /** Names the toolbar for screen readers (a `toolbar`-less group with `aria-label`). */
  label?: string
  testId?: string
  /** On the View slot (desktop) or the View button (mobile), e.g. for a tour step. */
  viewTestId?: string
}) {
  const isMobile = useIsMobile()
  const actionsSlot = present(actions) ? (
    <div
      className="flex shrink-0 items-center gap-2"
      data-slot="page-toolbar-actions"
    >
      {actions}
    </div>
  ) : null

  return (
    <div
      aria-label={label}
      className="flex flex-col gap-3"
      data-slot="page-toolbar"
      data-testid={testId}
      role={label ? "group" : undefined}
    >
      {/* Desktop wraps Find and View + Actions as wholes (View + Actions move under Find, still at
          the right); mobile keeps View and Actions at the top right and lets Find wrap inside. */}
      <div
        className={cn(
          "flex gap-2",
          isMobile ? "items-start" : "flex-wrap items-center"
        )}
      >
        {present(find) ? (
          <div
            className={cn(
              "flex flex-1 flex-wrap items-center gap-2",
              isMobile ? "min-w-0" : "min-w-fit"
            )}
            data-slot="page-toolbar-find"
          >
            {find}
          </div>
        ) : (
          <div className="flex-1" />
        )}
        {isMobile ? (
          <>
            {present(view) ? (
              <ViewSheetButton testId={viewTestId}>{view}</ViewSheetButton>
            ) : null}
            {actionsSlot}
          </>
        ) : (
          // View and Actions wrap together, so the page action never ends up alone on a line.
          <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            {present(view) ? (
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-2"
                data-slot="page-toolbar-view"
                data-testid={viewTestId}
              >
                {view}
              </div>
            ) : null}
            {actionsSlot}
          </div>
        )}
      </div>
      {present(chips) ? (
        <div data-slot="page-toolbar-chips">{chips}</div>
      ) : null}
      {below}
    </div>
  )
}

/** Mobile: the View slot behind one button, opening a sheet with the controls stacked. */
function ViewSheetButton({
  children,
  testId,
}: {
  children: ReactNode
  testId?: string
}) {
  const { t } = useTranslation("common")
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        aria-haspopup="dialog"
        className="shrink-0"
        data-slot="page-toolbar-view-button"
        data-testid={testId ?? "page-toolbar-view-button"}
        onClick={() => setOpen(true)}
        variant="outline"
      >
        <SlidersHorizontal data-icon="inline-start" />
        {t("pageToolbar.view")}
      </Button>
      <ResponsiveDialog
        data-testid="page-toolbar-view-sheet"
        onOpenChange={setOpen}
        open={open}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {t("pageToolbar.viewTitle")}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="flex flex-col gap-5" data-slot="page-toolbar-view">
            <ViewPlacementContext.Provider value="sheet">
              {children}
            </ViewPlacementContext.Provider>
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button onClick={() => setOpen(false)}>
            {t("pageToolbar.done")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialog>
    </>
  )
}

/**
 * A toolbar control with its visible label: label then control on one line in the toolbar, label
 * above a full-width control in the View sheet (ui-style-guide rule 3: labels sit outside the
 * control, never inside the trigger).
 */
export function ToolbarField({
  label,
  labelId,
  children,
  testId,
}: {
  label: string
  /** The label element's id, for a control named by `aria-labelledby`. */
  labelId?: string
  children: ReactNode
  testId?: string
}) {
  const placement = useViewPlacement()
  return (
    <div
      className={cn(
        "flex gap-2",
        placement === "sheet" ? "flex-col items-stretch" : "items-center"
      )}
      data-testid={testId}
    >
      <span
        className={cn(
          "text-sm",
          placement === "sheet" ? "font-medium" : "text-muted-foreground"
        )}
        id={labelId}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

type SegmentedOption<T extends string> = {
  value: T
  label: string
  /** Extra help in a tooltip on hover and focus. A tap on touch still picks the option. */
  hint?: string
  icon?: ReactNode
  /** Shown after the label, e.g. a loading spinner. */
  trailing?: ReactNode
  /** This one choice cannot be picked right now (its data is missing or still loading). */
  disabled?: boolean
  /** Why this choice can't be picked now: the option stays focusable and shows the reason in a
   *  tooltip (a tap too) instead of going silently grey. */
  disabledReason?: string
  testId?: string
}

/**
 * The one labelled segmented button for 2-4 exclusive choices (ui-style-guide rule 3): Layout
 * (Cards / Table), Group by, and the like. Radix emits "" when the pressed item is pressed again;
 * a choice is always set, so that is ignored.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onValueChange,
  disabled = false,
  testId,
}: {
  label: string
  value: T
  options: readonly SegmentedOption<T>[]
  onValueChange: (value: T) => void
  disabled?: boolean
  testId?: string
}) {
  const labelId = useId()
  const placement = useViewPlacement()
  const stretch = placement === "sheet"
  return (
    <ToolbarField label={label} labelId={labelId} testId={testId}>
      <ToggleGroup
        aria-labelledby={labelId}
        className={stretch ? "w-full" : undefined}
        disabled={disabled}
        onValueChange={(next) => {
          const option = options.find((item) => item.value === next)
          if (option && option.disabledReason === undefined)
            onValueChange(option.value)
        }}
        spacing={0}
        type="single"
        value={value}
        variant="outline"
      >
        {options.map((option) => (
          <SegmentedItem key={option.value} option={option} stretch={stretch} />
        ))}
      </ToggleGroup>
    </ToolbarField>
  )
}

/** One segment. With a hint or a disabled reason, the item renders through the tooltip trigger
 *  (item outside, trigger inside) so the trigger's `data-state` doesn't replace the item's on/off
 *  state. */
function SegmentedItem<T extends string>({
  option,
  stretch,
}: {
  option: SegmentedOption<T>
  stretch: boolean
}) {
  const blocked = option.disabledReason !== undefined
  const tooltip = option.disabledReason ?? option.hint
  const content = (
    <>
      {option.icon}
      {option.label}
      {option.trailing}
    </>
  )
  const item = (
    <ToggleGroupItem
      aria-disabled={blocked || undefined}
      asChild={tooltip !== undefined}
      className={cn(
        "px-3 aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
        stretch && "flex-auto"
      )}
      data-testid={option.testId}
      disabled={option.disabled}
      value={option.value}
    >
      {tooltip === undefined ? (
        content
      ) : (
        <TooltipTrigger
          disableTouchToggle={!blocked}
          // A blocked option ignores the press, and its reason stays open (Radix closes a tooltip
          // on pointerdown and on click unless the event is cancelled).
          onClick={blocked ? (event) => event.preventDefault() : undefined}
          onPointerDown={
            blocked
              ? (event) => {
                  if (event.pointerType !== "touch") event.preventDefault()
                }
              : undefined
          }
        >
          {content}
        </TooltipTrigger>
      )}
    </ToggleGroupItem>
  )
  if (tooltip === undefined) return item
  return (
    <Tooltip>
      {item}
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

/** "Group by" in the View slot, the same segmented control on every page. Offer "None" when the
 *  list can be ungrouped. */
export function GroupByControl<T extends string>(
  props: Omit<Parameters<typeof SegmentedControl<T>>[0], "label">
) {
  const { t } = useTranslation("common")
  return <SegmentedControl {...props} label={t("pageToolbar.groupBy")} />
}
