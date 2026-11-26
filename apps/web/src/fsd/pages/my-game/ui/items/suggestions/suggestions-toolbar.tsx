import { useCallback, useId } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { factionIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import { ToggleGroup } from "@workspace/ui/components/toggle-group"

import {
  EntityIcon,
  FILTER_CHIP_CLASS_NAME,
  FilterField,
  FiltersControl,
  HintedToggleGroupItem,
  MultiSelect,
  PageToolbar,
  SearchField,
} from "@/shared/ui"

import {
  DEFAULT_SUGGESTIONS_QUERY,
  suggestionsQueryNarrows,
} from "../../../model/items/suggestions-query"
import type { SuggestionsQuery } from "../../../model/items/suggestions-query"

/** The search writes the URL, so it waits for a pause in typing. */
const SEARCH_DELAY_MS = 200

type ToolbarProps = {
  query: SuggestionsQuery
  update: (patch: Partial<SuggestionsQuery>) => void
  factions: readonly { id: string; name: string }[]
}

/**
 * The Suggestions tab's toolbar (ui-style-guide rule 2). Find: a character search and Filters
 * (Faction), then Clear filters while either narrows the list. The chip row holds "Unlocked slots
 * only", on by default. Nothing to switch in View.
 */
export function SuggestionsToolbar({ query, update, factions }: ToolbarProps) {
  const { t } = useTranslation("myItems")
  const setSearch = useCallback((q: string) => update({ q }), [update])
  const labelId = useId()

  return (
    <PageToolbar
      chips={
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground" id={labelId}>
            {t("suggestions.toolbar.chipsLabel")}
          </span>
          <ToggleGroup
            aria-labelledby={labelId}
            className="shrink-0"
            onValueChange={(values) =>
              update({ unlocked: values.includes("unlocked") })
            }
            size="sm"
            spacing={1}
            type="multiple"
            value={query.unlocked ? ["unlocked"] : []}
            variant="outline"
          >
            <HintedToggleGroupItem
              className={FILTER_CHIP_CLASS_NAME}
              data-testid="items-suggestions-unlocked-chip"
              value="unlocked"
            >
              {t("suggestions.toolbar.unlocked")}
            </HintedToggleGroupItem>
          </ToggleGroup>
        </div>
      }
      find={
        <div
          aria-label={t("suggestions.toolbar.label")}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
          data-testid="items-suggestions-find"
          role="search"
        >
          <SearchField
            debounceMs={SEARCH_DELAY_MS}
            label={t("suggestions.toolbar.search")}
            onChange={setSearch}
            testId="items-suggestions-search"
            value={query.q}
          />
          <FiltersControl
            count={query.faction.length > 0 ? 1 : 0}
            onClear={() => update({ faction: [] })}
            size="compact"
            testId="items-suggestions-filters"
          >
            <FilterField
              icon="faction"
              label={t("suggestions.toolbar.faction")}
            >
              <MultiSelect
                clearLabel={t("suggestions.toolbar.clearFactions")}
                data-testid="items-suggestions-faction-filter"
                label={t("suggestions.toolbar.faction")}
                onChange={(faction) => update({ faction })}
                options={factions.map((faction) => ({
                  value: faction.id,
                  label: faction.name,
                  icon: (
                    <EntityIcon
                      alt=""
                      className="shrink-0"
                      size="icon"
                      src={factionIcon(faction.id)}
                    />
                  ),
                }))}
                placeholder={t("suggestions.toolbar.allFactions")}
                value={query.faction}
              />
            </FilterField>
          </FiltersControl>
          {suggestionsQueryNarrows(query) ? (
            <Button
              onClick={() =>
                update({
                  q: DEFAULT_SUGGESTIONS_QUERY.q,
                  faction: DEFAULT_SUGGESTIONS_QUERY.faction,
                })
              }
              variant="ghost"
            >
              <X aria-hidden />
              {t("suggestions.toolbar.clearFilters")}
            </Button>
          ) : null}
        </div>
      }
      testId="items-suggestions-toolbar"
    />
  )
}
