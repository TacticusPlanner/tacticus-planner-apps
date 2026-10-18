# Tasks

## 1. Suggestions

- [x] 1.1 Add the support swap (design D8) to `suggestLaneTeams`; tests: healer swapped in for a non-mech team, no healer added to an all-Mechanical team, mechanic swapped in for a team with a Mechanical member, no mechanic for an all non-Mechanical team, a five-member team already holding a useful Healer unchanged, the Uthar worked example unchanged (verify: `vitest run team-suggestions`)

## 2. Editor

- [x] 2.1 Drop `excluded` from the editor draft so checked = derived; update `team-editor-draft` tests (opening a saved team with an omitted derived objective shows it covered) (verify: `vitest run team-editor-draft`)
- [x] 2.2 Remove the Covered objectives section from `team-editor-dialog.tsx`; Members heading with count and Clear depth on one row; footer chips carry the cleared mark; update dialog tests (verify: `vitest run team-editor-dialog team-editor-summary`)
- [x] 2.3 Suggestions pass their objective subset to the editor and the picker starts with those chips selected; tests in `teams-section` and `team-unit-picker` (verify: `vitest run teams-section team-unit-picker`)

## 3. Picker

- [x] 3.1 `objectiveChipCounts` counts against the current selection; tests for none, one and two selected (verify: `vitest run team-picker`)
- [x] 3.2 Default sort Power with the Points left fallback; grid `grid-cols-3 md:grid-cols-5`; update picker tests (verify: `vitest run team-unit-picker`)

## 4. i18n and tour

- [x] 4.1 Remove keys only the Covered objectives section used (`teams.editor.coverageHint`, `noCoverage`, `noMembers`; `teams.editor.coverage` stays as the footer chips' label) in en, de, es and fr; re-check tour steps targeting the editor (verify: i18n key-parity test, tutorial test)

## 5. Gates

- [x] 5.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format` and `git diff --check` pass

## 6. Manual verification (desktop ≥ 768px and mobile < 768px)

- [ ] 6.1 Editor shows Name, then Members and Clear depth on one row, then the picker; no Covered objectives section; footer chips show the cleared mark
- [ ] 6.2 Use this team opens with the proposal's chips selected and the grid sorted by Power
- [ ] 6.3 Chip counts drop as chips are combined; mobile tiles are three per row with objective icons on one line
