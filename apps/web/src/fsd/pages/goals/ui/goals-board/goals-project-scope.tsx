import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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

const ALL = "all"
/** Up to this many projects stay as chips; more collapse into a select. */
const MAX_CHIP_PROJECTS = 3

/** The Goals page's project scope filter, inline in the filters row: "All goals" first, then the
 * Default project and the other non-archived projects — as chips for up to three projects, as a
 * select beyond that. Loading shows skeletons; a failed or empty list offers only "All goals". */
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
  if (loading || ordered.length <= MAX_CHIP_PROJECTS) {
    return (
      <nav
        aria-label={t("goals.project.scopeLabel")}
        className="flex flex-wrap items-center gap-2"
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
  return (
    <Select
      onValueChange={(next) => onSelect(next === ALL ? undefined : next)}
      value={selectedId ?? ALL}
    >
      <SelectTrigger
        aria-label={t("goals.project.scopeLabel")}
        data-testid="goals-project-scope"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem data-testid="goals-project-scope-all" value={ALL}>
          {t("goals.project.scopeAll")} ({totalCount})
        </SelectItem>
        {ordered.map((project) => (
          <SelectItem
            data-testid={`goals-project-scope-chip-${project.projectId}`}
            key={project.projectId}
            value={project.projectId}
          >
            <span className="flex items-center gap-2">
              <ProjectColorDot color={project.color} />
              {project.name} ({counts.get(project.projectId) ?? 0})
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
          : "hover:bg-accent/10"
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
