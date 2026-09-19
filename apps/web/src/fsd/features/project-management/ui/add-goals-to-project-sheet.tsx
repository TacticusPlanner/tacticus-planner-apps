import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Spinner } from "@workspace/ui/components/spinner"

import { goalQueries, type GoalKind, type GoalSummary } from "@/entities/goal"
import {
  projectQueries,
  updateProjectGoals,
  type ProjectGoalSummary,
  type ProjectSummary,
} from "@/entities/project"
import { ApiError } from "@/shared/api"
import { useUnitName } from "@/shared/unit-name"

/** A project holds at most one Active/Paused goal per unit-and-goal-type slot. */
const slotKey = (goal: {
  entityType: string
  entityId: string
  goalType: string
}) => `${goal.entityType}:${goal.entityId}:${goal.goalType}`

const occupiesSlot = (goal: { status: string }) =>
  goal.status === "Active" || goal.status === "Paused"

/**
 * Bulk assembly for a project's membership (`project-management`: "The detail route assembles
 * membership in bulk"). Lives here rather than in `pages/goals` because `GP-08` needs the same
 * surface from the goal-creation entry point, which could not reach a page-owned component.
 *
 * It only ever adds. `PUT /me/projects/{id}/goals` replaces the project's whole membership and
 * rejects a call whose removals would orphan a goal, so a sheet that also removed would need a
 * non-atomic two-phase sequence — out of scope, and removal has its own per-goal row action.
 */
