import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { allianceIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"

import {
  NPC_ENCOUNTER_SOURCES,
  activeNpcFilterCount,
  emptyNpcFilters,
  NO_ENCOUNTER_PLACES,
  encountersOf,
  encounterAllowedByFilters,
  matchesNpcFilters,
  matchingEncounterPlaces,
  filterNpcGroups,
  matchingVariations,
  orderLevels,
  portraitVariationOf,
  sortEncountersBySource,
  useNpcLabels,
  variationDamageTypes,
  variationMode,
  variationModeLabelKey,
} from "@/entities/npc"
import type {
  NpcEncounter,
  NpcEncounterLookup,
  NpcFilters,
} from "@/entities/npc"
import { useMinuteNow } from "@/entities/legendary-event"
import { unitNeighbours } from "@/entities/unit"
import { useTourPageSteps } from "@/shared/tour"
import { useUnitPowerContext } from "@/shared/unit-power"

import { useEncounterGroupName } from "../../model/npcs/use-encounter-group-name"
import { encounterTiming } from "../../model/encounter-timing"
import {
  encounterGroupIcon,
  encounterSourceIcon,
} from "../../model/npcs/encounter-group-icon"

import { useNpcEncounters } from "../../model/npcs/use-npc-encounters"
import { useNpcsCatalog } from "../../model/npcs/use-npcs-catalog"
import { numberRepeatedLabels } from "../../model/npcs/number-repeated-labels"
import { NpcDetailPage } from "./npc-detail-page"
import { NpcsListPage } from "./npcs-list-page"
import { useNpcsTutorial } from "./npcs.tutorial"
import {
  npcListSections,
  npcPowerFigure,
} from "../../model/npcs/npcs-page.view-model"
import type {
  NpcFilterOptions,
  NpcListItem,
  NpcsPageViewProps,
  NpcVariationOption,
} from "../../model/npcs/npcs-page.view-model"

const COLLECTION_PATH = "/library/npcs"

/** A non-negative integer query value, else `undefined`. */
function parseLevel(raw: string | null): number | undefined {
  if (raw === null || !/^\d+$/.test(raw)) return undefined
  return Number(raw)
}

export function NpcsPage() {
  const { t } = useTranslation(["library", "damageTypes", "traits"])
  const { entityId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const catalog = useNpcsCatalog()
  const { groupName, factionName } = useNpcLabels()
  const encounterGroupName = useEncounterGroupName()

  // Filters describe the list, not the selected entity, so they stay page-local (reset on unmount)
  // rather than in the URL — see design D7.
  const [filterState, setFilters] = useState<NpcFilters>(emptyNpcFilters)

  // The encounter filters need the encounter data (and "running now" the calendar too); without it their
  // controls are hidden, so a chosen value must not keep narrowing the list out of sight.
  const { encounters: encounterData, calendar } = useNpcEncounters()
  // Only "running now" depends on the time, so nothing recomputes each minute while it is off.
  const readsClock = filterState.runningNow
  const nowMs = useMinuteNow(
    useCallback((now: number) => (readsClock ? now : 0), [readsClock])
  )
  const encounterLookup = useMemo<NpcEncounterLookup | undefined>(() => {
    if (encounterData.status !== "present") return undefined
    const { index } = encounterData
    // Many encounters share a group, and each answer scans the calendar.
    const running = new Map<string, boolean>()
    return {
      encountersOf: (variationId) => encountersOf(index, variationId),
      isRunning: ({ source, groupId }) => {
        const key = `${source}|${groupId}`
        const known = running.get(key)
        if (known !== undefined) return known
        const isRunning =
          encounterTiming(source, groupId, calendar, nowMs)?.kind === "running"
        running.set(key, isRunning)
        return isRunning
      },
    }
  }, [encounterData, calendar, nowMs])
  const hasEncounters = encounterLookup !== undefined
  const canFilterRunning = hasEncounters && calendar !== null
  // Every game mode an NPC is fought in, with its locations.
  const locationsByMode = useMemo(() => {
    const modes = new Map<string, Map<string, NpcEncounter>>()
    for (const group of catalog.groups) {
      for (const variation of group.variations) {
        for (const encounter of encounterLookup?.encountersOf(variation.id) ??
          []) {
          const locations =
            modes.get(encounter.source) ?? new Map<string, NpcEncounter>()
          locations.set(encounter.groupId, encounter)
          modes.set(encounter.source, locations)
        }
      }
    }
    return modes
  }, [catalog.groups, encounterLookup])
  const filters = useMemo<NpcFilters>(() => {
    const { gameMode, encounterGroup } = filterState
    // Refreshed data can drop the chosen game mode or location, and its control may be hidden by then.
    const modeOffered = gameMode !== null && locationsByMode.has(gameMode)
    const locationOffered =
      modeOffered &&
      encounterGroup !== null &&
      locationsByMode.get(gameMode)?.has(encounterGroup) === true
    return {
      ...filterState,
      gameMode: modeOffered ? gameMode : null,
      encounterGroup: locationOffered ? encounterGroup : null,
      minCount: hasEncounters ? filterState.minCount : null,
      runningNow: canFilterRunning && filterState.runningNow,
    }
  }, [filterState, hasEncounters, canFilterRunning, locationsByMode])

  // `/library/npcs` is the list; `/library/npcs/{id}` is that NPC's page. The id is looked up in
  // every group (not the filtered view), so applying a filter never sends the page away. An unknown
  // id goes back to the list.
  const selectedGroup = entityId ? catalog.byId.get(entityId) : undefined
  const selectedId = selectedGroup?.id
  const unknownEntity =
    catalog.status === "ready" && entityId !== undefined && !selectedGroup
  useEffect(() => {
    if (unknownEntity)
      void navigate(
        { pathname: COLLECTION_PATH, search: "" },
        { replace: true }
      )
  }, [navigate, unknownEntity])

  const listedGroups = useMemo(
    () => filterNpcGroups(catalog.groups, filters, groupName, encounterLookup),
    [catalog.groups, filters, groupName, encounterLookup]
  )
  // In section order (enemies, then playable characters), which Previous / Next also follow.
  const items = useMemo<NpcListItem[]>(() => {
    const { enemies, playable } = npcListSections(
      listedGroups.map((group) => ({
        id: group.id,
        name: groupName(group),
        factionId: group.factionId,
        factionName: factionName(group.factionId),
        portraitVariationId: portraitVariationOf(group),
        characterId: group.characterId,
      }))
    )
    return [...enemies, ...playable]
  }, [listedGroups, groupName, factionName])

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
    const locations =
      filters.gameMode === null
        ? undefined
        : locationsByMode.get(filters.gameMode)
    return {
      factions: [...factions]
        .map(([id, name]) => ({ id, name }))
        .toSorted(byName),
      alliances: [...alliances]
        .map((id) => ({
          id,
          name: t(`library:npcs.alliances.${id}`, { defaultValue: id }),
          icon: allianceIcon(id),
        }))
        .toSorted(byName),
      damageTypes: [...damageTypes]
        .map((id) => ({
          id,
          name: t(`damageTypes:${id}`, { defaultValue: id }),
        }))
        .toSorted(byName),
      traits: [...traits]
        .map((id) => ({ id, name: t(`traits:${id}`, { defaultValue: id }) }))
        .toSorted(byName),
      // Fixed source order, not alphabetical: the same order as the encounters section.
      gameModes: NPC_ENCOUNTER_SOURCES.filter((source) =>
        locationsByMode.has(source)
      ).map((id) => ({
        id,
        name: t(`library:npcs.encounters.source.${id}`, { defaultValue: id }),
        icon: encounterSourceIcon(id),
      })),
      locations: [...(locations ?? [])]
        .map(([id, encounter]) => ({
          id,
          name: encounterGroupName(encounter),
          icon: encounterGroupIcon(encounter),
        }))
        .toSorted(byName),
      canFilterRunning,
    }
  }, [
    canFilterRunning,
    catalog.groups,
    encounterGroupName,
    factionName,
    filters.gameMode,
    locationsByMode,
    t,
  ])

  // --- Variation resolution -------------------------------------------------------------------
  const search = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  )
  const requestedVariationId = search.get("variation")
  const matching = useMemo(
    () =>
      selectedGroup
        ? matchingVariations(selectedGroup, filters, encounterLookup)
        : [],
    [selectedGroup, filters, encounterLookup]
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
        ? numberRepeatedLabels(
            matching.map((variation) => {
              const mode = variationMode(
                variation.id,
                variation.id === selectedGroup.defaultVariationId
              )
              return {
                id: variation.id,
                mode,
                label: t(`library:${variationModeLabelKey(mode)}`, {
                  defaultValue: mode,
                }),
              }
            })
          )
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
  // Previous / Next follow the list the NPC was opened from (the filtered list); an NPC the filters
  // leave out steps through every NPC instead.
  const neighbours = useMemo(() => {
    if (!selectedId) return { index: -1, total: 0 }
    const listedIds = items.map((item) => item.id)
    const ids = listedIds.includes(selectedId)
      ? listedIds
      : catalog.groups.map((group) => group.id)
    return unitNeighbours(ids, selectedId)
  }, [catalog.groups, items, selectedId])
  const nameOf = useCallback(
    (groupId: string) => {
      const group = catalog.byId.get(groupId)
      return group ? groupName(group) : groupId
    },
    [catalog.byId, groupName]
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
  // A battle chip names one variation at one level, so filters that exclude it give way rather than move the
  // page to another variation.
  const onOpenBattleVariation = useCallback(
    (variationId: string) => {
      const variation = catalog.groups
        .flatMap((group) => group.variations)
        .find(({ id }) => id === variationId)
      if (
        variation &&
        !matchesNpcFilters(variation, filters, encounterLookup)
      ) {
        setFilters(emptyNpcFilters)
      }
    },
    [catalog.groups, encounterLookup, filters]
  )

  useTourPageSteps(useNpcsTutorial(selectedGroup !== undefined))
  const powerContext = useUnitPowerContext()

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
    neighbours,
    nameOf,
    variationOptions,
    selectedVariation,
    onVariationChange,
    levels,
    selectedLevel,
    onLevelChange,
    power: npcPowerFigure(
      selectedVariation?.id,
      selectedLevel?.row,
      powerContext
    ),
    encounters:
      encounterData.status === "present" && selectedVariation
        ? sortEncountersBySource(
            encountersOf(encounterData.index, selectedVariation.id)
          )
        : [],
    matchingPlaces:
      filters.minCount === null || !encounterLookup
        ? null
        : (encounter) =>
            encounterAllowedByFilters(encounter, filters, encounterLookup)
              ? matchingEncounterPlaces(encounter, filters.minCount)
              : new Set<string>(),
    onOpenBattleVariation,
    encounterPlaces:
      encounterData.status === "present"
        ? encounterData.places
        : NO_ENCOUNTER_PLACES,
    encountersStatus: encounterData.status,
    calendar,
  }

  return (
    <div data-testid="npcs-library-page">
      {selectedGroup ? (
        <NpcDetailPage {...viewProps} />
      ) : (
        <NpcsListPage {...viewProps} />
      )}
    </div>
  )
}
