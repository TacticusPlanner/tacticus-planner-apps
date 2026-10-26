/* eslint-disable react-refresh/only-export-components */
import { useMemo, type Dispatch, type SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps, type TourPageSteps } from "@/shared/tour"

import type { MobileCreateStep } from "./mobile-create-step"

/**
 * The create-goal sheet's own onboarding tour (plan: acquisition-source picker,
 * tacticus-planner-apps#103): the current status, the target ladder, "Add milestone", the combined
 * Campaigns/Onslaught/Shops sources, the Mythic materials, the project picker's inline Create action
 * and the problem count beside Create goal. Steps whose target isn't on screen (no unit chosen, no
 * problem) are skipped by Joyride. Below 768px creation is a three-step flow, so the mobile tour
 * starts with the step indicator, and each step first shows the composer step that holds its target
 * (`setMobileStep`), then waits for the target to render. The targets are `data-testid`s that both
 * shells render.
 */
export function useCreateGoalSheetTutorial(
  setMobileStep?: Dispatch<SetStateAction<MobileCreateStep>>
): TourPageSteps {
  const { t } = useTranslation()

  return useMemo<TourPageSteps>(() => {
    const step = (name: TourStepName, target: string): Step => ({
      target,
      title: t(`tour.createGoal.steps.${name}.title`),
      content: t(`tour.createGoal.steps.${name}.content`),
    })
    const status = step("status", '[data-testid="create-goal-unit-info"]')
    const ladder = step("ladder", LADDER_TARGET)
    const milestones = step("milestones", MILESTONE_TARGET)
    const acquisitionSources = step(
      "acquisitionSources",
      '[data-testid="create-goal-acquisition-sources"]'
    )
    // Skipped unless a Rank/Upgrade/MoW-Ability range needs a Mythic material.
    const mythicMaterialSources = step(
      "mythicMaterialSources",
      '[data-testid="goal-mythic-material-sources"]'
    )
    const projects = step("projects", '[data-testid="create-goal-projects"]')
    // Skipped while the form has no blocking problem.
    const issues = step("issues", '[data-testid="create-goal-issue-summary"]')
    const indicator = step(
      "stepIndicator",
      '[data-testid="create-goal-step-indicator"]'
    )

    const on = (composerStep: MobileCreateStep, tourStep: Step): Step => ({
      ...tourStep,
      before: async () => {
        setMobileStep?.(composerStep)
        await waitForElement(tourStep.target as string, 1000)
      },
    })

    return {
      desktop: [
        status,
        ladder,
        milestones,
        acquisitionSources,
        mythicMaterialSources,
        projects,
        issues,
      ],
      mobile: [
        on("unit", indicator),
        on("unit", status),
        on("goals", ladder),
        on("goals", milestones),
        on("goals", acquisitionSources),
        on("goals", mythicMaterialSources),
        on("goals", issues),
        on("review", projects),
      ],
    }
  }, [t, setMobileStep])
}

type TourStepName =
  | "status"
  | "ladder"
  | "milestones"
  | "acquisitionSources"
  | "mythicMaterialSources"
  | "projects"
  | "issues"
  | "stepIndicator"

/** Resolves once `selector` matches, or after `timeoutMs` (Joyride then skips a missing target). */
function waitForElement(selector: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs
    const check = () => {
      if (document.querySelector(selector) || Date.now() > deadline) resolve()
      else requestAnimationFrame(check)
    }
    check()
  })
}

const LADDER_TARGET = ["rank", "ascension"]
  .map((kind) => `[data-testid="create-goal-${kind}-end"]`)
  .join(", ")

const MILESTONE_TARGET = ["rank", "ascension", "ability"]
  .map((kind) => `[data-testid="create-goal-${kind}-milestones"]`)
  .join(", ")

/**
 * Registers the sheet's tour steps only while it's open. `CreateGoalSheet` is mounted
 * permanently at the app-shell level (`open` just toggles visibility — see app-shell.tsx), so the
 * registration lives in a child gated by `open`: page-tour registrations stack (see
 * `registerPageSteps` in `tour-provider.tsx`), so the sheet's steps are the active tour while it is
 * open and closing it restores the underlying page's own steps.
 */
export function CreateGoalSheetTourRegistration({
  setMobileStep,
}: {
  setMobileStep?: Dispatch<SetStateAction<MobileCreateStep>>
} = {}) {
  useTourPageSteps(useCreateGoalSheetTutorial(setMobileStep), {
    overlay: true,
  })
  return null
}
