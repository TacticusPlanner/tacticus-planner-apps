import { useTranslation } from "react-i18next"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { ProjectColorDot, type ProjectSummary } from "@/entities/project"
import { orderDefaultFirst } from "@/features/project-management"

type Props = {
  projects: ProjectSummary[]
  loading: boolean
  failed: boolean
  selectedId: string | undefined
  onSelect: (projectId?: string) => void
  /** Non-archived goal count per project id. */
  counts: ReadonlyMap<string, number>
  totalCount: number
}

/** The Goals page's project scope chips (`goals-navigation`: "Goals project scope chip row"): a
 * filter, not a launcher — one horizontally scrolling row on both breakpoints, "All goals" first,
 * then the Default project and the other non-archived projects. Loading shows skeleton chips; a
 * failed or empty list shows only "All goals", with no message. */
export function GoalsProjectScope({
  projects,
  loading,
  failed,
  selectedId,
  onSelect,
  counts,
  totalCount,
}: Props) {
  const { t } = useTranslation()
  const ordered = failed ? [] : orderDefaultFirst(projects)
  return (
    <nav
      aria-label={t("goals.project.scopeLabel")}
      className="flex items-center gap-2 overflow-x-auto overflow-y-hidden"
      data-testid="goals-project-scope"
    >
      <Chip
        count={totalCount}
        label={t("goals.project.scopeAll")}
        onClick={() => onSelect(undefined)}
        selected={selectedId === undefined}
        testId="goals-project-scope-all"
      />
      {loading ? (
        <>
          <Skeleton className="h-8 w-24 shrink-0 rounded-full" />
          <Skeleton className="h-8 w-24 shrink-0 rounded-full" />
        </>
      ) : (
        ordered.map((project) => (
          <Chip
            count={counts.get(project.projectId) ?? 0}
            key={project.projectId}
            label={project.name}
            leading={<ProjectColorDot color={project.color} />}
            onClick={() => onSelect(project.projectId)}
            selected={selectedId === project.projectId}
            testId={`goals-project-scope-chip-${project.projectId}`}
          />
        ))
      )}
    </nav>
  )
}

function Chip({
  label,
  count,
  leading,
  selected,
  onClick,
  testId,
}: {
  label: string
  count: number
  leading?: React.ReactNode
  selected: boolean
  onClick: () => void
  testId: string
}) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "hover:bg-accent hover:text-accent-foreground"
      )}
      data-testid={testId}
      onClick={onClick}
      type="button"
    >
      {leading}
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          selected ? "text-primary-foreground/80" : "text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  )
}
