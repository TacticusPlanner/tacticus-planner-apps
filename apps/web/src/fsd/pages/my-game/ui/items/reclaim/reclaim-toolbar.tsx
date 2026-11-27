import { useCallback, useId } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ToggleGroup } from "@workspace/ui/components/toggle-group"

import {
  FILTER_CHIP_CLASS_NAME,
  HintedToggleGroupItem,
  PageToolbar,
  SearchField,
} from "@/shared/ui"

import type { ReclaimQuery } from "../../../model/items/reclaim-query"

/** The search writes the URL, so it waits for a pause in typing. */
const SEARCH_DELAY_MS = 200
const CHIPS = ["safe", "upgraded"] as const

type ToolbarProps = {
  query: ReclaimQuery
  update: (patch: Partial<ReclaimQuery>) => void
}

/**
 * The Reclaim tab's toolbar (ui-style-guide rule 2): an item search (with Clear search while one is
 * typed), then "Safe only" (on by default) and "Upgraded only" in the Quick filters row.
 */
export function ReclaimToolbar({ query, update }: ToolbarProps) {
  const { t } = useTranslation("myItems")
  const setSearch = useCallback((q: string) => update({ q }), [update])
  const labelId = useId()
  return (
    <PageToolbar
      chips={
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground" id={labelId}>
            {t("reclaim.toolbar.chipsLabel")}
          </span>
          <ToggleGroup
            aria-labelledby={labelId}
            className="shrink-0"
            onValueChange={(values) =>
              update({
                safe: values.includes("safe"),
                upgraded: values.includes("upgraded"),
              })
            }
            size="sm"
            spacing={1}
            type="multiple"
            value={CHIPS.filter((chip) => query[chip])}
            variant="outline"
          >
            {CHIPS.map((chip) => (
              <HintedToggleGroupItem
                className={FILTER_CHIP_CLASS_NAME}
                key={chip}
                value={chip}
              >
                {t(`reclaim.toolbar.${chip}`)}
              </HintedToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      }
      find={
        <div
          aria-label={t("reclaim.toolbar.label")}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
          role="search"
        >
          <SearchField
            debounceMs={SEARCH_DELAY_MS}
            label={t("reclaim.toolbar.search")}
            onChange={setSearch}
            testId="items-reclaim-search"
            value={query.q}
          />
          {query.q.trim() === "" ? null : (
            <Button onClick={() => update({ q: "" })} variant="ghost">
              <X aria-hidden />
              {t("reclaim.noMatch.clearSearch")}
            </Button>
          )}
        </div>
      }
      testId="items-reclaim-toolbar"
    />
  )
}
