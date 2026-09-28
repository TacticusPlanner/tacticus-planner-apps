import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
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

import {
  goalQueries,
  type GoalGroupValue,
  type GoalKind,
} from "@/entities/goal"
import {
  projectLastMembershipDetails,
  projectMembershipStaleDetails,
  projectQueries,
  projectSlotConflictGoalIds,
  updateProjectGoals,
  type ProjectSummary,
} from "@/entities/project"
import { ApiError } from "@/shared/api"
import { useUnitName } from "@/shared/unit-name"

import {
  desiredGoalIds,
  EMPTY_MEMBERSHIP_DRAFT,
  isInDesiredSet,
  reconcileDraft,
  toggleGoal,
  type MembershipDraft,
} from "../model/membership-draft"
import type { MembershipConflict } from "../model/membership-conflict"
import {
  useMembershipSlots,
  type SlotGoal,
} from "../model/use-membership-slots"
import { MembershipConflictBanner } from "./membership-conflict-banner"
import { MembershipGoalRow } from "./membership-goal-row"
import { MembershipReview } from "./membership-review"

type RowGoal = SlotGoal & { globalPriority: number | null }

type SaveInput = {
  desired: string[]
  expected: string[]
  added: number
  removed: number
}

const GROUP_OPTIONS: readonly GoalGroupValue[] = ["none", "unit", "type"]

/**
 * Reviewed add/remove editor for a project's membership (`project-management`: "The detail route
 * assembles membership in bulk"). Lives here rather than in `pages/goals` because `GP-08` needs the same
 * surface from the goal-creation entry point, which could not reach a page-owned component.
 *
 * Goals are listed in the account-wide priority order the server returns (no sort control: the list must
 * never suggest another order) and may be grouped by unit or goal type. The draft is kept apart from the
 * reviewed baseline membership, so search and grouping only change what is visible. One explicit Save
 * replaces the whole membership atomically, sending the baseline as `expectedGoalIds`; membership never
 * changes any goal's priority, status or target.
 */
