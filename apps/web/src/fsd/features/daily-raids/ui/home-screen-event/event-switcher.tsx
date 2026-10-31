import { useTranslation } from "react-i18next"
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

import { EventIcon } from "@/shared/ui"

import {
  adjacentHomeScreenEventKeys,
  groupHomeScreenEventInstances,
} from "../../model/home-screen-event-switcher"
import type {
  HomeScreenEventEntry,
  HomeScreenEventInstance,
} from "../../model/select-active-home-screen-event"
import {
  formatHomeScreenEventDates,
  useHomeScreenEventName,
} from "./use-home-screen-event-name"
import { useDateLocale } from "@/shared/lib"

const GROUPS = ["running", "upcoming", "past"] as const

/**
 * Picks which Home Screen Event instance the HSE tab shows: a select grouped Running / Upcoming / Past
 * (each option its localized name and date range) between Previous / Next buttons that step through
 * the instances by start. Desktop: inline `[<] [select] [>]` on the title row. Mobile (< 768px): a
 * full-width row with the arrows at its ends, so the select keeps a usable width. Layout is container
 * classes only, so the tour targets the same element on both.
 */
export function EventSwitcher({
  instances,
  selectedKey,
  onSelect,
  className,
}: {
  instances: readonly HomeScreenEventInstance<HomeScreenEventEntry>[]
  selectedKey: string | null
  onSelect: (key: string) => void
  className?: string
}) {
  const { t } = useTranslation("dailies")
  const dateLocale = useDateLocale()
  const eventName = useHomeScreenEventName()
  const groups = groupHomeScreenEventInstances(instances)
  const { previous, next } = adjacentHomeScreenEventKeys(instances, selectedKey)

  return (
    <div
      className={cn("flex w-full items-center gap-2 md:w-auto", className)}
      data-testid="hse-event-switcher"
    >
      <Button
        aria-label={t("hse.switcher.previous")}
        data-testid="hse-event-previous"
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
          aria-label={t("hse.switcher.label")}
          // The status line below shows the event's medallion; the trigger keeps only its name.
          className="min-w-0 flex-1 md:w-72 md:flex-none [&_[data-slot=select-value]_img]:hidden"
          data-testid="hse-event-select"
        >
          <SelectValue
            placeholder={
              instances.length === 0
                ? t("hse.switcher.empty")
                : t("hse.switcher.placeholder")
            }
          />
        </SelectTrigger>
        <SelectContent position="popper">
          {GROUPS.map((group) =>
            groups[group].length > 0 ? (
              <SelectGroup key={group} data-testid={`hse-event-group-${group}`}>
                <SelectLabel>{t(`hse.switcher.groups.${group}`)}</SelectLabel>
                {groups[group].map((instance) => (
                  <SelectItem
                    key={instance.key}
                    data-testid={`hse-event-option-${instance.key}`}
                    value={instance.key}
                  >
                    <EventIcon
                      className="size-6 shrink-0"
                      definitionId={instance.entry.definitionId}
                      definitionType="HomeScreenEvent"
                      parameters={instance.entry.parameters ?? null}
                    />
                    {t("hse.switcher.option", {
                      name: eventName(instance.entry),
                      dates: formatHomeScreenEventDates(
                        instance.entry,
                        dateLocale
                      ),
                    })}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null
          )}
        </SelectContent>
      </Select>
      <Button
        aria-label={t("hse.switcher.next")}
        data-testid="hse-event-next"
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
