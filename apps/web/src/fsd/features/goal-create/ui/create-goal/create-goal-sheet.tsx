import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

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
import { CreateGoalSheetTourRegistration } from "./create-goal-sheet.tutorial"
import { CreateGoalOptions } from "./create-goal-options"
import { GoalFormIssueSummary } from "./goal-form-issues"
import { focusGoalField } from "./goal-form-issue-ids"
import {
  MOBILE_CREATE_STEPS,
  type MobileCreateStep,
} from "./mobile-create-step"
import { MobileStepIndicator } from "./mobile-create-steps"
import { UnitGoalFormFields } from "./unit-goal-form-fields"

type CreateGoalSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefill?: CreateGoalPrefill
  /** Header action beside the title, e.g. the page tour button: the page header's sits behind the
   *  modal. Passed in rather than imported so this lazy chunk's import graph stays as it is. */
  headerAction?: ReactNode
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
  prefill,
  headerAction,
}: CreateGoalSheetProps) {
  const { t } = useTranslation()
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null
  )
  const form = useCreateGoalForm({ open, onOpenChange, prefill })
  const isMobile = useIsMobile()
  // Below 768px creation is a three-step flow; a launch that carries a unit starts at Goals.
  const firstStep: MobileCreateStep =
    prefill && "entityId" in prefill ? "goals" : "unit"
  const [mobileStep, setMobileStep] = useState<MobileCreateStep>(firstStep)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setMobileStep(firstStep)
  }
  const stepIndex = MOBILE_CREATE_STEPS.indexOf(mobileStep)
  const nextBlocked =
    mobileStep === "unit"
      ? !form.entityId
      : form.issues.length > 0 || form.enabledTypes.size === 0

  const unitIcon = (id: UnitId) =>
    form.charactersById?.has(id) ? characterIcon(id) : mowIcon(id)

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      data-testid="create-goal-sheet"
      contentRef={setPortalContainer}
      // A fixed height at 768px and wider, so enabling a goal type never resizes or moves the dialog.
      desktopClassName="h-[min(56rem,calc(100vh-2rem))]"
      preventOutsideClose
    >
      {open ? (
        <CreateGoalSheetTourRegistration setMobileStep={setMobileStep} />
      ) : null}
      <ResponsiveDialogHeader className="flex-row flex-wrap items-center gap-2">
        <ResponsiveDialogTitle>{t("goals.create.title")}</ResponsiveDialogTitle>
        {headerAction}
        {isMobile ? (
          <div className="basis-full">
            <MobileStepIndicator step={mobileStep} />
          </div>
        ) : null}
      </ResponsiveDialogHeader>

      <ResponsiveDialogBody>
        <UnitGoalFormFields
          form={form}
          mobileStep={isMobile ? mobileStep : undefined}
          portalContainer={portalContainer}
          unitIcon={unitIcon}
        />
      </ResponsiveDialogBody>

      {/* Below 768px the footer is one row: Close (Back after the first step), the problem count, then
          Next or, on Review, Create goal (goal-creation: mobile step navigation keeps values). */}
      <ResponsiveDialogFooter className="flex-row items-center justify-end max-md:gap-2">
        {isMobile ? null : (
          <CreateGoalOptions
            form={form}
            placement="footer"
            portalContainer={portalContainer}
          />
        )}
        {isMobile && stepIndex > 0 ? (
          <Button
            className="flex-1"
            data-testid="create-goal-back"
            onClick={() => setMobileStep(MOBILE_CREATE_STEPS[stepIndex - 1]!)}
            type="button"
            variant="outline"
          >
            {t("goals.create.steps.back")}
          </Button>
        ) : (
          <Button
            className="max-md:flex-1"
            data-testid="create-goal-close"
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {t("goals.create.close")}
          </Button>
        )}
        {isMobile && mobileStep === "unit" ? null : (
          <GoalFormIssueSummary
            issues={form.issues}
            onFollow={(issue) => {
              if (isMobile) setMobileStep("goals")
              form.setExpandedKind(issue.kind)
              focusGoalField(issue.kind, issue.field)
            }}
            portalContainer={portalContainer}
          />
        )}
        {isMobile && mobileStep !== "review" ? (
          <Button
            className="flex-1"
            data-testid="create-goal-next"
            disabled={nextBlocked}
            onClick={() => setMobileStep(MOBILE_CREATE_STEPS[stepIndex + 1]!)}
            type="button"
          >
            {t("goals.create.steps.next")}
          </Button>
        ) : (
          <Button
            className="max-md:flex-1"
            data-testid="create-goal-submit"
            disabled={!form.canSubmit || form.status === "submitting"}
            form="create-goal-form"
            type="submit"
          >
            {form.status === "submitting" ? <Spinner /> : null}
            {t("goals.create.submit")}
          </Button>
        )}
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
