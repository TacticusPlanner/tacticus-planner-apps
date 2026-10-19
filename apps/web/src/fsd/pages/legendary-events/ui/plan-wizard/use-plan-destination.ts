import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { AscensionStep } from "@/entities/legendary-event"
import { isProjectNameValid, useProjects } from "@/entities/project"
import { linkedEventProjects } from "@/features/project-management"

import type { PlanDestination } from "./plan-create"
import type { PlanSource } from "./use-plan-source"

/** The New project choice in the destination select. */
export const NEW_PROJECT = "new"

/**
 * Where Create files the goals (spec: an existing project targeting the event, or a new one): the
 * event's first active linked project by default, else a new project named after the event and
 * the target. `value` is null while the projects load or the new name is invalid.
 */
export function usePlanDestination(
  source: Extract<PlanSource, { status: "ready" }>,
  target: AscensionStep | null
) {
  const { t } = useTranslation("legendaryEvents")
  const { projects, loading } = useProjects()
  // Most recently updated first: the default destination.
  const linked = linkedEventProjects(projects, source.event.id).active.toSorted(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt)
  )
  const [choice, setChoice] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const selected = choice ?? linked[0]?.projectId ?? NEW_PROJECT
  const defaultName = t("planWizard.review.newProjectName", {
    name: source.inputs.nameOf(source.event.id),
    step: target ? t(`outlook.steps.${target}`) : "",
  })
  const newName = name ?? defaultName

  let value: PlanDestination | null = null
  if (!loading) {
    if (selected !== NEW_PROJECT) {
      value = { kind: "existing", projectId: selected }
    } else if (isProjectNameValid(newName)) {
      value = { kind: "new", name: newName.trim() }
    }
  }
  return {
    linked,
    loading,
    selected,
    newName,
    value,
    select: setChoice,
    rename: setName,
  }
}

export type PlanDestinationState = ReturnType<typeof usePlanDestination>
