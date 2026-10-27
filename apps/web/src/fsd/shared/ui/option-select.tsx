import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { ChevronsUpDown, X } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import { useCommandListId } from "./command-list-id"
import { closestOverlayContent } from "./overlay-content"

export type SelectOption<TValue extends string | number> = {
  value: TValue
  label: string
  /** Leading visual, shown in the list and in the trigger's chip summary. */
  icon?: ReactNode
}

type CommonProps<TValue extends string | number> = {
  options: readonly SelectOption<TValue>[]
  /** Shown while nothing is selected, e.g. "All alliances". */
  placeholder: string
  /** The trigger's accessible name; defaults to `placeholder`. */
  label?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  "data-testid"?: string
}

function OptionList<TValue extends string | number>({
  options,
  isSelected,
  onSelect,
  searchPlaceholder,
  emptyText,
  listRef,
}: {
  options: readonly SelectOption<TValue>[]
  isSelected: (value: TValue) => boolean
  onSelect: (value: TValue) => void
  searchPlaceholder?: string
  emptyText?: string
  listRef: (element: HTMLElement | null) => void
}) {
  return (
    <Command>
      <CommandInput placeholder={searchPlaceholder} />
      <CommandList ref={listRef}>
        <CommandEmpty>{emptyText}</CommandEmpty>
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              key={option.value}
              // cmdk filters on `value`; the label is what the player searches by.
              value={`${option.label} ${option.value}`}
              data-checked={isSelected(option.value)}
              aria-selected={isSelected(option.value)}
              data-testid={`option-${option.value}`}
              onSelect={() => onSelect(option.value)}
            >
              {option.icon}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

/** Popover plus its trigger; `children` renders inside the popover. Portals into the surrounding
 *  dialog or sheet so Radix's scroll lock does not block the list. */
function SelectShell({
  ariaLabel,
  disabled,
  testId,
  summary,
  trailing,
  children,
}: {
  ariaLabel: string
  disabled?: boolean
  testId?: string
  summary: ReactNode
  trailing?: ReactNode
  children: (
    close: () => void,
    listRef: (element: HTMLElement | null) => void
  ) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [listId, listRef] = useCommandListId()
  const [portalContainer, setPortalContainer] = useState<HTMLElement>()
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setPortalContainer(closestOverlayContent(triggerRef.current))
      }}
    >
      <div className="relative min-w-0">
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-label={ariaLabel}
            className="h-9 w-full min-w-0 justify-between gap-2 pr-2 font-normal"
            data-testid={testId}
            disabled={disabled}
          >
            {/* Ends before a clear button, which sits between it and the chevron. */}
            <span
              className={cn(
                "flex min-w-0 flex-1 items-center gap-1 overflow-hidden",
                trailing && "pr-7"
              )}
            >
              {summary}
            </span>
            <ChevronsUpDown className="shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        {trailing}
      </div>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-56 p-0"
        container={portalContainer}
      >
        {children(() => setOpen(false), listRef)}
      </PopoverContent>
    </Popover>
  )
}

/**
 * Multi-select with checkmarks: an empty selection reads as `placeholder` ("All ..."), a selection
 * as one icon chip per chosen option (label chips when an option has no icon), as many as fit and
 * then a "+N" chip naming the rest in its tooltip. With `clearLabel`, a clear button in the trigger
 * empties the selection in one step.
 */
export function MultiSelect<TValue extends string | number>({
  options,
  value,
  onChange,
  placeholder,
  label,
  searchPlaceholder,
  emptyText,
  disabled,
  clearLabel,
  "data-testid": testId,
}: CommonProps<TValue> & {
  value: readonly TValue[]
  onChange: (next: TValue[]) => void
  /** The clear button's accessible name; without it there is no clear button. */
  clearLabel?: string
}) {
  const selected = options.filter((option) => value.includes(option.value))

  return (
    <SelectShell
      ariaLabel={label ?? placeholder}
      disabled={disabled}
      testId={testId}
      summary={
        selected.length === 0 ? (
          <span className="truncate text-muted-foreground">{placeholder}</span>
        ) : (
          <FittingChips options={selected} />
        )
      }
      trailing={
        clearLabel && value.length > 0 && !disabled ? (
          <ClearButton
            label={clearLabel}
            testId={testId}
            onClick={() => onChange([])}
          />
        ) : null
      }
    >
      {(_close, listRef) => (
        <OptionList
          listRef={listRef}
          options={options}
          isSelected={(item) => value.includes(item)}
          onSelect={(item) =>
            onChange(
              value.includes(item)
                ? value.filter((entry) => entry !== item)
                : [...value, item]
            )
          }
          searchPlaceholder={searchPlaceholder ?? placeholder}
          emptyText={emptyText}
        />
      )}
    </SelectShell>
  )
}

