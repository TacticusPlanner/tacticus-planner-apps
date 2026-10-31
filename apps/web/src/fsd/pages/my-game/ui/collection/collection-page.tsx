import { useMemo } from "react"
import { AlertTriangle, LogIn, RefreshCw, SearchX, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { factionIcon } from "@workspace/game-catalog"
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
} from "@/entities/unit"
import { usePlayerDataSyncStatus } from "@/features/player-data-sync"
import { useSignInRedirect } from "@/shared/auth"
import { useTourPageSteps } from "@/shared/tour"
import { EntityIcon } from "@/shared/ui"

import type {
  CollectionFactionGroup,
  CollectionRosterState,
} from "../../model/collection-view"
import {
  useCollectionOptions,
  type CollectionOptions,
} from "../../model/use-collection-options"
import { useCollectionQuery } from "../../model/use-collection-query"
import { useCollectionView } from "../../model/use-collection-view"
import { useCollectionTutorial } from "./collection.tutorial"
import { CollectionToolbar } from "./collection-toolbar"

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
  "grid items-stretch gap-2.5 sm:gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(30rem,100%),1fr))]"
const unitSlots =
  "grid grid-cols-5 gap-x-1.5 gap-y-3 px-2 pt-3 pb-2.5 md:grid-cols-7"

/**
 * My Game's Collection: every catalog unit grouped by faction, owned units with their synced
 * progression and the rest greyed out. Without a roster (signed out, not synced yet, or unreadable)
 * the whole catalog shows greyed out under a prompt explaining how to see it. A toolbar searches,
 * sorts and filters the list; its state lives in the URL. Laid out per the Cards view of the
 * design handoff (tacticus-planner-docs/ux/wireframes/collection-handoff.md).
 */
export function CollectionPage() {
  const { t } = useTranslation("common")
  const options = useCollectionOptions()
  const { query, update, clear } = useCollectionQuery(options)
  const state = useCollectionView(query)
  const hasGroups = state.status === "ready" && state.view.groups.length > 0
  const hasSummary = hasGroups && state.view.rosterState === "available"
  const hasOwned = state.status === "ready" && state.view.owned > 0
  const hasUnowned =
    state.status === "ready" && state.view.owned < state.view.total
  useTourPageSteps(
    useCollectionTutorial({ hasSummary, hasGroups, hasOwned, hasUnowned })
  )
  const groups = state.status === "ready" ? state.view.groups : undefined
  const origins = useMemo(() => collectionOrigins(groups ?? []), [groups])

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

  const { view, quickFilters, retry } = state
  const rosterAvailable = view.rosterState === "available"

  return (
    <div className="space-y-6" data-testid="collection-page">
      {view.rosterState === "available" ? null : (
        <RosterPrompt rosterState={view.rosterState} onRetry={retry} />
      )}
      <CollectionToolbar
        // The applied query: a value the page cannot apply yet (no roster, or a quick filter whose
        // data is missing) stays in the URL for later but is not shown as selected.
        query={view.query}
        update={update}
        clear={clear}
        options={options ?? EMPTY_OPTIONS}
        rosterAvailable={rosterAvailable}
        quickFilters={quickFilters}
        onRetry={retry}
      />
      {rosterAvailable && view.groups.length > 0 ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="collection-summary"
        >
          {t(
            view.filtered
              ? "myGame.collection.summaryFiltered"
              : "myGame.collection.summary",
            { owned: view.owned, total: view.total }
          )}
        </p>
      ) : null}
      {view.groups.length > 0 ? (
        <div className={factionGrid}>
          {view.groups.map((group) => (
            <FactionGroupCard
              key={group.factionId}
              group={group}
              showOwned={rosterAvailable}
              origins={origins}
            />
          ))}
        </div>
      ) : (
        <NoMatches onClear={clear} />
      )}
    </div>
  )
}

/** Shown instead of a blank area when the search and filters match no unit. */
function NoMatches({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation("common")

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed px-4 py-10 text-center"
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

/**
 * The history state each tile hands its unit page: Collection's order of the units of that kind, so
 * the page's prev/next walk Collection without stepping a character page onto a Machine of War.
 */
function collectionOrigins(
  groups: readonly CollectionFactionGroup[]
): Record<UnitKind, unknown> {
  const ids = (kind: UnitKind) =>
    groups.flatMap((group) =>
      group.units
        .filter((unit) => unit.kind === kind)
        .map((unit) => unit.unitId)
    )
  return {
    character: unitOriginState({ kind: "collection", ids: ids("character") }),
    mow: unitOriginState({ kind: "collection", ids: ids("mow") }),
  }
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
  const { t } = useTranslation("common")
  const total = group.units.length

  return (
    <section
      aria-label={group.factionName}
      className="flex flex-col overflow-hidden rounded-[10px] border bg-card"
      data-testid="collection-faction-group"
      data-faction={group.factionId}
    >
      <header
        className="flex h-[30px] shrink-0 items-center gap-2 px-2.5 text-overlay-foreground"
        style={{
          background: `var(--faction-${group.factionId}, var(--muted-foreground))`,
        }}
        data-testid="collection-faction-header"
      >
        <EntityIcon
          src={factionIcon(group.factionId)}
          alt=""
          className="size-[22px] shrink-0"
        />
        <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold tracking-[0.06em] uppercase">
          {group.factionName}
        </h2>
        {showOwned ? (
          <span
            className="shrink-0 text-[13px] font-semibold tabular-nums"
            aria-label={t("myGame.collection.factionOwned", {
              owned: group.owned,
              total,
            })}
            data-testid="collection-faction-owned"
          >
            {group.owned}/{total}
          </span>
        ) : null}
      </header>
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
          <div
            key={card}
            className="overflow-hidden rounded-[10px] border bg-card"
          >
            <Skeleton className="h-[30px] rounded-none motion-reduce:animate-none" />
            <div className={unitSlots}>
              {Array.from({ length: 5 }, (_, slot) => (
                <div key={slot} className="flex flex-col items-center gap-2">
                  <Skeleton className="aspect-square w-full max-w-18 rounded-full motion-reduce:animate-none" />
                  <Skeleton className="h-3 w-4/5 rounded motion-reduce:animate-none" />
                  <Skeleton className="h-5 w-full rounded motion-reduce:animate-none" />
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
  const { isSyncing, statusText, syncNow } = usePlayerDataSyncStatus()

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="sm"
        onClick={() => void syncNow()}
        disabled={isSyncing}
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
