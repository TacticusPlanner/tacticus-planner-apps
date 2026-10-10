## Why

The Campaign Events progress page (`/progress/campaign-events`) exists so players can correct their event progress for daily raid planning, but manual edits made there never reach daily raids: eligibility reads only the synced `campaign-events-progress` chunk, so a player without synced data for a track gets no event nodes even after filling that track in. The page is also hard to use — six controls per number, a "Synced" badge that shows even when nothing was synced, every event ever released listed expanded in no order, cryptic "3B" challenge labels, a Save button far from the edits, and raw API error text (issue #160).

## What Changes

- Campaign node eligibility SHALL resolve each event track's progress as the manual override when one exists, else the synced entry, else no progress — the same resolution the progress page displays. Because eligibility is shared, this reaches every surface that picks farm nodes: Today, Raids Plan, the Home raids widget and event tab, Goals, Insights and per-project estimates. Only the active campaign event is affected, since eligibility already excludes every other event.
- A **Current event** section at the top of the page shows the event identified by `live-progress.activeCampaignEventId`, when one is active.
- Every other event is a collapsible card whose collapsed row summarises each track (for example `Standard 12/30 · Extremis 0/30 · Challenges 2/5`) with its synced/manual/no-data source.
- The event list is ordered unfinished first, with an option to hide completed events that is remembered per browser.
- Each track's regular battles are edited with one compact control: a stepper, a Max action and the progress bar acting as the slider. The separate slider, number input and progress bar are removed. "Reset to synced" appears only when a manual value exists.
- The source state is honest for both regular battles and challenges: manual, synced, or "No synced data".
- Challenge nodes are labelled "Challenge 1…n" in track order, with the node id available as a tooltip.
- A sticky unsaved-changes bar with Save and Discard replaces the lone header Save button, and leaving the page (in-app navigation or closing the tab) with unsaved edits asks for confirmation.
- Save errors, including non-409 API errors, show translated messages only.
- The draft / revisioned-save / 409-conflict / dirty-tracking logic becomes a generic shared hook, and the unsaved-changes bar a shared component, so other override pages (Onslaught) can adopt them later. Migrating the Onslaught page is not part of this change.
- The page gets an onboarding tour covering its desktop and mobile forms.

## Capabilities

### New Capabilities

- `campaign-event-progress-editing`: The Campaign Events progress page — current-event section, collapsible event cards with summaries, unfinished-first ordering and completed filter, compact per-track editing, honest source states, readable challenge labels, sticky save/discard with leave protection, translated errors, and responsive layout.

### Modified Capabilities

- `daily-raids-today`: "Only the active campaign event is farmable" changes its event node-reached source from the synced `campaign-events-progress` chunk alone to the effective progress (manual override, else synced, else none). Raids Plan inherits this through its existing "shares Today's campaign eligibility" requirement, so `daily-raids-plan` needs no delta.
- `partial-goal-planning`: "Every estimate surface uses one campaign node-eligibility rule" names _synced_ event progress as the reached-node source; it changes to the same effective progress, so Goals, Insights and per-project estimates keep agreeing with Today and Raids Plan.
- `daily-raids-home-screen-event` needs no delta: it already defers to "the existing `availableCampaignBattles` eligibility", which now receives effective progress.

## Impact

- `apps/web/src/fsd/pages/progress` (campaign events page, event card, model, tests, new tutorial).
- `apps/web/src/fsd/entities/player-data-override` (effective-progress resolver exported through its public API).
- `apps/web/src/fsd/features/daily-raids`: a new `use-effective-campaign-event-progress.ts` loads the overrides and merges them over synced progress. `use-eligible-campaign-battles.ts` uses it for eligibility and exposes ready/error flags. `use-daily-raids.ts` and `use-home-screen-event-locations.ts` gate on those flags, with Daily Raids following the existing Onslaught override precedent for loading and errors.
- `apps/web/src/fsd/pages/goals`: no source change. The Goals catalog picks up effective progress through `useEligibleCampaignBattles`. Its tests' entity mocks gain the overrides query.
- `apps/web/src/fsd/shared` (generic revisioned-draft hook in `shared/api`, unsaved-changes bar, leave-page guard).
- Locale files under `apps/web/public/locales/*/common.json` (new and removed `progress.events.*` keys, tour copy).
- No API change: the campaign-event override endpoints and their revision/409 contract already exist, so there is no `tacticus-planner-api` companion change.
- Overlap: `correct-campaign-event-end-countdown` also modifies `daily-raids-today`, but a different requirement ("Today states the detected campaign event and its remaining time"); whichever archives second syncs against the updated spec.