const CHIP_GAP = 4
/** Room kept for the "+N" chip while some chips are hidden. */
const MORE_CHIP_WIDTH = 32

function Chip({ option }: { option: SelectOption<string | number> }) {
  return (
    <Badge variant="secondary" className="h-6 shrink-0 gap-1 px-1.5">
      {option.icon ?? option.label}
    </Badge>
  )
}

/**
 * The selected options as chips, as many as fit the trigger, then "+N" for the rest (named in its
 * tooltip). Widths come from an invisible copy of every chip, measured again whenever the trigger
 * resizes; before layout (width 0) every chip shows.
 */
function FittingChips({
  options,
}: {
  options: readonly SelectOption<string | number>[]
}) {
  const boxRef = useRef<HTMLSpanElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(options.length)
  const key = options.map((option) => option.value).join("\u0000")

  useLayoutEffect(() => {
    const box = boxRef.current
    const measure = measureRef.current
    if (!box || !measure) return
    const fit = () => {
      const width = box.clientWidth
      if (width === 0) {
        setShown(options.length)
        return
      }
      const chips = [...measure.children] as HTMLElement[]
      let used = 0
      let count = 0
      for (const [index, chip] of chips.entries()) {
        const next = used + (index > 0 ? CHIP_GAP : 0) + chip.offsetWidth
        const isLast = index === chips.length - 1
        if (next + (isLast ? 0 : CHIP_GAP + MORE_CHIP_WIDTH) > width) break
        used = next
        count++
      }
      setShown(count)
    }
    fit()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => observer.disconnect()
    // `key` stands for `options`, whose array is new on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const hidden = options.slice(shown)
  return (
    <span
      ref={boxRef}
      className="relative flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
    >
      {options.slice(0, shown).map((option) => (
        <Chip key={option.value} option={option} />
      ))}
      {hidden.length > 0 ? (
        <Badge
          variant="secondary"
          className="h-6 shrink-0 px-1.5"
          title={hidden.map((option) => option.label).join(", ")}
          data-testid="select-more-chip"
        >
          +{hidden.length}
        </Badge>
      ) : null}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 left-0 flex gap-1"
      >
        {options.map((option) => (
          <Chip key={option.value} option={option} />
        ))}
      </span>
    </span>
  )
}

/** The clear button that sits inside a select's trigger, left of its chevron. */
function ClearButton({
  label,
  testId,
  onClick,
}: {
  label: string
  testId?: string
  onClick: () => void
}) {
  return (
    <Button
      aria-label={label}
      className="absolute top-1/2 right-8 size-6 -translate-y-1/2"
      data-testid={testId ? `${testId}-clear` : undefined}
      onClick={onClick}
      size="icon"
      variant="ghost"
    >
      <X />
    </Button>
  )
}

/** Searchable single select, clearable back to `undefined` (the `placeholder`, e.g. "No limit"). */
export function SearchableSelect<TValue extends string | number>({
  options,
  value,
  onChange,
  placeholder,
  label,
  clearLabel,
  searchPlaceholder,
  emptyText,
  disabled,
  "data-testid": testId,
}: CommonProps<TValue> & {
  value: TValue | undefined
  onChange: (next: TValue | undefined) => void
  clearLabel: string
}) {
  const selected = options.find((option) => option.value === value)

  return (
    <SelectShell
      ariaLabel={label ?? placeholder}
      disabled={disabled}
      testId={testId}
      summary={
        selected ? (
          <span className="truncate">{selected.label}</span>
        ) : value !== undefined ? (
          <span className="truncate">{String(value)}</span>
        ) : (
          <span className="truncate text-muted-foreground">{placeholder}</span>
        )
      }
      trailing={
        value !== undefined && !disabled ? (
          <ClearButton
            label={clearLabel}
            testId={testId}
            onClick={() => onChange(undefined)}
          />
        ) : null
      }
    >
      {(close, listRef) => (
        <OptionList
          listRef={listRef}
          options={options}
          isSelected={(item) => item === value}
          onSelect={(item) => {
            onChange(item === value ? undefined : item)
            close()
          }}
          searchPlaceholder={searchPlaceholder ?? placeholder}
          emptyText={emptyText}
        />
      )}
    </SelectShell>
  )
}
