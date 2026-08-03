import type { TFunction } from "i18next"

/** " (default, active)"-style suffix for a project's label in a checkbox list — shared by the Create
 * Goal drawer's project section (unit-goal-form-fields.tsx) and the detail sheet's
 * (goal-projects-field.tsx), so the two markers always read the same way in both places. Empty when
 * neither applies; a project can be both at once (the default project is also the initial active
 * plan). `t` is passed in rather than called via `useTranslation` here so this stays a plain
 * function, callable from either component's own render without an extra hook. Lives in `model/`
 * rather than alongside the UI components it's shared by, so this file only exports a plain
 * function (react-refresh's only-export-components rule forbids mixing that with a component file
 * like goal-visuals.tsx, where it previously lived). */
export function projectMarkerSuffix(
  t: TFunction,
  project: { isDefault: boolean; isActivePlan: boolean }
): string {
  const markers = [
    project.isDefault ? t("goals.create.projectDefaultMarker") : null,
    project.isActivePlan ? t("goals.create.projectActive") : null,
  ].filter((marker): marker is string => marker !== null)
  return markers.length > 0 ? ` (${markers.join(", ")})` : ""
}
