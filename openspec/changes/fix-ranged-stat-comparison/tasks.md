## 1. Comparison model

- [x] 1.1 In `model/stat-radar.ts`, make `value` and `percentile` nullable for a missing ranged attack and drop nulls from the populations (design D1). Tests: a melee-only unit gets null on both ranged axes and does not change a shooter's percentile; the weakest shooter reads 0%; a shooter with an unknown damage type stays in the population.
- [x] 1.2 Round the damage axes to two decimals before comparing (design D2). Test: Celestine and Anuphet tie at 4,005.6, while 4,005.75 and 4,006 do not.
- [x] 1.3 Limit the V1 parity test to Health, Armour and the melee axes (design D5), replace the melee-only 0% test, and add a Daras test (59 shooters, 2 and 14 lower, shown as 3% and 24%). Update the module comment, which says "unchanged". Verify `stat-radar.test.ts` passes.
- [x] 1.4 Check the result against the pinned datamine with a one-off script (not committed): Daras 3% and 24%, Sy-gex 0% vs infinite armour, and the six melee values in proposal.md. Record the counts here if the datamine has moved.

## 2. Comparison card

- [x] 2.1 In `stat-radar-card.tsx`, render "No ranged attack" in place of the bar and percentage, draw the point at the centre, and use the same text in the caption (design D4). Component tests for a melee-only character and a shooter.
- [x] 2.2 Add the info button and tooltip to both ranged rows (design D3). Tests: focus and tap show the text; the button has an accessible name; the other four rows have no button; a melee-only character has it too.

## 3. Localization and tour

- [x] 3.1 Add the "No ranged attack", tooltip and info-button label strings under `characterUnit.compare` in `library.json` with real en/de/es/fr translations; verify the i18n resource type tests pass.
- [x] 3.2 Update `characterUnit.tour.steps.compare.content` in all four locales to say that ranged damage is ranked among characters with a ranged attack. The desktop and mobile steps keep their targets; verify both in the unit page's tour tests.

## 4. Desktop verification

- [x] 4.1 At 768px or wider, on Daras, a melee-only character and Sy-gex: percentages, "No ranged attack", tooltip on hover and keyboard focus, and the tour's comparison step.

## 5. Mobile verification

- [x] 5.1 In a 420px same-origin iframe, with the mobile accordion confirmed: the same three characters, tooltip on tap, the rows in German and French without overflow, and the tour's comparison step.

## 6. Gates

- [x] 6.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check` and `openspec validate fix-ranged-stat-comparison --strict` pass.
