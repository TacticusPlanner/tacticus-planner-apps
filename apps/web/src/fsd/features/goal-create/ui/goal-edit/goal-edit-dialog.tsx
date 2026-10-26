import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useBlocker } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { goalQueries } from "@/entities/goal"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { useGoalCatalog } from "@/features/goal-planning/@x/goal-create"
import { GoalEditDialogTourRegistration } from "./goal-edit-dialog.tutorial"
import { GoalEditForm } from "./goal-edit-form"
import { GoalEditUnsavedDialog } from "./goal-edit-unsaved-dialog"

/**
 * The Edit goal dialog (a bottom sheet below 768px): the goal's unit and kind read-only, then only the
 * editable fields, with one Save. Pages own which goal is being edited (`goalId`, `null` when closed).
 * Closing with unsaved changes (Cancel, the close control, Escape) asks to discard first; an outside
 * click never closes it. So does any navigation that would drop the dialog (Back, Forward, a link):
 * it is blocked until the same confirmation resolves, so the page's `?goal=` stays while it asks.
 * Requires a data router.
 */
export function GoalEditDialog({
  goalId,
  onOpenChange,
  onOpenGoal,
}: {
  goalId: string | null
  onOpenChange: (open: boolean) => void
  /** Opens another goal in this dialog — offered when a target edit collides with a sibling goal. */
  onOpenGoal?: (goalId: string) => void
}) {
  // Keyed by goal so every open starts from a fresh draft.
  return goalId ? (
    <GoalEditDialogContent
      goalId={goalId}
      key={goalId}
      onOpenChange={onOpenChange}
      onOpenGoal={onOpenGoal}
    />
  ) : null
}

function GoalEditDialogContent({
  goalId,
  onOpenChange,
  onOpenGoal,
}: {
  goalId: string
  onOpenChange: (open: boolean) => void
  onOpenGoal?: (goalId: string) => void
}) {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const { getEntityName, charactersById } = useGoalCatalog()
  const [dirty, setDirty] = useState(false)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  )
  // Always re-read on open (spec: goal-edit-dialog): the edit must start from the server's revision,
  // whatever the list cached.
  const detailQuery = useQuery({
    ...goalQueries.detail(goalId),
    enabled: isAuthenticated,
    staleTime: 0,
  })
  const detail = detailQuery.data

  // Unlock/Ascension seed their source picker from the character catalog, so wait for it.
  const needsCatalog =
    detail?.entityType === "Character" &&
    (detail.goalType === "Unlock" || detail.goalType === "Ascension")
  const ready = !!detail && (!needsCatalog || charactersById !== undefined)

  // Set once this dialog closes itself, so the page's own close navigation is never blocked.
  const closing = useRef(false)
  const close = () => {
    closing.current = true
    onOpenChange(false)
  }
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !closing.current &&
      (currentLocation.pathname !== nextLocation.pathname ||
        new URLSearchParams(nextLocation.search).get("goal") !== goalId)
  )
  const blocked = blocker.state === "blocked"

  const requestClose = () => {
    if (dirty) setConfirmingDiscard(true)
    else close()
  }

  return (
    <>
      <ResponsiveDialog
        contentRef={setPortalContainer}
        data-testid="goal-edit-dialog"
        onOpenChange={(open) => {
          if (!open) requestClose()
        }}
        open
        preventOutsideClose
      >
        {detail ? <GoalEditDialogTourRegistration /> : null}
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("goals.edit.title")}</ResponsiveDialogTitle>
          {detail ? (
            <p
              className="text-sm text-muted-foreground"
              data-testid="goal-edit-unit"
            >
              {getEntityName(detail.entityType, detail.entityId)}
              {" · "}
              <span data-testid="goal-edit-kind">
                {t(`goals.create.goalTypes.${detail.goalType}`)}
              </span>
            </p>
          ) : null}
        </ResponsiveDialogHeader>

        {detail && ready ? (
          <GoalEditForm
            detail={detail}
            onDirtyChange={setDirty}
            onOpenGoal={onOpenGoal}
            onRequestClose={requestClose}
            onSaved={close}
            portalContainer={portalContainer}
          />
        ) : (
          <>
            <ResponsiveDialogBody>
              {detailQuery.isError ? (
                <p
                  className="pb-6 text-sm text-destructive"
                  data-testid="goal-edit-load-error"
                  role="alert"
                >
                  {t("goals.edit.loadError")}
                </p>
              ) : (
                <div
                  className="grid gap-4 pb-6"
                  data-testid="goal-edit-skeleton"
                >
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
              <Button
                data-testid="goal-edit-cancel"
                onClick={close}
                variant="outline"
              >
                {t("goals.edit.close")}
              </Button>
            </ResponsiveDialogFooter>
          </>
        )}
      </ResponsiveDialog>

      <GoalEditUnsavedDialog
        onCancel={() => {
          setConfirmingDiscard(false)
          blocker.reset?.()
        }}
        onConfirm={() => {
          setConfirmingDiscard(false)
          if (blocked) {
            closing.current = true
            blocker.proceed?.()
          } else close()
        }}
        open={confirmingDiscard || blocked}
      />
    </>
  )
}
