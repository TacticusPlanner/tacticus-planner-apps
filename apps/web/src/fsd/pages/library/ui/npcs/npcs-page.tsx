import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  activeNpcFilterCount,
  emptyNpcFilters,
  filterNpcGroups,
  matchingVariations,
  orderLevels,
  useNpcLabels,
  variationDamageTypes,
  variationMode,
  variationModeLabelKey,
  type NpcFilters,
} from "@/entities/npc"
import { useTourPageSteps } from "@/shared/tour"

import { useLibraryRouteSelection } from "../../model/use-library-route-selection"
import { NpcsDesktopPage } from "./desktop/npcs-desktop-page"
import { useNpcsCatalog } from "./hooks/use-npcs-catalog"
import { NpcsMobilePage } from "./mobile/npcs-mobile-page"
import { useNpcsTutorial } from "./npcs.tutorial"
import type {
  NpcFilterOptions,
  NpcListItem,
  NpcsPageViewProps,
  NpcVariationOption,
} from "./npcs-page.view-model"

const COLLECTION_PATH = "/library/npcs"

/** A non-negative integer query value, else `undefined`. */
function parseLevel(raw: string | null): number | undefined {
  if (raw === null || !/^\d+$/.test(raw)) return undefined
  return Number(raw)
}

export function NpcsPage() {
  const { t } = useTranslation(["library", "damageTypes", "traits"])
  const isMobile = useIsMobile()
  const { entityId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const catalog = useNpcsCatalog()
  const { groupName, factionName } = useNpcLabels()

  // Filters describe the list, not the selected entity, so they stay page-local (reset on unmount)
  // rather than in the URL — see design D7.
  const [filters, setFilters] = useState<NpcFilters>(emptyNpcFilters)

  // Route selection runs over every listed group (not the filtered view) so applying a filter never
  // redirects the current entity away.
  const groupIds = useMemo(
    () => catalog.groups.map((group) => group.id),
    [catalog.groups]
  )
  const { selectedId } = useLibraryRouteSelection({
    collectionPath: COLLECTION_PATH,
    entityId,
    entityIds: catalog.status === "ready" ? groupIds : undefined,
    loading: catalog.status !== "ready",
  })
  const selectedGroup = selectedId ? catalog.byId.get(selectedId) : undefined

  const listedGroups = useMemo(
    () => filterNpcGroups(catalog.groups, filters, groupName),
    [catalog.groups, filters, groupName]
  )
  const items = useMemo<NpcListItem[]>(
    () =>
      listedGroups.map((group) => ({
        id: group.id,
        name: groupName(group),
        factionId: group.factionId,
        factionName: factionName(group.factionId),
        portraitVariationId: group.defaultVariationId,
      })),
    [listedGroups, groupName, factionName]
  )

  const filterOptions = useMemo<NpcFilterOptions>(() => {
    const factions = new Map<string, string>()
    const alliances = new Set<string>()
    const damageTypes = new Set<string>()
    const traits = new Set<string>()
    for (const group of catalog.groups) {
      for (const variation of group.variations) {
        factions.set(variation.factionId, factionName(variation.factionId))
        alliances.add(variation.alliance)
        // A couple of non-combat units are served with an empty damage profile; an empty id would
        // render as a blank, unselectable row at the top of the list.
        for (const type of variationDamageTypes(variation)) {
          if (type.trim() !== "") damageTypes.add(type)
        }
        for (const trait of variation.traits) {
          if (trait.trim() !== "") traits.add(trait)
        }
      }
    }
    const byName = (a: { name: string }, b: { name: string }) =>
      a.name.localeCompare(b.name)
    return {
      factions: [...factions].map(([id, name]) => ({ id, name })).sort(byName),
      alliances: [...alliances]
        .map((id) => ({
          id,
          name: t(`library:npcs.alliances.${id}`, { defaultValue: id }),
        }))
        .sort(byName),
      damageTypes: [...damageTypes]
        .map((id) => ({
          id,
          name: t(`damageTypes:${id}`, { defaultValue: id }),
        }))
        .sort(byName),
      traits: [...traits]
        .map((id) => ({ id, name: t(`traits:${id}`, { defaultValue: id }) }))
        .sort(byName),
    }
  }, [catalog.groups, factionName, t])

  // --- Variation resolution -------------------------------------------------------------------
  const search = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  )
  const requestedVariationId = search.get("variation")
  const matching = useMemo(
    () => (selectedGroup ? matchingVariations(selectedGroup, filters) : []),
    [selectedGroup, filters]
  )
  const selectedVariation = useMemo(() => {
    if (!selectedGroup || matching.length === 0) return undefined
    const requested = matching.find((v) => v.id === requestedVariationId)
    if (requested) return requested
    return (
      matching.find((v) => v.id === selectedGroup.defaultVariationId) ??
      matching[0]
    )
  }, [selectedGroup, matching, requestedVariationId])

  // The URL names a real variation of this group that the active filters exclude: move the URL to the
  // variation actually shown (spec: "selected variation stops matching"). An absent or unknown
  // `variation` is resolved silently and never written back.
  useEffect(() => {
    if (!selectedGroup || !selectedVariation || !requestedVariationId) return
    const isRealVariation = selectedGroup.variations.some(
      (v) => v.id === requestedVariationId
    )
    if (!isRealVariation || requestedVariationId === selectedVariation.id)
      return
    const next = new URLSearchParams(location.search)
    next.set("variation", selectedVariation.id)
    next.delete("level")
    void navigate(
      { pathname: location.pathname, search: next.toString() },
      { replace: true }
    )
  }, [
    selectedGroup,
    selectedVariation,
    requestedVariationId,
    location.pathname,
    location.search,
    navigate,
  ])

  const variationOptions = useMemo<NpcVariationOption[]>(
    () =>
      selectedGroup
        ? matching.map((variation) => {
            const mode = variationMode(
              variation.id,
              variation.id === selectedGroup.defaultVariationId
            )
            return {
              id: variation.id,
              mode,
              label:
                mode === "unknown"
                  ? variation.id
                  : t(`library:${variationModeLabelKey(mode)}`, {
                      defaultValue: mode,
                    }),
            }
          })
        : [],
    [selectedGroup, matching, t]
  )

  // --- Level resolution -----------------------------------------------------------------------
  const levels = useMemo(
    () => (selectedVariation ? orderLevels(selectedVariation) : []),
    [selectedVariation]
  )
  const selectedLevel = useMemo(() => {
    if (levels.length === 0) return undefined
    const requested = parseLevel(search.get("level"))
    return levels.find((l) => l.servedIndex === requested) ?? levels[0]
  }, [levels, search])

  // --- Navigation -----------------------------------------------------------------------------
  const onSelect = useCallback(
    (groupId: string) => {
      void navigate({ pathname: `${COLLECTION_PATH}/${groupId}`, search: "" })
    },
    [navigate]
  )
  const onVariationChange = useCallback(
    (variationId: string) => {
      const next = new URLSearchParams(location.search)
      next.set("variation", variationId)
      next.delete("level")
      void navigate({ pathname: location.pathname, search: next.toString() })
    },
    [location.pathname, location.search, navigate]
  )
  const onLevelChange = useCallback(
    (servedIndex: number) => {
      const next = new URLSearchParams(location.search)
      next.set("level", String(servedIndex))
      void navigate({ pathname: location.pathname, search: next.toString() })
    },
    [location.pathname, location.search, navigate]
  )
  const onClearFilters = useCallback(() => setFilters(emptyNpcFilters), [])

  useTourPageSteps(useNpcsTutorial())

  if (catalog.status === "loading") {
    return (
      <p
        className="py-10 text-center text-muted-foreground"
        data-testid="npcs-library-page"
      >
        {t("library:loading")}
      </p>
    )
  }

  if (catalog.status === "failed") {
    return (
      <div
        className="flex flex-col items-center gap-4 py-10 text-center text-muted-foreground"
        data-testid="npcs-library-page"
      >
        <p data-testid="npcs-load-failed">{t("library:npcs.loadFailed")}</p>
        <Button variant="outline" onClick={catalog.retry}>
          {t("library:npcs.retry")}
        </Button>
      </div>
    )
  }

  if (catalog.groups.length === 0) {
    return (
      <p
        className="py-10 text-center text-muted-foreground"
        data-testid="npcs-library-page"
      >
        {t("library:collections.noRecords")}
      </p>
    )
  }

  const viewProps: NpcsPageViewProps = {
    items,
    filters,
    filterOptions,
    activeFilterCount: activeNpcFilterCount(filters),
    onFiltersChange: setFilters,
    onClearFilters,
    selectedGroup,
    selectedName: selectedGroup ? groupName(selectedGroup) : "",
    selectedId,
    onSelect,
    variationOptions,
    selectedVariation,
    onVariationChange,
    levels,
    selectedLevel,
    onLevelChange,
  }

  return (
    <div data-testid="npcs-library-page">
      {isMobile ? (
        <NpcsMobilePage {...viewProps} />
      ) : (
        <NpcsDesktopPage {...viewProps} />
      )}
    </div>
  )
}