export function AddGoalsToProjectSheet({
  open,
  onOpenChange,
  project,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: ProjectSummary
}) {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const getUnitName = useUnitName()
  const [search, setSearch] = useState("")
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])

  // The sheet stays mounted while closed, and `ProjectDetailPage` swaps `project` underneath it when
  // the header switcher changes route — that route has no `key`, so the page never remounts. A draft
  // must outlive neither event, or selections made for one project get submitted against another.
  // Reset during render rather than in an effect (react-hooks/set-state-in-effect), and key it on the
  // open flag as well as the project so a reopened sheet never briefly shows the previous draft.
  const draftKey = `${project.projectId}:${open}`
  const [lastDraftKey, setLastDraftKey] = useState(draftKey)
  if (lastDraftKey !== draftKey) {
    setLastDraftKey(draftKey)
    setSearch("")
    setSelectedGoalIds([])
  }

  const goalsQuery = useQuery({
    ...goalQueries.list(false),
    enabled: isAuthenticated && open,
  })
  const membersQuery = useQuery({
    ...projectQueries.goals(project.projectId),
    enabled: isAuthenticated && open,
  })

  const goals = goalsQuery.data?.goals ?? []
  const members: ProjectGoalSummary[] = membersQuery.data?.goals ?? []
  const memberIds = new Set(members.map((entry) => entry.goal.goalId))

  // The endpoint checks slot uniqueness across the *entire* submitted set and rejects the whole save
  // on any collision, so the check here spans both current members and the pending selections —
  // otherwise one conflicting pick would discard the user's whole batch.
  const slotOwners = new Map<string, string>()
  for (const entry of members) {
    if (occupiesSlot(entry.goal)) {
      slotOwners.set(slotKey(entry.goal), entry.goal.goalId)
    }
  }
  for (const goalId of selectedGoalIds) {
    const goal = goals.find((candidate) => candidate.goalId === goalId)
    if (goal && occupiesSlot(goal) && !slotOwners.has(slotKey(goal))) {
      slotOwners.set(slotKey(goal), goal.goalId)
    }
  }
  const blockedReason = (goal: GoalSummary) => {
    if (memberIds.has(goal.goalId) || !occupiesSlot(goal)) return null
    const owner = slotOwners.get(slotKey(goal))
    return owner && owner !== goal.goalId
      ? t("goals.project.assemblySlotTaken", {
          type: t(`goals.create.goalTypes.${goal.goalType as GoalKind}`),
        })
      : null
  }

  const goalLabel = (goal: GoalSummary) =>
    getUnitName(goal.entityType, goal.entityId)
  const query = search.trim().toLowerCase()
  const visibleGoals = goals.filter((goal) => {
    if (!query) return true
    const type = t(`goals.create.goalTypes.${goal.goalType as GoalKind}`)
    return `${goalLabel(goal)} ${type}`.toLowerCase().includes(query)
  })

  const save = useMutation({
    mutationFn: async () => {
      // Whole-membership replacement: read the project's members as they stand now, not as the sheet
      // rendered them, or goals added elsewhere since it opened would be dropped by this save.
      const current = (
        await queryClient.fetchQuery(projectQueries.goals(project.projectId))
      ).goals
      const currentIds = new Set(current.map((entry) => entry.goal.goalId))
      // Existing members resend the priority they already have and additions append above the
      // maximum, so the server's renumbering preserves the project's established unit order and
      // puts the added units last.
      const maxPriority = current.reduce(
        (highest, entry) => Math.max(highest, entry.priority),
        0
      )
      const additions = selectedGoalIds.filter((id) => !currentIds.has(id))
      return updateProjectGoals(project.projectId, [
        ...current.map((entry) => ({
          goalId: entry.goal.goalId,
          priority: entry.priority,
        })),
        ...additions.map((goalId, index) => ({
          goalId,
          priority: maxPriority + 1 + index,
        })),
      ]).then(() => additions.length)
    },
    onSuccess: async (added) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
        queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
      ])
      toast.success(
        t("goals.toasts.goalsAddedToProject", {
          count: added,
          project: project.name,
        })
      )
      setSelectedGoalIds([])
      setSearch("")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : t("goals.toasts.actionError")
      )
    },
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="overflow-y-auto"
        data-testid="add-goals-to-project-sheet"
      >
        <SheetHeader>
          <SheetTitle>{t("goals.project.addGoalsTitle")}</SheetTitle>
          <SheetDescription>
            {t("goals.project.addGoalsDescription", { project: project.name })}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-3 px-4">
          <Input
            aria-label={t("goals.project.addGoalsSearch")}
            data-testid="add-goals-search"
            placeholder={t("goals.project.addGoalsSearch")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {visibleGoals.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("goals.project.addGoalsEmpty")}
            </p>
          ) : (
            <ul className="grid gap-1">
              {visibleGoals.map((goal) => {
                const isMember = memberIds.has(goal.goalId)
                const blocked = blockedReason(goal)
                return (
                  <li
                    className="grid gap-1 rounded-xl border p-2"
                    data-testid={`add-goals-row-${goal.goalId}`}
                    key={goal.goalId}
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={
                          isMember || selectedGoalIds.includes(goal.goalId)
                        }
                        data-testid={`add-goals-check-${goal.goalId}`}
                        disabled={isMember || blocked !== null}
                        onCheckedChange={(checked) =>
                          setSelectedGoalIds((current) =>
                            checked === true
                              ? [...current, goal.goalId]
                              : current.filter((id) => id !== goal.goalId)
                          )
                        }
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {goalLabel(goal)} ·{" "}
                        {t(
                          `goals.create.goalTypes.${goal.goalType as GoalKind}`
                        )}
                      </span>
                      {isMember ? (
                        <Badge
                          data-testid={`add-goals-member-${goal.goalId}`}
                          variant="secondary"
                        >
                          {t("goals.project.addGoalsMember")}
                        </Badge>
                      ) : null}
                    </label>
                    {blocked ? (
                      <p
                        className="text-xs text-destructive"
                        data-testid={`add-goals-blocked-${goal.goalId}`}
                      >
                        {blocked}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <SheetFooter>
          <Button
            data-testid="add-goals-save"
            disabled={selectedGoalIds.length === 0 || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? <Spinner /> : null}
            {t("goals.project.addGoalsSave", { count: selectedGoalIds.length })}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
