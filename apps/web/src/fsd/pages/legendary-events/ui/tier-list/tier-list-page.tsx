import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"
import { ChevronDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import {
  UNTIERED_MULTIPLIER,
  buildHordeTierList,
  useHordeModeTiers,
  useLegendaryEventRoster,
  useLegendaryEventUnits,
  type HordeTierList,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"
import { useTourPageSteps } from "@/shared/tour"
import { useUnitName } from "@/shared/unit-name"

import { TierListFiltersBar, TierListFiltersRow } from "./tier-list-filters"
import { useTierListTutorial } from "./tier-list.tutorial"
import {
  DEFAULT_TIER_LIST_FILTERS,
  formatMultiplier,
  hasActiveFilters,
  isTierListEmpty,
  parseTierListFilters,
  tierListSearchParams,
  tierTileDetails,
  type TierListUrlFilters,
} from "./tier-list.view-model"
import { TierRow, UntieredRow } from "./tier-row"
import { TierTile, type TierTileView } from "./tier-tile"
import { TierTileDetailsSheet } from "./tier-tile-details"

type TierRef = { tier: string; multiplier: number } | null

/** `/legendary-events/tier-list`: the catalog horde-mode tier list (design D5b) — one row per tier
 *  with each character's effective multiplier, then the collapsed Untiered row, filtered by name,
 *  ownership and alliance (kept in the URL query). */
export function TierListPage() {
  const { t, i18n } = useTranslation("legendaryEvents")
  const isMobile = useIsMobile()
  const units = useLegendaryEventUnits()
  const roster = useLegendaryEventRoster()
  const tiers = useHordeModeTiers()
  const unitName = useUnitName()
  const { captureEvent } = useAnalyticsActions()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseTierListFilters(searchParams)
  const [untieredOpen, setUntieredOpen] = useState(false)
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
  const list: HordeTierList | null | undefined =
    units.status === "ready" && tiers.status === "ready"
      ? buildHordeTierList(
          tiers.data,
          units.data,
          rosterData,
          filters,
          nameOf,
          i18n.language
        )
      : undefined
  const noMatch = list ? isTierListEmpty(list) : false
  const firstRow = list?.rows.find((row) => row.units.length > 0)

  useTourPageSteps(
    useTierListTutorial({
      hasRow: list?.rows.some((row) => row.tier === "S") ?? false,
      hasTile: !noMatch && firstRow !== undefined,
      hasFilters: Boolean(list),
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
        {["S", "A", "B", "C"].map((key) => (
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
      <div
        className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-4"
        data-testid="tier-list-no-match"
      >
        <p className="text-sm text-muted-foreground">{t("tierList.noMatch")}</p>
        <Button
          onClick={() => changeFilters(DEFAULT_TIER_LIST_FILTERS)}
          variant="outline"
        >
          {t("tierList.clearFilters")}
        </Button>
      </div>
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
          expanded={untieredOpen}
          isMobile={isMobile}
          multiplier={format(UNTIERED_MULTIPLIER)}
          onExpandedChange={setUntieredOpen}
        >
          {list.untiered.map((unit) =>
            tile(
              {
                ...unit,
                multiplier: UNTIERED_MULTIPLIER,
                overridden: false,
              },
              null,
              false
            )
          )}
        </UntieredRow>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-4" data-testid="tier-list-page">
      <TierListExplainer />
      {list ? (
        isMobile ? (
          <TierListFiltersBar {...filterProps} />
        ) : (
          <TierListFiltersRow {...filterProps} />
        )
      ) : null}
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

/** The page intro and its "What this means" disclosure. */
function TierListExplainer() {
  const { t } = useTranslation("legendaryEvents")
  const [open, setOpen] = useState(false)
  const contentId = useId()
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-muted-foreground">{t("tierList.intro")}</p>
      <button
        aria-controls={open ? contentId : undefined}
        aria-expanded={open}
        className="flex min-h-11 w-fit items-center gap-1 text-sm font-medium text-primary md:min-h-0"
        data-testid="tier-list-explainer-toggle"
        onClick={() => setOpen(!open)}
        type="button"
      >
        {t("tierList.whatThisMeans")}
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="tier-list-explainer"
          id={contentId}
        >
          {t("tierList.explainer")}
        </p>
      ) : null}
    </div>
  )
}
