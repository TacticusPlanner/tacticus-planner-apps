// Public API of the team editor (design D1): the dialog that creates and edits a personal team.
export { TeamEditorDialog } from "./ui/team-editor-dialog"

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
