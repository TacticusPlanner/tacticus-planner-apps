import { useState } from "react"
import { useTranslation } from "react-i18next"
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

import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { GoalEditDialogTourRegistration } from "./goal-edit-dialog.tutorial"
import { GoalEditForm } from "./goal-edit-form"
import { GoalEditUnsavedDialog } from "./goal-edit-unsaved-dialog"

/**
 * The Edit goal dialog (a bottom sheet below 768px): the goal's unit and kind read-only, then only the
 * editable fields, with one Save. Pages own which goal is being edited (`goalId`, `null` when closed).
 * Closing with unsaved changes (Cancel, the close control, Escape) asks to discard first; an outside
 * click never closes it.
 */
export function GoalEditDialog({
  goalId,
  onOpenChange,
}: {
  goalId: string | null
  onOpenChange: (open: boolean) => void
}) {
  // Keyed by goal so every open starts from a fresh draft.
  return goalId ? (
    <GoalEditDialogContent
      goalId={goalId}
      key={goalId}
      onOpenChange={onOpenChange}
    />
  ) : null
}

function GoalEditDialogContent({
  goalId,
  onOpenChange,
}: {
  goalId: string
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const { getEntityName, charactersById } = useGoalCatalog()
  const [dirty, setDirty] = useState(false)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  )
  const detailQuery = useQuery({
    ...goalQueries.detail(goalId),
    enabled: isAuthenticated,
  })
  const detail = detailQuery.data

  // Unlock/Ascension seed their source picker from the character catalog, so wait for it.
  const needsCatalog =
    detail?.entityType === "Character" &&
    (detail.goalType === "Unlock" || detail.goalType === "Ascension")
  const ready = !!detail && (!needsCatalog || charactersById !== undefined)

  const requestClose = () => {
    if (dirty) setConfirmingDiscard(true)
    else onOpenChange(false)
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
            onRequestClose={requestClose}
            onSaved={() => onOpenChange(false)}
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
                onClick={() => onOpenChange(false)}
                variant="outline"
              >
                {t("goals.edit.close")}
              </Button>
            </ResponsiveDialogFooter>
          </>
        )}
      </ResponsiveDialog>

      <GoalEditUnsavedDialog
        onCancel={() => setConfirmingDiscard(false)}
        onConfirm={() => {
          setConfirmingDiscard(false)
          onOpenChange(false)
        }}
        open={confirmingDiscard}
      />
    </>
  )
}
