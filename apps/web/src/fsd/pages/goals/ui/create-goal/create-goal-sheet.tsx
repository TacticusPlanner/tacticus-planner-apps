import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Spinner } from "@workspace/ui/components/spinner"

import { characterIcon, mowIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import { useCreateGoalForm } from "../../model/goal-creation-form/use-create-goal-form"
import type { CreateGoalPrefill } from "../../model/goal-creation-form/create-goal-launcher-context"
import { UnitGoalFormFields } from ".//unit-goal-form-fields"

type CreateGoalSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful, non-"create another" save so the caller can refresh its list. */
  onCreated: () => void
  prefill?: CreateGoalPrefill
}

/**
 * Goal-creation side panel for the combined multi-goal-type composer (plan §6/§16 phase 5) for a
 * single Character or Mow. One combined combobox infers the unit kind, and the offered goal kinds
 * adapt to it (for example, Rank is never offered for a Mow). Mirrors
 * `manage-account-dialog.tsx`'s controlled-form shape (reset-and-stay-open on
 * "create another", Unit pill only), but hosted in a `Sheet` instead of a `Dialog`.
 */
export function CreateGoalSheet({
  open,
  onOpenChange,
  onCreated,
  prefill,
}: CreateGoalSheetProps) {
  const { t } = useTranslation()
  const form = useCreateGoalForm({ open, onOpenChange, onCreated, prefill })

  const unitIcon = (id: UnitId) =>
    form.charactersById?.has(id) ? characterIcon(id) : mowIcon(id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-testid="create-goal-sheet"
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{t("goals.create.title")}</SheetTitle>
        </SheetHeader>

        <UnitGoalFormFields form={form} unitIcon={unitIcon} />

        <SheetFooter>
          <Field orientation="horizontal">
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
          <Button
            data-testid="create-goal-submit"
            disabled={!form.canSubmit || form.status === "submitting"}
            form="create-goal-form"
            type="submit"
          >
            {form.status === "submitting" ? <Spinner /> : null}
            {t("goals.create.submit")}
          </Button>
          <Button
            data-testid="create-goal-close"
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {t("goals.create.close")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
