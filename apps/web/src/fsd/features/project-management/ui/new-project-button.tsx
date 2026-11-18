import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/**
 * "New project", the Projects page's primary create action (project-management spec): a filled
 * button in the page toolbar's Actions slot (ui-style-guide rule 2), with its text label at every
 * width.
 */
export function NewProjectButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()

  return (
    <Button data-testid="projects-new-project" onClick={onClick}>
      <Plus data-icon="inline-start" />
      {t("goals.project.newProject")}
    </Button>
  )
}
