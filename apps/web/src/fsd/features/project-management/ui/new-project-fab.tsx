import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/**
 * "New project" floating action button (project-management spec: replaces the list route's old
 * header-row `Button`) - same visual/positioning pattern as `ScrollToTopButton`, but a primary
 * action rather than a scroll-gated convenience, so it stays visible at every breakpoint instead
 * of appearing only on mobile once the user has scrolled.
 */
export function NewProjectFab({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()

  return (
    <Button
      aria-label={t("goals.project.newProject")}
      className="fixed right-4 bottom-[calc(var(--mobile-nav-height)+1rem)] z-40 size-14 rounded-full shadow-lg md:bottom-4 [&_svg]:size-6"
      data-testid="projects-new-project"
      onClick={onClick}
      size="icon"
      title={t("goals.project.newProject")}
    >
      <Plus />
    </Button>
  )
}
