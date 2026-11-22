import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Tabs, TabsContent } from "@workspace/ui/components/tabs"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  UNTIERED_MULTIPLIER,
  buildHordeTierList,
  useHordeModeTiers,
  useLegendaryEventRoster,
  useLegendaryEventUnits,
} from "@/entities/legendary-event"
import type { HordeTierList } from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"
import { useTourPageSteps } from "@/shared/tour"
import { useUnitName, useUnitSearchNames } from "@/shared/unit-name"

import { EmptyState, PageTabsList, PageTabsTrigger } from "@/shared/ui"

import { NpcTierListView } from "./npc-tier-list-view"
import {
  TIER_LIST_KINDS,
  parseTierListKind,
  tierListKindSearchParams,
} from "./npc-tier-list.view-model"
import { TierListFilters } from "./tier-list-filters"
import { useTierListTutorial } from "./tier-list.tutorial"
import {
  DEFAULT_TIER_LIST_FILTERS,
  formatMultiplier,
  hasActiveFilters,
  isAwaitingOwnedRoster,
  isTierListEmpty,
  parseTierListFilters,
  shouldAutoExpandUntiered,
  tierListSearchParams,
  tierListFiltersKey,
  tierTileDetails,
} from "./tier-list.view-model"
import type { TierListUrlFilters } from "./tier-list.view-model"
import { TierRow, UntieredRow } from "./tier-row"
import { TierTile } from "./tier-tile"
import type { TierTileView } from "./tier-tile"
import { TierTileDetailsSheet } from "./tier-tile-details"

type TierRef = { tier: string; multiplier: number } | null

/** `/legendary-events/tier-list`: the Heroes list (the character horde-mode tier list) or, with
 *  `?list=enemies`, the Enemies list (the NPC tier list of the active events), switched at the top. */
export function TierListPage() {
  const { t } = useTranslation("legendaryEvents")
  const [searchParams, setSearchParams] = useSearchParams()
  const kind = parseTierListKind(searchParams)
  // The page's underline tabs (ui-style-guide rule 4); the URL holds the selection, and the
  // inactive view is unmounted.
  return (
    <Tabs
      className="flex min-w-0 flex-col gap-4"
      onValueChange={(value) => {
        const next = TIER_LIST_KINDS.find((item) => item === value)
        if (next)
          setSearchParams(
            (current) => tierListKindSearchParams(current, next),
            { replace: true }
          )
      }}
      value={kind}
    >
      <PageTabsList
        aria-label={t("npcTierList.kind.label")}
        data-testid="tier-list-kind"
      >
        {TIER_LIST_KINDS.map((item) => (
          <PageTabsTrigger
            data-testid={`tier-list-kind-${item}`}
            key={item}
            value={item}
          >
            {t(`npcTierList.kind.${item}`)}
          </PageTabsTrigger>
        ))}
      </PageTabsList>
      <TabsContent className="min-w-0" value="heroes">
        <HeroTierList />
      </TabsContent>
      <TabsContent className="min-w-0" value="enemies">
        <NpcTierListView />
      </TabsContent>
    </Tabs>
  )
}

/** The catalog horde-mode tier list (design D5b) — one row per tier with each character's effective
 *  multiplier, then the collapsed Untiered row, filtered by name, ownership and alliance (kept in
 *  the URL query). */
