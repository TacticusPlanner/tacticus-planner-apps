import { useTranslation } from "react-i18next"

import { ProjectSelect } from "@/entities/project"
import { RaidsFiltersTrigger } from "@/features/daily-raids"

import type { DailiesOutletContext } from "./dailies-layout"

/**
 * The raid list controls of the HSE and HRE tabs: the Dailies-wide project selector (shared with
 * Today, so a project picked on one tab holds on the others) and the Raids Filters action (the one
 * persisted filter). The project narrows the goals the suggestions serve; the filters narrow the
 * locations.
 */
export function RaidsSectionControls({
  context,
  testIdPrefix,
}: {
  context: DailiesOutletContext
  /** `hse` or `hre`: the ids are `<prefix>-raids-controls`, `-project-select`, `-raids-filters`. */
  testIdPrefix: string
}) {
  const { t } = useTranslation("dailies")

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid={`${testIdPrefix}-raids-controls`}
    >
      <ProjectSelect
        allowAll
        onProjectIdChange={context.setProjectId}
        placeholder={t("project.placeholder")}
        projectId={context.projectId}
        projects={context.projects}
        testId={`${testIdPrefix}-project-select`}
      />
      <RaidsFiltersTrigger testId={`${testIdPrefix}-raids-filters`} />
    </div>
  )
}
