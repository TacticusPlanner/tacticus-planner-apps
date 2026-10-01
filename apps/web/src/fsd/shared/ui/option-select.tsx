import { useRef, useState, type ReactNode } from "react"
import { ChevronsUpDown, X } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
}: {
  options: readonly SelectOption<TValue>[]
  isSelected: (value: TValue) => boolean
  onSelect: (value: TValue) => void
  searchPlaceholder?: string
  emptyText?: string
}) {
  return (
    <Command>
      <CommandInput placeholder={searchPlaceholder} />
      <CommandList>
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
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
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
      <div className="relative">
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel}
            className="h-9 w-full justify-between gap-2 pr-2 font-normal"
            data-testid={testId}
            disabled={disabled}
          >
            <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
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
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  )
}

/**
 * Multi-select with checkmarks: an empty selection reads as `placeholder` ("All ..."), a selection
 * as one icon chip per chosen option (label chips when an option has no icon).
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
  "data-testid": testId,
}: CommonProps<TValue> & {
  value: readonly TValue[]
  onChange: (next: TValue[]) => void
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
          selected.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="h-6 shrink-0 gap-1 px-1.5"
            >
              {option.icon ?? option.label}
            </Badge>
          ))
        )
      }
    >
      {() => (
        <OptionList
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
          <Button
            aria-label={clearLabel}
            className="absolute top-1/2 right-8 size-6 -translate-y-1/2"
            data-testid={testId ? `${testId}-clear` : undefined}
            onClick={() => onChange(undefined)}
            size="icon"
            variant="ghost"
          >
            <X />
          </Button>
        ) : null
      }
    >
      {(close) => (
        <OptionList
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