function HeroTierList() {
  // `hordeStrategy` loads with the page so opening a tile's Strategy section never suspends.
  const { t, i18n } = useTranslation([
    "legendaryEvents",
    "hordeStrategy",
    "equipmentItems",
  ])
  const isMobile = useIsMobile()
  const units = useLegendaryEventUnits()
  const roster = useLegendaryEventRoster()
  const tiers = useHordeModeTiers()
  const unitName = useUnitName()
  const searchNamesOf = useUnitSearchNames()
  const { captureEvent } = useAnalyticsActions()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseTierListFilters(searchParams)
  const [untieredOpen, setUntieredOpen] = useState(false)
  // The filters key the reader collapsed the auto-opened Untiered row under.
  const [untieredDismissedFor, setUntieredDismissedFor] = useState<string>()
  const [selected, setSelected] = useState<
    { tile: TierTileView; row: TierRef } | undefined
  >()

  const viewed = useRef(false)
  useEffect(() => {
    if (viewed.current) return
    viewed.current = true
    captureEvent({ type: "legendary_event_tier_list_viewed" })
  }, [captureEvent])

  const rosterData = roster.status === "ready" ? roster.data : undefined
  const rosterKnown = rosterData !== undefined
  const nameOf = (unitId: string) => unitName("Character", unitId)
  // Cheap to rebuild, and the unit names resolve asynchronously, so no memo.
  const built: HordeTierList | null | undefined =
    units.status === "ready" && tiers.status === "ready"
      ? buildHordeTierList(
          tiers.data,
          units.data,
          rosterData,
          filters,
          nameOf,
          i18n.language,
          searchNamesOf
        )
      : undefined
  // A `?owned=1` link waits for the roster (loading state) rather than flashing every character.
  const list = isAwaitingOwnedRoster(filters, roster.status) ? undefined : built
  const noMatch = list ? isTierListEmpty(list) : false
  // The rows render unless the list is loading, absent, or replaced by the no-match note.
  const rowsShown = Boolean(list) && (!noMatch || !hasActiveFilters(filters))
  const firstRow = list?.rows.find((row) => row.units.length > 0)
  const filtersKey = tierListFiltersKey(filters)
  const untieredExpanded =
    untieredOpen ||
    (list
      ? shouldAutoExpandUntiered(list, filters) &&
        untieredDismissedFor !== filtersKey
      : false)
  const changeUntieredExpanded = (expanded: boolean) => {
    setUntieredOpen(expanded)
    if (!expanded) setUntieredDismissedFor(filtersKey)
  }

  useTourPageSteps(
    useTierListTutorial({
      hasRow: rowsShown && Boolean(list?.rows.some((row) => row.tier === "S")),
      hasTile: rowsShown && firstRow !== undefined,
      hasFilters: Boolean(built),
    })
  )

  const changeFilters = (patch: Partial<TierListUrlFilters>) =>
    setSearchParams(
      (current) =>
        tierListSearchParams(current, {
          ...parseTierListFilters(current),
          ...patch,
        }),
      { replace: true }
    )
  const openTile = (tile: TierTileView, row: TierRef) => {
    captureEvent({
      type: "legendary_event_tier_list_unit_opened",
      unitId: tile.unitId,
      tier: row?.tier ?? "untiered",
    })
    if (isMobile) setSelected({ tile, row })
  }

  if (units.status === "error" || tiers.status === "error") {
    return (
      <div
        className="flex flex-col items-start gap-3"
        data-testid="tier-list-error"
      >
        <p className="text-sm text-destructive">{t("tierList.error")}</p>
        <Button
          onClick={() => {
            if (units.status === "error") units.retry()
            if (tiers.status === "error") tiers.retry()
          }}
          variant="outline"
        >
          {t("tierList.retry")}
        </Button>
      </div>
    )
  }

  const format = (value: number) => formatMultiplier(value, i18n.language)
  const filterProps = {
    filters,
    rosterKnown,
    rosterLoading: roster.status === "loading",
    onChange: changeFilters,
    isMobile,
  }
  const tile = (
    view: TierTileView,
    row: TierRef,
    first: boolean
  ): ReactNode => (
    <li
      className="min-w-0"
      data-testid={first ? "tier-list-first-tile" : undefined}
      key={view.unitId}
    >
      <TierTile
        isMobile={isMobile}
        muted={view.owned === false}
        name={nameOf(view.unitId)}
        onOpen={() => openTile(view, row)}
        roster={rosterData}
        row={row}
        tile={view}
      />
    </li>
  )

  let content: ReactNode
  if (list === undefined) {
    content = (
      <div className="flex flex-col gap-3" data-testid="tier-list-loading">
        <span className="sr-only">{t("tierList.loading")}</span>
        {["S", "A", "B", "C", "D"].map((key) => (
          <Skeleton className="h-20 w-full rounded-xl" key={key} />
        ))}
      </div>
    )
  } else if (list === null) {
    content = (
      <p
        className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
        data-testid="tier-list-unavailable"
      >
        {t("tierList.unavailable")}
      </p>
    )
  } else if (noMatch && hasActiveFilters(filters)) {
    content = (
      <EmptyState
        actions={
          <Button
            onClick={() => changeFilters(DEFAULT_TIER_LIST_FILTERS)}
            variant="outline"
          >
            {t("tierList.clearFilters")}
          </Button>
        }
        description={t("tierList.noMatch")}
        testId="tier-list-no-match"
        variant="no-match"
      />
    )
  } else {
    content = (
      <div className="flex min-w-0 flex-col gap-3" data-testid="tier-list">
        {list.rows.map((row) => {
          const ref = { tier: row.tier, multiplier: row.multiplier }
          return (
            <TierRow
              isEmpty={row.units.length === 0}
              isMobile={isMobile}
              key={row.tier}
              multiplier={format(row.multiplier)}
              name={row.tier}
              testId={`tier-list-row-${row.tier}`}
              tone={row.tier}
            >
              {row.units.map((view, index) =>
                tile(view, ref, row === firstRow && index === 0)
              )}
            </TierRow>
          )
        })}
        <UntieredRow
          count={list.untiered.length}
          expanded={untieredExpanded}
          isMobile={isMobile}
          multiplier={format(UNTIERED_MULTIPLIER)}
          onExpandedChange={changeUntieredExpanded}
        >
          {list.untiered.map((unit) => tile(unit, null, false))}
        </UntieredRow>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-4" data-testid="tier-list-page">
      {built ? <TierListFilters {...filterProps} /> : null}
      {content}
      {isMobile ? (
        <TierTileDetailsSheet
          details={
            selected
              ? tierTileDetails(selected.tile, selected.row, rosterData)
              : undefined
          }
          name={selected ? nameOf(selected.tile.unitId) : ""}
          onClose={() => setSelected(undefined)}
        />
      ) : null}
    </div>
  )
}
