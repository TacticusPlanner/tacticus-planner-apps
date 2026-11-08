import { useMemo, useState } from "react"
import { useIsAuthenticated } from "@azure/msal-react"
import {
  AlertTriangle,
  Eye,
  EyeOff,
  History,
  LogIn,
  RefreshCw,
  SearchX,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  unitLibraryPath,
  unitOriginState,
  UnitTile,
  type UnitKind,
  type UnitTileUnit,
} from "@/entities/unit"
import {
  formatRosterSourceId,
  useRosterSnapshots,
} from "@/entities/roster-snapshot"
import { usePlayerDataSyncStatus } from "@/features/player-data-sync"
import { useSignInRedirect } from "@/shared/auth"
import { useTourPageSteps } from "@/shared/tour"

import type {
  CollectionFactionGroup,
  CollectionListedUnit,
  CollectionRosterState,
} from "../../model/collection-view"
import {
  useCollectionOptions,
  type CollectionOptions,
} from "../../model/use-collection-options"
import { useCollectionQuery } from "../../model/use-collection-query"
import { useCollectionView } from "../../model/use-collection-view"
import { COMPARE_CURRENT } from "../../model/compare-query"
import { useCollectionCompare } from "../../model/use-collection-compare"
import { useCompareQuery } from "../../model/use-compare-query"
import { useCollectionTutorial } from "./collection.tutorial"
import { CollectionRoster, CollectionRosterList } from "./collection-roster"
import { CollectionToolbar } from "./collection-toolbar"
import { SnapshotActions } from "./compare/compare-bar"
import { CompareSection } from "./compare/compare-section"
import { ManageSnapshotsSheet } from "./compare/manage-snapshots-sheet"
import { TakeSnapshotDialog } from "./compare/take-snapshot-dialog"
import { FactionHeader } from "./faction-header"

// Before the catalog is read the toolbar is hidden anyway; this only keeps its props total.
const EMPTY_OPTIONS: CollectionOptions = {
  factions: [],
  hits: [],
  movements: [],
  ranges: [],
  damageTypes: [],
  traits: [],
  shardSources: [],
}

// Equal-width faction cards that add a column as the window widens; rows stretch so cards in a row
// share one height. Inside a card, fixed unit slots (5 on mobile, 7 on desktop) line portraits up
// across cards - no current faction has more than seven units, so each fits one desktop row.
const factionGrid =
  "grid items-stretch gap-2.5 sm:gap-3 grid-cols-[repeat(auto-fill,minmax(min(30rem,100%),1fr))]"
const unitSlots =
  "grid grid-cols-5 gap-x-1.5 gap-y-3 px-2 pt-3 pb-2.5 md:grid-cols-7"
// Without faction groups: one card of slots about as wide as a faction card's.
const ungroupedSlots =
  "grid gap-x-1.5 gap-y-3 rounded-lg border bg-card px-2 pt-3 pb-2.5 [grid-template-columns:repeat(auto-fill,minmax(4.25rem,1fr))]"

/**
 * My Game's Collection: every catalog unit grouped by faction, owned units with their synced
 * progression and the rest greyed out. Without a roster (signed out, not synced yet, or unreadable)
 * the whole catalog shows greyed out under a prompt explaining how to see it. A toolbar searches,
 * sorts and filters the list, switches between the Cards and Roster views and can list every unit
 * across factions instead of by faction; its state lives in the URL. Laid out per the design handoff (tacticus-planner-docs/ux/wireframes/collection-handoff.md).
 */
