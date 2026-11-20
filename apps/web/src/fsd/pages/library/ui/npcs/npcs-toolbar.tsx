import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Funnel, Search, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import type { NpcFilters } from "@/entities/npc"
import {
  PageToolbar,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { NpcsFilterBar } from "./npcs-filter-bar"
import type { NpcFilterOptions } from "./npcs-page.view-model"

/**
 * The NPCs page toolbar (ui-style-guide rule 2). Find: name search, always visible (it is how you
 * reach an NPC you already have in mind, not one of the filters), then the "Filters" button with the
 * active count. The filters open in a popover on desktop and a bottom sheet on mobile, so the list
 * and the detail stay where they are.
 */
export function NpcsToolbar({
  filters,
  options,
  activeCount,
  onChange,
  onClear,
}: {
  filters: NpcFilters
  options: NpcFilterOptions
  activeCount: number
  onChange: (filters: NpcFilters) => void
  onClear: () => void
}) {
  const { t } = useTranslation("library")
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  // The mobile sheet opens from state, not a Radix trigger, so it hands focus back itself.
  const filtersButtonRef = useRef<HTMLButtonElement>(null)
  const label =
    activeCount > 0
      ? t("npcs.filtersCount", { count: activeCount })
      : t("npcs.filters")

  const filtersButton = (onClick?: () => void) => (
    <Button
      ref={onClick ? filtersButtonRef : undefined}
      variant="outline"
      aria-expanded={open}
      onClick={onClick}
      data-testid="npcs-filters-toggle"
    >
      <Funnel aria-hidden />
      {label}
    </Button>
  )

  const filterBar = (
    <NpcsFilterBar
      filters={filters}
      options={options}
      activeCount={activeCount}
      onChange={onChange}
      onClear={onClear}
      hideClear={isMobile}
    />
  )

  return (
    <PageToolbar
      find={
        <>
          <div className="relative min-w-40 flex-1 sm:max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={filters.search}
              onChange={(event) =>
                onChange({ ...filters, search: event.target.value })
              }
              placeholder={t("npcs.searchPlaceholder")}
              aria-label={t("npcs.search")}
              className="pl-8"
              data-testid="npcs-search"
            />
          </div>
          {isMobile ? (
            <>
              {filtersButton(() => setOpen(true))}
              <ResponsiveDialog
                open={open}
                onOpenChange={setOpen}
                onCloseAutoFocus={(event) => {
                  event.preventDefault()
                  filtersButtonRef.current?.focus()
                }}
                data-testid="npcs-filter-sheet"
              >
                <ResponsiveDialogHeader>
                  <ResponsiveDialogTitle>
                    {t("npcs.filters")}
                  </ResponsiveDialogTitle>
                </ResponsiveDialogHeader>
                <ResponsiveDialogBody>
                  {/* Clears the sheet's close button, which sits beside the title. */}
                  <div className="pt-5">{filterBar}</div>
                </ResponsiveDialogBody>
                <ResponsiveDialogFooter>
                  <Button
                    className="md:mr-auto"
                    variant="ghost"
                    onClick={onClear}
                    disabled={activeCount === 0}
                    data-testid="npcs-clear-filters"
                  >
                    <X aria-hidden />
                    {t("npcs.clearFilters")}
                  </Button>
                  <Button onClick={() => setOpen(false)}>
                    {t("npcs.filtersDone")}
                  </Button>
                </ResponsiveDialogFooter>
              </ResponsiveDialog>
            </>
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>{filtersButton()}</PopoverTrigger>
              <PopoverContent align="start" className="w-80">
                {filterBar}
              </PopoverContent>
            </Popover>
          )}
        </>
      }
      testId="npcs-toolbar"
    />
  )
}
