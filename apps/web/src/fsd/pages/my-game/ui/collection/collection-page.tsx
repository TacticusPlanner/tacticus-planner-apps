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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

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

/**
 * My Game's Collection: every catalog unit grouped by faction, owned units with their synced
 * progression and the rest greyed out. Without a roster (signed out, not synced yet, or unreadable)
 * the whole catalog shows greyed out under a prompt explaining how to see it.
 */
export function CollectionPage() {
  const { t } = useTranslation("common")
  const state = useCollectionView()
  const hasSummary =
    state.status === "ready" && state.view.rosterState === "available"
  const hasOwned = state.status === "ready" && state.view.owned > 0
  useTourPageSteps(useCollectionTutorial({ hasSummary, hasOwned }))

  if (state.status === "loading") {
    return (
      <div
        className="flex items-center justify-center gap-2 py-16 text-muted-foreground"
        data-testid="collection-loading"
      >
        <Spinner />
        {t("myGame.collection.loading")}
      </div>
    )
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
      <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {view.groups.map((group) => (
          <FactionGroupCard key={group.factionId} group={group} />
        ))}
      </div>
    </div>
  )
}

function FactionGroupCard({ group }: { group: CollectionFactionGroup }) {
  return (
    <Card
      className="gap-3 py-4"
      data-testid="collection-faction-group"
      data-faction={group.factionId}
    >
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <EntityIcon
            src={factionIcon(group.factionId)}
            alt=""
            className="size-6"
          />
          <h2>{group.factionName}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1 px-3">
        {group.units.map((unit) => (
          <UnitTile
            key={unit.unitId}
            unit={unit}
            testId={
              unit.data.state === "owned"
                ? "collection-owned-tile"
                : "collection-unowned-tile"
            }
          />
        ))}
      </CardContent>
    </Card>
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
      <Alert data-testid="collection-sign-in-prompt">
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
      <Alert data-testid="collection-sync-prompt">
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
