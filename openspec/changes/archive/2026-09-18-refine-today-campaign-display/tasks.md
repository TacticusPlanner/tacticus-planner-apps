## 1. Campaign tier label

- [x] 1.1 Add `tierLabel(descriptor)` to `useCampaignDisplay` (`apps/web/src/fsd/shared/lib/use-campaign-display.ts`) returning only the tier words ("Standard", "Elite", "Mirror", "Mirror Elite", "Extremis"), and verify new cases in `use-campaign-display.test.ts` cover every descriptor shape in design.md's table
- [x] 1.2 Re-express `fullLabel` as `name + tierLabel` and verify the existing `fullLabel` tests still pass unchanged — their asserted strings must not move
- [x] 1.3 Add a regression test asserting `fullLabel(d) === \`${name(d)} ${tierLabel(d)}\`` for every descriptor shape, so the two compositions cannot drift (design.md — Risks)

## 2. Location view model

- [x] 2.1 Replace `fullName` and `nodeNumber` with `campaignName` and `nodeLabel` on `DailyRaidLocationViewModel` (`features/daily-raids/model/daily-raids.domain.ts`), updating the type's doc comments, and verify `pnpm typecheck` now lists exactly the reader sites named in proposal.md — Impact
- [x] 2.2 Build both fields in `use-daily-raids.ts` from `name`/`tierLabel`, appending "B" to `nodeLabel` for a challenge node, and verify unit coverage asserts "Elite 40", "Mirror 12", "Mirror Elite 40", "Extremis 3", and "Extremis 12B"
- [x] 2.3 Set `campaignName` to the raw battle id and `nodeLabel` to empty when `campaignDescriptor` returns `undefined` (design.md — "The no-descriptor fallback loses a line rather than inventing one"), and verify a unit test asserts both fields for an unrecognized group id
- [x] 2.4 Confirm `shortLabel` still composes from the battle record directly so Raids Plan's chips render byte-identical text, verified by the chip assertions on `raid-schedule.test.tsx`'s `emphasis="material"` path still passing. Note this file is NOT untouched: its `location()` helper builds `fullName`/`nodeNumber`, and its `emphasis="location"` test at `raid-schedule.test.tsx:210` asserts `"Indomitus Elite"` and `schedule.battle:{"number":4}` — both are expected to fail until updated in task 3.1

## 3. Render the two-line location

- [x] 3.1 Render `campaignName`/`nodeLabel` in Today's and Bonus Raids' resource cards (`pages/dailies/ui/resource-card.tsx`, location emphasis branch), updating `raid-schedule.test.tsx`'s `location()` helper and its `emphasis="location"` assertions (see task 2.4), and verify `dailies-pages.test.tsx` asserts both lines for a storyline elite node
- [x] 3.2 Render `campaignName`/`nodeLabel` in Today's Attempts (`pages/dailies/ui/today-page.tsx`) and verify a test asserts an attempted event-campaign node reads "Death Guard" / "Extremis 3"
- [x] 3.3 Render `campaignName`/`nodeLabel` in the Home Daily Raids widget (`features/daily-raids/ui/location-row.tsx`) and verify a test asserts the same location reads identically in the widget and on Today (`home-raids-widget` — "A location reads the same on Home as on Today")
- [x] 3.4 Omit the second line in all three renderers when `nodeLabel` is empty, and verify a test rendering a location with no descriptor asserts the battle id on the first line and no second line — not an empty element

## 4. Campaign-event status line

- [x] 4.1 Add a page-local hook under `pages/dailies/ui/` resolving the detected campaign event from `getLiveProgress().activeCampaignEventId` via `campaignDescriptor(...)` → `useCampaignDisplay().name`, **guarding the `undefined` descriptor** (`campaignDescriptor` returns `CampaignDescriptor | undefined`, and the id comes from player data, not the catalog), and its end time from the active `campaign-event` entry of `getEventsActiveAt(new Date())`, reusing `seasonEndCountdown` from `guild-raids/guild-raid-countdowns.ts`; verify unit tests cover all six cells of design.md's matrix, including an id that resolves to no descriptor
- [x] 4.2 Add the status-line component rendering the campaign name with `formatRelativeTime` remaining time, name-only when no calendar window is active, unnamed-but-active copy when the id does not resolve, and the inactive copy when no event id is detected; verify tests assert each of the four rendered forms and that the unresolved case never renders the raw group id
- [x] 4.3 Place the status line in Today's header with a `data-testid`, stacked above the energy row on mobile and sharing that row on desktop with the bar taking remaining width; verify tests assert the rendered order and that the energy bar and its percentage keep their current positions
- [x] 4.4 Verify the status line never contradicts the schedule: a test with a calendar `campaign-event` window active but no `activeCampaignEventId` asserts the inactive copy renders while the schedule excludes event nodes

## 5. Tutorial and i18n

- [x] 5.1 Add a `campaignEvent` step to `pages/dailies/ui/today.tutorial.tsx` targeting the status line's `data-testid`, in both the desktop and mobile step arrays, and add its `tour.today.steps.campaignEvent.title`/`.content` keys — verify `dailies-tutorial.test.tsx` asserts the step is present and ordered before `energyUsage` at both viewports
- [x] 5.2 Add the campaign-event status copy (named event with remaining time, named event without remaining time, unnamed active event with and without remaining time, and "Campaign event is not active") to `apps/web/public/locales/en/dailies.json`, and verify no user-facing string in the new component is untranslated
- [x] 5.3 Remove `schedule.battle` from all four locale files after verifying by grep across `apps/web/src` that nothing references it
- [x] 5.4 Translate every key added in 5.1 and 5.2 into `de`, `es`, and `fr` `dailies.json` at the quality of the surrounding namespace — verify each locale file carries real translations, not English text

## 6. Gates and verification

- [x] 6.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`, and verify all pass
- [x] 6.2 Manually verify Today in a browser against the local Aspire stack, signed in, with a project whose in-scope goals farm both a storyline node and an event-campaign node, and an account whose `live-progress` carries an `activeCampaignEventId` — confirm the two-line labels and the status line with remaining time at one viewport below 768px and one at or above 768px, including the Joyride tour step — verified at 1536px (two equal halves, energy leading) and at 686px (stacked, campaign event below the energy row); both show the "Campaign event" heading, the Adepta Sororitas icon, "ends in 5 days", the two-line labels across Today/Bonus Raids/Today's Attempts, and the tour's `campaignEvent` step at 4 of 7
- [ ] 6.3 Manually verify the inactive state — an account with no `activeCampaignEventId` — shows "Campaign event is not active" and Today's schedule contains no event-campaign nodes. If no such account state is available, report the exact missing state rather than marking this complete — BLOCKED: the only signed-in account (TestUser1 / "Severyn Display") carries an `activeCampaignEventId` (Adepta Sororitas); no account with a null/absent `activeCampaignEventId` was available
- [ ] 6.4 Manually verify a challenge node renders its "B" suffix and a mirror-track node renders "Mirror N", using whichever of Today, Bonus Raids, or Today's Attempts surfaces such a node for the test account. If neither node type is reachable for the available account, report which one was missing rather than marking this complete — mirror track VERIFIED ("Mirror Elite 1", "Mirror Elite 18/19/34" on Today, "Mirror Elite 40" in Today's Attempts); challenge "B" node MISSING: no challenge node appeared in Today, Bonus Raids or Today's Attempts for this account
