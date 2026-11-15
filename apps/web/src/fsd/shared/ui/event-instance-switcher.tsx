import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

import {
  adjacentSwitcherKeys,
  groupSwitcherInstances,
  type SwitcherInstance,
} from "./event-instance-switcher.model"

const GROUPS = ["running", "upcoming", "past"] as const

type EventInstanceSwitcherLabels = {
  /** The select's accessible name. */
  label: string
  placeholder: string
  /** The placeholder when the calendar holds no instance. */
  empty: string
  previous: string
  next: string
  groups: Record<(typeof GROUPS)[number], string>
}

/**
 * Picks which event instance a Dailies event tab shows: a select grouped Running / Upcoming / Past
 * between Previous / Next buttons that step through the instances in list order. Desktop: inline
 * `[<] [select] [>]`. Mobile (< 768px): a full-width row with the arrows at its ends, so the select
 * keeps a usable width. Test ids derive from `testIdPrefix` (`<prefix>-switcher`, `-select`,
 * `-previous`, `-next`, `-group-<group>`, `-option-<key>`).
 */
export function EventInstanceSwitcher<TInstance extends SwitcherInstance>({
  instances,
  selectedKey,
  onSelect,
  renderOption,
  labels,
  testIdPrefix,
  className,
}: {
  /** Every instance, chronological (ascending by start). */
  instances: readonly TInstance[]
  selectedKey: string | null
  onSelect: (key: string) => void
  /** An option's content (icon and label); the trigger shows the selected option's. */
  renderOption: (instance: TInstance) => ReactNode
  labels: EventInstanceSwitcherLabels
  testIdPrefix: string
  className?: string
}) {
  const groups = groupSwitcherInstances(instances)
  const { previous, next } = adjacentSwitcherKeys(instances, selectedKey)

  return (
    <div
      className={cn("flex w-full items-center gap-2 md:w-auto", className)}
      data-testid={`${testIdPrefix}-switcher`}
    >
      <Button
        aria-label={labels.previous}
        data-testid={`${testIdPrefix}-previous`}
        disabled={previous === null}
        onClick={() => previous && onSelect(previous)}
        size="icon-sm"
        variant="outline"
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Select
        disabled={instances.length === 0}
        onValueChange={onSelect}
        value={selectedKey ?? ""}
      >
        <SelectTrigger
          aria-label={labels.label}
          // The status line below shows the event's icon; the trigger keeps only its name.
          className="min-w-0 flex-1 md:w-72 md:flex-none [&_[data-slot=select-value]_img]:hidden"
          data-testid={`${testIdPrefix}-select`}
        >
          <SelectValue
            placeholder={
              instances.length === 0 ? labels.empty : labels.placeholder
            }
          />
        </SelectTrigger>
        <SelectContent position="popper">
          {GROUPS.map((group) =>
            groups[group].length > 0 ? (
              <SelectGroup
                key={group}
                data-testid={`${testIdPrefix}-group-${group}`}
              >
                <SelectLabel>{labels.groups[group]}</SelectLabel>
                {groups[group].map((instance) => (
                  <SelectItem
                    key={instance.key}
                    data-testid={`${testIdPrefix}-option-${instance.key}`}
                    value={instance.key}
                  >
                    {renderOption(instance)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null
          )}
        </SelectContent>
      </Select>
      <Button
        aria-label={labels.next}
        data-testid={`${testIdPrefix}-next`}
        disabled={next === null}
        onClick={() => next && onSelect(next)}
        size="icon-sm"
        variant="outline"
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  )
}
