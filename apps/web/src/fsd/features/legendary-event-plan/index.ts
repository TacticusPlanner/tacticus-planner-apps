// Public API of the Legendary Event plan feature: the teams per lane (editor, picker, clear
// depth), team suggestions, the Maybe clear / Stop here marks on the Synced progress grid, and
// the run inputs drawer. Every write goes through the entity's shared plan write queue.
export {
  useLegendaryEventPlan,
  type DepthEstimateContext,
  type LegendaryEventPlanActions,
} from "./model/use-legendary-event-plan"
export type { PickerEstimates, PickerGoalsPreview } from "./model/team-picker"
export { laneTeams } from "./model/plan-patches"
export { TeamEditorDialog } from "./ui/team-editor-dialog"
export { ClearDepthField } from "./ui/clear-depth-field"
export { editStartsFromEstimate } from "./model/clear-depth-display"
export { TeamSuggestionsDialog } from "./ui/team-suggestions-dialog"
export { useAnnotations } from "./model/use-annotations"
export { AnnotationMenu } from "./ui/annotation-menu"
export { AnnotationMarkIcon } from "./ui/annotation-mark"
export { BattleAnnotationMenu } from "./ui/battle-annotation-menu"
export { RunInputsDrawer, RunInputsForm } from "./ui/run-inputs-drawer"
