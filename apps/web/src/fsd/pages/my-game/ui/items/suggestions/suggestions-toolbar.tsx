import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { factionIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import { Switch } from "@workspace/ui/components/switch"

import {
  EntityIcon,
  FilterField,
  FiltersControl,
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
 * (a "Show locked slots" switch, off by default, then Faction), then Clear filters while anything
 * differs from the defaults. Nothing to switch in View.
 */
export function SuggestionsToolbar({ query, update, factions }: ToolbarProps) {
  const { t } = useTranslation("myItems")
  const setSearch = useCallback((q: string) => update({ q }), [update])

  return (
    <PageToolbar
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
            count={
              (query.unlocked ? 0 : 1) + (query.faction.length > 0 ? 1 : 0)
            }
            onClear={() =>
              update({
                unlocked: DEFAULT_SUGGESTIONS_QUERY.unlocked,
                faction: DEFAULT_SUGGESTIONS_QUERY.faction,
              })
            }
            size="compact"
            testId="items-suggestions-filters"
          >
            <FilterField inline label={t("suggestions.toolbar.locked")}>
              {({ id }) => (
                <Switch
                  checked={!query.unlocked}
                  id={id}
                  onCheckedChange={(locked) => update({ unlocked: !locked })}
                />
              )}
            </FilterField>
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
          {suggestionsQueryNarrows(query) || !query.unlocked ? (
            <Button
              onClick={() =>
                update({
                  q: DEFAULT_SUGGESTIONS_QUERY.q,
                  unlocked: DEFAULT_SUGGESTIONS_QUERY.unlocked,
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