export function AddGoalsToProjectSheet({
  open,
  onOpenChange,
  onCreateGoal,
  project,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Starts a brand-new goal scoped to `project`; the caller owns the creation sheet. */
  onCreateGoal: () => void
  project: ProjectSummary
}) {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const getUnitName = useUnitName()
  const [search, setSearch] = useState("")
  const [group, setGroup] = useState<GoalGroupValue>("none")
  const [draft, setDraft] = useState<MembershipDraft>(EMPTY_MEMBERSHIP_DRAFT)
  // The membership the user reviewed (`null` until the sheet has read it); sent as `expectedGoalIds`.
  const [baseline, setBaseline] = useState<string[] | null>(null)
  const [conflict, setConflict] = useState<MembershipConflict | null>(null)

  // The sheet stays mounted while closed, and `ProjectDetailPage` swaps `project` underneath it when
  // the header switcher changes route — that route has no `key`, so the page never remounts. A draft
  // must outlive neither event, or selections made for one project get submitted against another.
  // Reset during render rather than in an effect (react-hooks/set-state-in-effect), and key it on the
  // open flag as well as the project so a reopened sheet never briefly shows the previous draft.
  // The one exception is "Create new goal": it closes this sheet (never two focus-trapped sheets)
  // but suspends the draft, which survives until this project's sheet is reopened. Even then the
  // baseline is read afresh, since the new goal joined the project.
  const draftKey = `${project.projectId}:${open}`
  const [lastDraftKey, setLastDraftKey] = useState(draftKey)
  const [draftProjectId, setDraftProjectId] = useState(project.projectId)
  const [draftSuspended, setDraftSuspended] = useState(false)
  if (lastDraftKey !== draftKey) {
    setLastDraftKey(draftKey)
    const keepDraft = draftSuspended && draftProjectId === project.projectId
    if (!keepDraft) {
      setSearch("")
      setDraft(EMPTY_MEMBERSHIP_DRAFT)
    }
    setBaseline(null)
    setConflict(null)
    setDraftProjectId(project.projectId)
    if (open || !keepDraft) setDraftSuspended(false)
  }

  const goalsQuery = useQuery({
    ...goalQueries.list(false),
    enabled: isAuthenticated && open,
  })
  const membersQuery = useQuery({
    ...projectQueries.goals(project.projectId),
    enabled: isAuthenticated && open,
  })

  const goals: RowGoal[] = goalsQuery.data?.goals ?? []
  const memberGoals: RowGoal[] = (membersQuery.data?.goals ?? []).map(
    (entry) => entry.goal
  )

  // Read the baseline once per draft, after any refetch triggered by opening has settled, and never again
  // on background refetches: it is what the user reviewed, so a later change surfaces as a stale conflict
  // instead of silently moving under the draft.
  if (
    open &&
    baseline === null &&
    membersQuery.isSuccess &&
    !membersQuery.isFetching
  ) {
    const ids = memberGoals.map((goal) => goal.goalId)
    setBaseline(ids)
    setDraft((current) => reconcileDraft(current, ids))
  }

  const baselineIds = baseline ?? []
  const baselineSet = new Set(baselineIds)
  // Archived members are not listed but stay in the baseline, so a save never drops them.
  const goalById = new Map<string, RowGoal>()
  for (const goal of [...memberGoals, ...goals]) goalById.set(goal.goalId, goal)
  const resolve = (ids: readonly string[]) =>
    ids.flatMap((id) => goalById.get(id) ?? [])
  const desiredIds = desiredGoalIds(baselineIds, draft)

  const { rankKeysPending, rankTargetLabel, blockedReason } =
    useMembershipSlots({
      enabled: isAuthenticated && open,
      candidates: goals,
      members: resolve(baselineIds),
      desired: resolve(desiredIds),
    })

  const goalTypeLabel = (goal: SlotGoal) =>
    t(`goals.create.goalTypes.${goal.goalType as GoalKind}`)
  const goalLabel = (goal: SlotGoal) =>
    getUnitName(goal.entityType, goal.entityId)
  const goalTitle = (goal: SlotGoal) =>
    [
      goalLabel(goal),
      goalTypeLabel(goal),
      goal.goalType === "Rank" ? rankTargetLabel(goal) : null,
    ]
      .filter(Boolean)
      .join(" · ")
  const goalName = (goalId: string) => {
    const goal = goalById.get(goalId)
    return goal ? goalTitle(goal) : t("goals.project.assemblyUnknownGoal")
  }

  const query = search.trim().toLowerCase()
  const visibleGoals = goals.filter(
    (goal) =>
      !query ||
      `${goalLabel(goal)} ${goalTypeLabel(goal)}`.toLowerCase().includes(query)
  )
  // Groups keep first-appearance order and each keeps the incoming (global-priority) order.
  const groupKey = (goal: RowGoal) =>
    group === "unit"
      ? `${goal.entityType}:${goal.entityId}`
      : group === "type"
        ? goal.goalType
        : "all"
  const groups = [...new Set(visibleGoals.map(groupKey))].map((key) => {
    const rows = visibleGoals.filter((goal) => groupKey(goal) === key)
    return {
      key,
      rows,
      heading:
        group === "unit"
          ? goalLabel(rows[0]!)
          : group === "type"
            ? goalTypeLabel(rows[0]!)
            : null,
    }
  })

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
      queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
    ])

  const save = useMutation({
    mutationFn: (input: SaveInput) =>
      updateProjectGoals(project.projectId, {
        goals: input.desired.map((goalId) => ({ goalId })),
        expectedGoalIds: input.expected,
      }),
    onSuccess: async (_response, input) => {
      await invalidate()
      toast.success(
        t("goals.toasts.projectMembershipSaved", {
          project: project.name,
          added: input.added,
          removed: input.removed,
        })
      )
      setDraft(EMPTY_MEMBERSHIP_DRAFT)
      setSearch("")
      setConflict(null)
      onOpenChange(false)
    },
    onError: (error) => {
      const details = error instanceof ApiError ? error.details : undefined
      const stale = projectMembershipStaleDetails(details)
      const lastMembership = projectLastMembershipDetails(details)
      const slotGoalIds = projectSlotConflictGoalIds(details)
      if (stale) {
        setConflict({
          kind: "stale",
          message: stale.message,
          currentGoalIds: stale.currentGoalIds,
        })
        // Names of goals added elsewhere resolve from the refreshed goal list.
        void queryClient.invalidateQueries({ queryKey: goalQueries.all() })
      } else if (lastMembership) {
        setConflict({
          kind: "lastMembership",
          message: lastMembership.message,
          goalIds: lastMembership.blockedGoalIds,
        })
      } else if (slotGoalIds) {
        setConflict({
          kind: "slot",
          message: (error as ApiError).message,
          goalIds: slotGoalIds,
        })
      } else {
        toast.error(
          error instanceof ApiError
            ? error.message
            : t("goals.toasts.actionError")
        )
      }
    },
  })

  // Adopts the membership the server reported as current, keeping the draft's intent, so the user can
  // review the combined result and save again.
  const refreshMembership = () => {
    if (conflict?.kind !== "stale") return
    const ids = conflict.currentGoalIds
    setBaseline(ids)
    setDraft((current) => reconcileDraft(current, ids))
    setConflict(null)
    void invalidate()
  }

  const conflictGoalIds = new Set(
    conflict && conflict.kind !== "stale" ? conflict.goalIds : []
  )
  const pendingCount = draft.adds.length + draft.removes.length

  const renderRow = (goal: RowGoal) => {
    const isMember = baselineSet.has(goal.goalId)
    const inDesiredSet = isInDesiredSet(baselineSet, draft, goal.goalId)
    const marked =
      conflict?.kind !== "stale" && conflictGoalIds.has(goal.goalId)
    return (
      <MembershipGoalRow
        blockedReason={blockedReason(goal, inDesiredSet)}
        checked={inDesiredSet}
        conflictMessage={
          !marked
            ? null
            : conflict?.kind === "lastMembership"
              ? t("goals.project.assemblyLastMembership")
              : t("goals.project.assemblySlotConflict", {
                  project: project.name,
                })
        }
        disabled={baseline === null}
        globalPriority={goal.globalPriority}
        goalId={goal.goalId}
        isMember={isMember}
        key={goal.goalId}
        onToggle={() => {
          setDraft((current) => toggleGoal(current, goal.goalId, isMember))
          setConflict((current) => (current?.kind === "stale" ? current : null))
        }}
        pending={
          draft.adds.includes(goal.goalId)
            ? "add"
            : draft.removes.includes(goal.goalId)
              ? "remove"
              : null
        }
        title={goalTitle(goal)}
      />
    )
  }

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
          <Button
            data-testid="add-goals-create-new"
            onClick={() => {
              setDraftSuspended(true)
              onOpenChange(false)
              onCreateGoal()
            }}
            variant="outline"
          >
            <Plus />
            {t("goals.project.createNewGoal")}
          </Button>
          <Input
            aria-label={t("goals.project.addGoalsSearch")}
            data-testid="add-goals-search"
            placeholder={t("goals.project.addGoalsSearch")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div
            aria-label={t("goals.filters.groupByLabel")}
            className="flex flex-wrap gap-1"
            role="group"
          >
            {GROUP_OPTIONS.map((option) => (
              <Button
                aria-pressed={group === option}
                data-testid={`add-goals-group-${option}`}
                key={option}
                onClick={() => setGroup(option)}
                size="sm"
                variant={group === option ? "secondary" : "outline"}
              >
                {option === "none"
                  ? t("goals.filters.groupNone")
                  : option === "unit"
                    ? t("goals.filters.groupByUnit")
                    : t("goals.filters.groupByType")}
              </Button>
            ))}
          </div>

          {conflict ? (
            <MembershipConflictBanner
              baselineIds={baselineIds}
              conflict={conflict}
              goalName={goalName}
              onRefresh={refreshMembership}
            />
          ) : null}

          {baseline === null ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : groups.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("goals.project.addGoalsEmpty")}
            </p>
          ) : (
            <div className="grid gap-3">
              {groups.map((entry) => (
                <section
                  className="grid gap-1"
                  data-testid={`add-goals-group-section-${entry.key}`}
                  key={entry.key}
                >
                  {entry.heading ? (
                    <h3 className="px-1 text-xs font-medium text-muted-foreground uppercase">
                      {entry.heading}
                    </h3>
                  ) : null}
                  <ul className="grid gap-1">{entry.rows.map(renderRow)}</ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <SheetFooter className="sticky bottom-0 border-t bg-background">
          <MembershipReview draft={draft} goalName={goalName} />
          <Button
            data-testid="add-goals-save"
            disabled={
              baseline === null ||
              pendingCount === 0 ||
              save.isPending ||
              rankKeysPending ||
              conflict?.kind === "stale"
            }
            onClick={() =>
              baseline &&
              save.mutate({
                desired: desiredIds,
                expected: baseline,
                added: draft.adds.length,
                removed: draft.removes.length,
              })
            }
          >
            {save.isPending ? <Spinner /> : null}
            {t("goals.project.assemblySave", { count: pendingCount })}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
