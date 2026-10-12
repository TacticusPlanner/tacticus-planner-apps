import { AlertTriangle, LogIn, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AuthError } from "@azure/msal-browser"
import { useMsal } from "@azure/msal-react"
import { factionIcon } from "@workspace/game-catalog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { UnitTile } from "@/entities/unit"
import { usePlayerDataSyncStatus } from "@/features/player-data-sync"
import { loginRequest } from "@/shared/auth"
import { useTourPageSteps } from "@/shared/tour"
import { EntityIcon } from "@/shared/ui"

import type {
  CollectionFactionGroup,
  CollectionRosterState,
} from "../../model/collection-view"
import { useCollectionView } from "../../model/use-collection-view"
import { useCollectionTutorial } from "./collection.tutorial"

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
 * the whole catalog shows greyed out under a prompt explaining how to see it. Laid out per the
 * Cards view of the design handoff (tacticus-planner-docs/ux/wireframes/collection-handoff.md).
 */
export function CollectionPage() {
  const { t } = useTranslation("common")
  const state = useCollectionView()
  const hasSummary =
    state.status === "ready" && state.view.rosterState === "available"
  const hasOwned = state.status === "ready" && state.view.owned > 0
  const hasUnowned =
    state.status === "ready" && state.view.owned < state.view.total
  useTourPageSteps(useCollectionTutorial({ hasSummary, hasOwned, hasUnowned }))

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

  const { view, retry } = state

  return (
    <div className="space-y-6" data-testid="collection-page">
      {view.rosterState === "available" ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="collection-summary"
        >
          {t("myGame.collection.summary", {
            owned: view.owned,
            total: view.total,
          })}
        </p>
      ) : (
        <RosterPrompt rosterState={view.rosterState} onRetry={retry} />
      )}
      <div className={factionGrid}>
        {view.groups.map((group) => (
          <FactionGroupCard
            key={group.factionId}
            group={group}
            showOwned={view.rosterState === "available"}
          />
        ))}
      </div>
    </div>
  )
}

function FactionGroupCard({
  group,
  showOwned,
}: {
  group: CollectionFactionGroup
  showOwned: boolean
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
  const { t } = useTranslation(["common", "landing"])
  const { instance } = useMsal()

  const signIn = () => {
    void instance.loginRedirect(loginRequest).catch((error: unknown) => {
      console.error(
        "[MSAL] sign-in failed",
        error instanceof AuthError
          ? { errorCode: error.errorCode, message: error.message }
          : error
      )
      toast.error(t("landing:authError"))
    })
  }

  return (
    <Button size="sm" onClick={signIn} data-testid="collection-sign-in">
      {t("myGame.collection.signIn")}
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
      <span className="text-xs text-muted-foreground" aria-live="polite">
        {statusText}
      </span>
    </div>
  )
}
