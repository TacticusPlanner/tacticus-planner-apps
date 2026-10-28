# Tasks

## 1. Game art

- [x] 1.1 Add the 51 event sprites (HSE medallions and banners, Faction Boost medallions, Double XP/Gold, event-type menu icons, timer) to `apps/web/datamine/sprites.txt` and run `pnpm datamine:sync && pnpm datamine:sprites` at the pinned `v1.43.157.2989`; verify every new path exists under `apps/web/public/game_catalog/datamines/`.
- [x] 1.2 Add `eventIcon`, `homeScreenEventBanner` and `countdownIcon` in `packages/game-catalog/src/game-entities/icons/event.ts`, exported from the package root, with tests for id, Faction Boost parameter, type and no-art fallbacks; verify `event.test.ts` passes.
- [x] 1.3 Add `EventIcon` to `@/shared/ui`, falling back to `EventTypeIcon` when there is no art.

## 2. Event families

- [x] 2.1 Add `--event-family-*` tokens (light and dark) to `packages/ui/src/styles/globals.css` and `resolveEventFamily`, `eventFamilyStripeClass`, `eventFamilySwatchClass`, `EVENT_FAMILIES_IN_LEGEND_ORDER` to `shared/lib/event-colors.ts`, removing the per-type legend helpers no longer used; verify `knip` reports nothing unused.

## 3. Home events model

- [x] 3.1 Move row selection to `pages/home/model/select-home-events.ts` as `selectHomeEvents` returning `{ live, upcoming }` with the Legendary Event pin; cover live split, cap, pin and no-pin-when-live in `select-home-events.test.ts`.
- [x] 3.2 Add `useHomeEvents` reading both sources once with one `nowMs`.
- [x] 3.3 Add `buildEventsAgenda` to `events-calendar-calc.ts` and expose `agenda` from `useEventsCalendar`; cover ongoing de-duplication, start/end/one-day filtering and empty-day removal.

## 4. Home UI

- [x] 4.1 Add `RightNow` (tokens plus live tiles with portrait, banner, LIVE, ends-in, run and points) and `UpcomingEvents` (three rows, start, starts-in), replacing `HomeEventsWidget`.
- [x] 4.2 Add `LegendaryEventPlanButton` on `useEventProjects`: one project, several, none/hidden/failed, loading.
- [x] 4.3 Rework Token Availability as ring meters, capped first, no pulse.
- [x] 4.4 Daily Raids: 10-location cap with show more/less and `aria-expanded`; "Open Today" header link; remove whole-card navigation.
- [x] 4.5 Your Projects: "All projects" header link; 1/2/3-column grid.
- [x] 4.6 New `HomePage` layout: Right now; Raids (3/5) beside Upcoming (2/5); Projects; calendar.
- [x] 4.7 Calendar: `EventBar` with family stripe and icon (icon-only for one-day bars), details popover with Wiki, family legend, mobile agenda with Ongoing strip.
- [x] 4.8 Update component tests: `upcoming-events.test.tsx` (Right now and Upcoming together, plan action states), `raids-widget`, `projects-widget`, `token-availability`, `event-entry-card`, `events-calendar`, `events-calendar-mobile`, `home-page`.

## 5. i18n and tour

- [x] 5.1 Add or change `common.json` keys (`home.rightNow.*`, `home.events.title` "Upcoming events", `openProject`, `projects_one/_other`, `planEvent`, `home.raids.openToday`, `showMore_one/_other`, `showLess`, `home.projects.viewAll`) and `events.json` keys (`families.*` replacing `legend.*`, `agenda.*`, `details.projectedNote`) in en, de, es and fr with real translations; verify `pnpm typecheck` passes.
- [x] 5.2 Update `home-page.tutorial.tsx` steps to `rightNow`, `raids`, `upcoming`, `projects`, `navigation`, `calendar` with targets `home-right-now`, `home-raids-widget`, `home-events-widget`, `home-projects-widget`, `events-calendar-navigation`, `events-calendar`, and their `tour.home.steps.*` copy in all four locales; verify `home-page.tutorial.test.tsx` and `events-translations.test.ts` pass.

## 6. Gates

- [x] 6.1 Targeted tests: `pnpm --filter web exec vitest run src/fsd/pages/home src/fsd/shared` (545 passing) and `pnpm --filter @workspace/game-catalog exec vitest run src/game-entities/icons` (57 passing). Full `pnpm test:run` runs in CI per the project's testing instruction.
- [x] 6.2 `pnpm typecheck`, ESLint on changed files, `knip`, `pnpm lint:fsd` and `git diff --check` pass. (Full-tree `pnpm lint` exhausts the session container's memory; CI runs it.)

## 7. Desktop verification (viewport ≥ 768px)

Data states needed: an account with synced tokens including one capped; a live HSE with banner art and one without; a live Legendary Event with a synced entry; an upcoming Legendary Event with zero, one and two targeting projects; more than 10 raid locations; three or more projects.

- [ ] 7.1 Right now shows tokens and live tiles side by side; capped token first, red ring, no animation; HSE banner backdrop legible in light and dark.
- [ ] 7.2 Raids (wide) beside Upcoming (narrow); Raids shows 10 with "Show N more"; "Open Today" opens `/dailies/raids`.
- [ ] 7.3 Plan action: "Plan this event" opens `/legendary-events/:id/plan`; "Open project" and the projects menu open `/plan/goals?project=…`.
- [ ] 7.4 Calendar bars show icons and stripes; one-day bars icon-only with tooltip; popover shows range and Wiki; legend lists only present families.
- [ ] 7.5 Home tour runs through all six steps in page order.

## 8. Mobile verification (viewport < 768px, same-origin iframe)

- [ ] 8.1 Order: Right now, Daily Raids, Upcoming events, Your Projects, calendar; tokens above live tiles.
- [ ] 8.2 Raids toggle and plan actions are tappable without triggering the row link.
- [ ] 8.3 Agenda: Ongoing strip scrolls horizontally with "ends in …"; days list only starts, ends and one-day events; tapping opens the popover.
- [ ] 8.4 Home tour runs through all six steps on mobile.

## Deferred / out-of-session

- Groups 7 and 8: this session's container has no Aspire AppHost stack, no running dev server and no connected signed-in browser, so live verification could not run. Run both groups against the local Aspire stack before archiving; tracked on the PR for this change.