export function CollectionPage() {
  const { t } = useTranslation("common")
  const options = useCollectionOptions()
  const { query, update, clear } = useCollectionQuery(options)
  const isAuthenticated = useIsAuthenticated()
  const compareQuery = useCompareQuery()
  const { state: compare, toRoster } = useCollectionCompare(compareQuery)
  const snapshots = useRosterSnapshots(isAuthenticated)
  const [takeOpen, setTakeOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const comparing = compare.mode !== "off" && compare.mode !== "guest"
  // Compare's non-gain orders are Collection sorts on the "to" state, so they sort the list.
  const compareOrder = compareQuery.query.order
  const viewQuery = useMemo(
    () =>
      comparing && compareOrder !== "gain"
        ? { ...query, sort: compareOrder }
        : query,
    [comparing, compareOrder, query]
  )
  const state = useCollectionView(viewQuery, toRoster)
  // Compare mode replaces the list, so the list's tour steps are off while it is on.
  const listing = !comparing && state.status === "ready"
  const hasGroups = listing && state.view.groups.length > 0
  // Shown even when Hide unowned hides every unit: the counts still include them.
  const hasSummary =
    listing && state.view.rosterState === "available" && state.view.total > 0
  const hasOwned = listing && state.view.owned > 0
  // What is listed, not what is counted: Hide unowned keeps unowned units in the counts.
  const hasUnowned =
    listing &&
    state.view.units.some((entry) => entry.unit.data.state !== "owned")
  const applied = state.status === "ready" ? state.view.query : query
  const grouped = applied.group === "faction"
  useTourPageSteps(
    useCollectionTutorial({
      view: applied.view,
      grouped,
      hasSummary,
      hasGroups,
      hasOwned,
      hasUnowned,
      hasSnapshotActions: isAuthenticated,
      compareReady: compare.mode === "ready",
    })
  )
  const view = state.status === "ready" ? state.view : undefined
  // The order the page shows: faction group by faction group, or the one ungrouped list.
  const origins = useMemo(
    () =>
      collectionOrigins(
        !view
          ? []
          : grouped
            ? view.groups.flatMap((group) => group.units)
            : view.units.map((entry) => entry.unit)
      ),
    [view, grouped]
  )
  // Compare lists every unit in one list, in the sort's order without faction grouping.
  const compareUnits = useMemo(
    () => view?.units.map((entry) => entry.unit) ?? [],
    [view]
  )
  const usage = snapshots.data
    ? { count: snapshots.data.count, limit: snapshots.data.limit }
    : null

  if (state.status === "loading") {
    return <CollectionSkeleton />
  }

  if (state.status === "catalogError") {
    return (
      <Alert variant="destructive" data-testid="collection-catalog-error">
        <AlertTriangle />
        <AlertTitle>{t("myGame.collection.catalogErrorTitle")}</AlertTitle>
        <AlertDescription>
          <p>{t("myGame.collection.catalogErrorBody")}</p>
          <Button variant="outline" size="sm" onClick={state.retry}>
            {t("myGame.collection.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const { quickFilters, retry } = state
  const listed = state.view
  const rosterAvailable = listed.rosterState === "available"

  return (
    <div className="space-y-6" data-testid="collection-page">
      {listed.rosterState === "available" ? null : (
        <RosterPrompt rosterState={listed.rosterState} onRetry={retry} />
      )}
      <CollectionToolbar
        // The applied query: a value the page cannot apply yet (no roster, or a quick filter whose
        // data is missing) stays in the URL for later but is not shown as selected.
        query={listed.query}
        update={update}
        clear={clear}
        options={options ?? EMPTY_OPTIONS}
        rosterAvailable={rosterAvailable}
        quickFilters={quickFilters}
        onRetry={retry}
      />
      {isAuthenticated ? (
        <SnapshotActions
          compareOn={comparing}
          onCompareChange={compareQuery.setEnabled}
          usage={usage}
          onTake={() => setTakeOpen(true)}
          onManage={() => setManageOpen(true)}
        />
      ) : (
        <SnapshotsSignInPrompt />
      )}
      {comparing ? (
        <CompareSection
          state={compare}
          compare={compareQuery}
          units={compareUnits}
          filtered={listed.filtered}
          onTake={() => setTakeOpen(true)}
        />
      ) : null}
      {!comparing && rosterAvailable && listed.total > 0 ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="collection-summary"
        >
          {t(
            listed.filtered
              ? "myGame.collection.summaryFiltered"
              : "myGame.collection.summary",
            { owned: listed.owned, total: listed.total }
          )}
        </p>
      ) : null}
      {comparing || listed.groups.length === 0 ? null : !grouped ? (
        listed.query.view === "roster" ? (
          <CollectionRosterList units={listed.units} origins={origins} />
        ) : (
          <UngroupedCards units={listed.units} origins={origins} />
        )
      ) : listed.query.view === "roster" ? (
        <CollectionRoster
          groups={listed.groups}
          showOwned={rosterAvailable}
          origins={origins}
        />
      ) : (
        <div className={factionGrid}>
          {listed.groups.map((group) => (
            <FactionGroupCard
              key={group.factionId}
              group={group}
              showOwned={rosterAvailable}
              origins={origins}
            />
          ))}
        </div>
      )}
      {comparing || listed.groups.length > 0 ? null : listed.total > 0 ? (
        <AllHidden
          filtered={listed.filtered}
          onClear={clear}
          onShowUnowned={() => update({ hideUnowned: false })}
        />
      ) : (
        <NoMatches onClear={clear} />
      )}
      {isAuthenticated ? (
        <>
          <TakeSnapshotDialog
            open={takeOpen}
            onOpenChange={setTakeOpen}
            count={usage?.count ?? 0}
            limit={usage?.limit ?? 0}
            onCompare={(snapshot) =>
              compareQuery.update({
                compare: formatRosterSourceId({
                  kind: "snapshot",
                  snapshotId: snapshot.id,
                }),
                to: COMPARE_CURRENT,
              })
            }
          />
          <ManageSnapshotsSheet
            open={manageOpen}
            onOpenChange={setManageOpen}
            list={snapshots.data}
          />
        </>
      ) : null}
    </div>
  )
}

/** Shown to guests in place of Compare and Take snapshot (snapshots live in the account). */
function SnapshotsSignInPrompt() {
  const { t } = useTranslation("common")
  return (
    <p
      className="flex items-center gap-2 text-sm text-muted-foreground"
      data-testid="snapshots-sign-in-prompt"
    >
      <History aria-hidden className="size-4 shrink-0" />
      {t("myGame.collection.snapshots.signIn")}
    </p>
  )
}

/** Shown instead of a blank area when the search and filters match no unit. */
function NoMatches({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation("common")

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center"
      role="status"
      data-testid="collection-empty"
    >
      <SearchX aria-hidden className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <p className="font-semibold">{t("myGame.collection.empty.title")}</p>
        <p className="text-sm text-muted-foreground">
          {t("myGame.collection.empty.body")}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onClear}>
        <X aria-hidden />
        {t("myGame.collection.toolbar.clearFilters")}
      </Button>
    </div>
  )
}

/** Shown when units match but Hide unowned hides all of them, so turning it off is the way out. */
function AllHidden({
  filtered,
  onClear,
  onShowUnowned,
}: {
  filtered: boolean
  onClear: () => void
  onShowUnowned: () => void
}) {
  const { t } = useTranslation("common")

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center"
      role="status"
      data-testid="collection-all-hidden"
    >
      <EyeOff aria-hidden className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <p className="font-semibold">
          {t("myGame.collection.empty.hiddenTitle")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("myGame.collection.empty.hiddenBody")}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" onClick={onShowUnowned}>
          <Eye aria-hidden />
          {t("myGame.collection.empty.showUnowned")}
        </Button>
        {filtered ? (
          <Button variant="outline" size="sm" onClick={onClear}>
            <X aria-hidden />
            {t("myGame.collection.toolbar.clearFilters")}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

/**
 * The history state each tile hands its unit page: Collection's order of the units of that kind, so
 * the page's prev/next walk Collection without stepping a character page onto a Machine of War.
 */
function collectionOrigins(
  units: readonly UnitTileUnit[]
): Record<UnitKind, unknown> {
  const ids = (kind: UnitKind) =>
    units.filter((unit) => unit.kind === kind).map((unit) => unit.unitId)
  return {
    character: unitOriginState({ kind: "collection", ids: ids("character") }),
    mow: unitOriginState({ kind: "collection", ids: ids("mow") }),
  }
}

/** The Cards view without faction groups: one grid of tiles, each showing its faction. */
function UngroupedCards({
  units,
  origins,
}: {
  units: readonly CollectionListedUnit[]
  origins: Record<UnitKind, unknown>
}) {
  return (
    <ul className={ungroupedSlots} data-testid="collection-ungrouped">
      {units.map(({ unit, factionId, factionName }) => (
        <li key={`${unit.kind}:${unit.unitId}`} className="min-w-0">
          <UnitTile
            unit={unit}
            faction={{ id: factionId, name: factionName }}
            link={{
              to: unitLibraryPath(unit.kind, unit.unitId),
              state: origins[unit.kind],
            }}
            testId={
              unit.data.state === "owned"
                ? "collection-owned-tile"
                : "collection-unowned-tile"
            }
          />
        </li>
      ))}
    </ul>
  )
}

function FactionGroupCard({
  group,
  showOwned,
  origins,
}: {
  group: CollectionFactionGroup
  showOwned: boolean
  origins: Record<UnitKind, unknown>
}) {
  return (
    <section
      aria-label={group.factionName}
      className="flex flex-col overflow-hidden rounded-lg border bg-card"
      data-testid="collection-faction-group"
      data-faction={group.factionId}
    >
      <FactionHeader group={group} showOwned={showOwned} />
      <ul className={unitSlots}>
        {group.units.map((unit) => (
          <li key={unit.unitId} className="min-w-0">
            <UnitTile
              unit={unit}
              link={{
                to: unitLibraryPath(unit.kind, unit.unitId),
                state: origins[unit.kind],
              }}
              testId={
                unit.data.state === "owned"
                  ? "collection-owned-tile"
                  : "collection-unowned-tile"
              }
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Placeholder faction cards while the catalog loads; static under reduced motion. */
function CollectionSkeleton() {
  const { t } = useTranslation("common")

  return (
    <div className="space-y-6" data-testid="collection-loading">
      <p className="sr-only" role="status">
        {t("myGame.collection.loading")}
      </p>
      <div className={factionGrid} aria-busy="true">
        {Array.from({ length: 6 }, (_, card) => (
          <div key={card} className="overflow-hidden rounded-lg border bg-card">
            <Skeleton className="h-7.5 rounded-none motion-reduce:animate-none" />
            <div className={unitSlots}>
              {Array.from({ length: 5 }, (_, slot) => (
                <div key={slot} className="flex flex-col items-center gap-2">
                  <Skeleton className="aspect-square w-full max-w-18 rounded-full motion-reduce:animate-none" />
                  <Skeleton className="h-3 w-4/5 rounded-sm motion-reduce:animate-none" />
                  <Skeleton className="h-5 w-full rounded-sm motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RosterPrompt({
  rosterState,
  onRetry,
}: {
  rosterState: Exclude<CollectionRosterState, "available">
  onRetry: () => void
}) {
  const { t } = useTranslation(["common", "landing"])

  if (rosterState === "anonymous") {
    return (
      <Alert
        className="border-ring bg-info-bg"
        data-testid="collection-sign-in-prompt"
      >
        <LogIn />
        <AlertTitle>{t("myGame.collection.signInTitle")}</AlertTitle>
        <AlertDescription>
          <p>{t("myGame.collection.signInBody")}</p>
          <SignInButton />
        </AlertDescription>
      </Alert>
    )
  }

  if (rosterState === "notSynced") {
    return (
      <Alert
        className="border-ring bg-info-bg"
        data-testid="collection-sync-prompt"
      >
        <RefreshCw />
        <AlertTitle>{t("myGame.collection.syncTitle")}</AlertTitle>
        <AlertDescription>
          <p>{t("myGame.collection.syncBody")}</p>
          <SyncButton />
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" data-testid="collection-roster-error">
      <AlertTriangle />
      <AlertTitle>{t("myGame.collection.rosterErrorTitle")}</AlertTitle>
      <AlertDescription>
        <p>{t("myGame.collection.rosterErrorBody")}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("myGame.collection.retry")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function SignInButton() {
  const { t } = useTranslation("common")
  const { checkingSignIn, disabled, signIn } = useSignInRedirect()

  return (
    <Button
      data-testid="collection-sign-in"
      disabled={disabled}
      onClick={signIn}
      size="sm"
    >
      {checkingSignIn
        ? t("auth.checkingSignIn")
        : t("myGame.collection.signIn")}
    </Button>
  )
}

function SyncButton() {
  const { t } = useTranslation("common")
  const { isSyncing, statusText, syncDisabled, syncNow } =
    usePlayerDataSyncStatus()

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="sm"
        onClick={() => void syncNow()}
        disabled={syncDisabled}
        data-testid="collection-sync"
      >
        <RefreshCw
          aria-hidden="true"
          className={isSyncing ? "motion-safe:animate-spin" : undefined}
        />
        {t("nav.syncWithTacticus")}
      </Button>
      <span className="text-xs text-muted-foreground" role="status">
        {statusText}
      </span>
    </div>
  )
}
