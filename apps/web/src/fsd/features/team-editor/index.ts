// Public API of the team editor (design D1): the dialog that creates and edits a personal team, and
// its unit picker, which Guild War Offense reuses to pick an attack's lineup.
export { TeamEditorDialog } from "./ui/team-editor-dialog"
export { TeamUnitPicker } from "./ui/team-unit-picker"
export { usePickerUnits } from "./model/use-picker-units"
export {
  defaultPickerFilters,
  type PickerFilters,
  type PickerUnit,
} from "./model/unit-picker"

/** The copy namespaces the editor reads beyond `teams`, so a page can load them ahead of the first
 *  opening instead of suspending on it. */
export const TEAM_EDITOR_NAMESPACES = [
  "teams",
  "progression",
  "factions",
  "traits",
  "damageTypes",
  "campaigns",
  "characters",
  "mows",
  "unitSearchNames",
] as const
