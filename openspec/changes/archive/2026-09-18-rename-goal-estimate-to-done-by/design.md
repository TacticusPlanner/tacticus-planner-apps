## Context

See proposal.md - Why. `EstimateCell` (`apps/web/src/fsd/pages/goals/ui/goals-board/goals-list.tsx:97-122`) is the single component rendering both the desktop table cell and the mobile card's inline estimate — it already receives `EstimateOutcome` (from `@/features/goal-farming`), which already carries `date` (an ISO `YYYY-MM-DD` string, `estimate.ts`'s `formatDate(inclusiveCompletionDate(...))`) and `days`. Today `date` is only used as the raw `title` attribute; the visible text is `t("goals.estimate.days", { days })` → "12d". The column header comes from `t("goals.columns.estimate")` in `common.json`, currently "Est.".

## Goals / Non-Goals

**Goals:**

- Make the Goals list's estimate column self-explanatory as a completion point, reusing already-computed data.

**Non-Goals:**

- Any change to `estimateGoal`/`estimatePlan`/`EstimateOutcome`'s shape or math — `date` and `days` are already correct per `goal-farming-estimates`.
- The goal-detail sheet's separate "Estimate" section (see proposal.md).
- A rich tooltip breakdown like V1's `doneByTooltip` — out of scope; this change only makes the date visible, it doesn't add new explanatory content beyond what V1's column itself shows.

## Decisions

**Format the date inline with `Intl.DateTimeFormat`, not a new shared helper module.** The proposal anticipated needing a new formatting helper since no `getEstimatedDateShort`-equivalent exists in this repo, but a closer look at `pages/home/ui/events-calendar/*` shows the repo's actual existing pattern for this exact need: `new Intl.DateTimeFormat(i18n.resolvedLanguage, { month: "short", day: "numeric" })`, memoized locally in the component with `useMemo`. `EstimateCell` follows that same precedent directly rather than introducing a new shared module for a single call site — matches the codebase's established approach and needs no new file.

**Parse `estimate.date` (`YYYY-MM-DD`) as UTC, not local-time midnight.** `new Date("2026-09-28")` parses as UTC midnight in every JS engine; formatting it with a `timeZone` left at the formatter's default (the viewer's local zone) can roll it back a day for viewers west of UTC. `estimate.ts`'s own `formatDate`/`addDays` already operate in UTC (`setUTCDate`, `toISOString`), so the display side reads the same three `YYYY-MM-DD` components directly (`Date.UTC(year, month - 1, day)` before formatting) rather than trusting default local-time parsing, keeping the displayed date consistent with the value already shown account-wide in Raids Plan's day columns.

**Keep the existing `title={estimate?.date}` tooltip as-is.** It's now redundant with the visible date but harmless and cheap to leave; removing it is unrelated to this change's scope (making the date visible), and a decision to build a richer tooltip is explicitly a non-goal above.

**No desktop/mobile branch in the cell markup.** Per the confirmed scope, both breakpoints get the identical two-line block; `EstimateCell` needs no `useIsMobile()` check.

## Risks / Trade-offs

[Two-line cell increases the mobile card row's height next to the goal-type badge] → Accepted per explicit scope decision (same treatment everywhere); no mitigation needed, matches user-confirmed design intent over a compact-mobile alternative.

[i18n: existing `goals.estimate.days` key ("{{days}}d") becomes only the caption's day count, not the whole cell's text — a locale reviewer skimming just that key's value might miss that it's now a caption, not a label] → Mitigated by also updating the key's surrounding string to read as a caption ("in {{days}} days") rather than reusing the terse "{{days}}d" form for both the old and new contexts; task list calls out translating the new/changed strings in every locale, not just English.

## Migration Plan

No data migration; pure frontend presentation change. Ships as a normal deploy — no dependency on the companion `fix-daily-raid-location-recommendations` change or any API work.
