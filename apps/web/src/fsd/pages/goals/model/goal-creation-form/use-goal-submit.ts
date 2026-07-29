import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"

import type { UnitId } from "@workspace/game-domain"

import {
  buildCreateGoalSnapshot,
  createCombinedGoals,
  type ProjectPriority,
} from "@/entities/goal"
import { ApiError } from "@/shared/api"

import { buildCombinedGoalSpecs } from "../estimate/goal-spec-builder"
import type { EntityType } from ".//use-create-goal-form"

type SpecParams = Parameters<typeof buildCombinedGoalSpecs>[0]
type SnapshotContext = Omit<
  Parameters<typeof buildCreateGoalSnapshot>[0],
  "spec"
>

/**
 * Submission state (status/error/"create another") and the submit handler itself — assembles the
 * combined-goal specs (pure builder in `goal-spec-builder.ts`) and their snapshots (pure builder
 * in `goal-snapshot-builder.ts`), fires the mutation, and resets or closes the sheet on success.
 * Split out of `use-create-goal-form.ts` purely for that file's own max-lines budget; takes the
 * rest of that hook's assembled state as plain params rather than owning any of it itself.
 */
export function useGoalSubmit({
  entityId,
  entityType,
  canSubmit,
  selectedProjects,
  specParams,
  snapshotContext,
  onOpenChange,
  onCreated,
  resetForm,
}: {
  entityId: UnitId | undefined
  entityType: EntityType
  canSubmit: boolean
  selectedProjects: ProjectPriority[]
  specParams: SpecParams
  snapshotContext: SnapshotContext
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  resetForm: () => void
}) {
  const { t } = useTranslation()
  const [createAnother, setCreateAnother] = useState(false)
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const createGoals = useMutation({ mutationFn: createCombinedGoals })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!entityId || !canSubmit) {
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    try {
      const specs = buildCombinedGoalSpecs(specParams)
      await createGoals.mutateAsync({
        entityType,
        entityId,
        projects: selectedProjects.length > 0 ? selectedProjects : undefined,
        goals: specs.map((spec) => ({
          ...spec,
          snapshot: buildCreateGoalSnapshot({ ...snapshotContext, spec }),
        })),
      })

      if (createAnother) {
        resetForm()
        setStatus("idle")
      } else {
        onOpenChange(false)
        onCreated()
      }
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : t("goals.create.genericError")
      )
    }
  }

  return { createAnother, setCreateAnother, status, errorMessage, handleSubmit }
}
