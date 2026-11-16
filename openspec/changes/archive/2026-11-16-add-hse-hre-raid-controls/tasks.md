## 1. Raid list controls

- [x] 1.1 Add `RaidsSectionControls` (project selector + Raids Filters) to the Dailies page slice
- [x] 1.2 HSE tab: show the controls above the raid lists and pass the project to the farm list
- [x] 1.3 HRE tab: show the controls in the raids section and pass the project to the suggestions

## 2. HRE event switcher

- [x] 2.1 Extract the HSE switcher into a shared `EventInstanceSwitcher`
- [x] 2.2 List every HRE instance with a running / upcoming / past status and resolve the `event` URL key
- [x] 2.3 Add `HreEventSwitcher` to the HRE title row; past events show header and missions only
- [x] 2.4 Add the switcher tour step and the strings in en, de, es, fr

## 3. Tests

- [x] 3.1 Update HSE and HRE page tests; add model tests for the HRE instance list and selection
- [ ] 3.2 Manual check at 1280px and 420px (switcher, controls, past event)
