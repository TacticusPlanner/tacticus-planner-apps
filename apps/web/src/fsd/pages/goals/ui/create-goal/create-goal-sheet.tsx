import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"

import { characterIcon, mowIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"
import { useCreateGoalForm } from "../../model/goal-creation-form/use-create-goal-form"
import type { CreateGoalPrefill } from "../../model/goal-creation-form/create-goal-launcher-context"
import { CreateGoalSheetTourRegistration } from ".//create-goal-sheet.tutorial"
import { UnitGoalFormFields } from ".//unit-goal-form-fields"

type CreateGoalSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful, non-"create another" save so the caller can refresh its list. */
  onCreated: () => void
  prefill?: CreateGoalPrefill
}

/**
 * Goal-creation dialog (bottom sheet below 768px) for the combined multi-goal-type composer (plan §6/§16 phase 5) for a
 * single Character or Mow. One combined combobox infers the unit kind, and the offered goal kinds
 * adapt to it (for example, Rank is never offered for a Mow). Mirrors
 * `manage-account-dialog.tsx`'s controlled-form shape (reset-and-stay-open on
 * "create another", Unit pill only), hosted in a `ResponsiveDialog`.
 */
export function CreateGoalSheet({
  open,
  onOpenChange,
  onCreated,
  prefill,
}: CreateGoalSheetProps) {
  const { t } = useTranslation()
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null
  )
  const form = useCreateGoalForm({ open, onOpenChange, onCreated, prefill })

  const unitIcon = (id: UnitId) =>
    form.charactersById?.has(id) ? characterIcon(id) : mowIcon(id)

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      data-testid="create-goal-sheet"
      contentRef={setPortalContainer}
      preventOutsideClose
    >
      {open ? <CreateGoalSheetTourRegistration /> : null}
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{t("goals.create.title")}</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>

      <ResponsiveDialogBody>
        <UnitGoalFormFields
          form={form}
          portalContainer={portalContainer}
          unitIcon={unitIcon}
        />
      </ResponsiveDialogBody>

      <ResponsiveDialogFooter>
        <div
          className="flex flex-col gap-2 md:mr-auto md:flex-row md:items-center md:gap-5"
          data-testid="create-goal-footer-options"
        >
          <Field
            className="md:w-auto"
            data-testid="create-goal-start-paused"
            orientation="horizontal"
          >
            <Checkbox
              checked={form.startPaused}
              data-testid="create-goal-start-paused-checkbox"
              id="create-goal-start-paused-checkbox"
              onCheckedChange={(checked) =>
                form.setStartPaused(checked === true)
              }
            />
            <FieldLabel
              className="font-normal text-muted-foreground"
              htmlFor="create-goal-start-paused-checkbox"
              title={t("goals.create.startPausedHint")}
            >
              {t("goals.create.startPaused")}
            </FieldLabel>
          </Field>
          <Field className="md:w-auto" orientation="horizontal">
            <Checkbox
              id="create-goal-another"
              checked={form.createAnother}
              onCheckedChange={(checked) =>
                form.setCreateAnother(checked === true)
              }
            />
            <FieldLabel
              className="font-normal text-muted-foreground"
              htmlFor="create-goal-another"
            >
              {t("goals.create.createAnother")}
            </FieldLabel>
          </Field>
        </div>
        <Button
          data-testid="create-goal-close"
          onClick={() => onOpenChange(false)}
          type="button"
          variant="outline"
        >
          {t("goals.create.close")}
        </Button>
        <Button
          data-testid="create-goal-submit"
          disabled={!form.canSubmit || form.status === "submitting"}
          form="create-goal-form"
          type="submit"
        >
          {form.status === "submitting" ? <Spinner /> : null}
          {t("goals.create.submit")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
