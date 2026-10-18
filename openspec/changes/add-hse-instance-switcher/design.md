# Design

## Context

`useActiveHomeScreenEvent` loads calendar entries from now to +400 days and `selectActiveHomeScreenEvent` returns `{ active, next, upcoming }`; `selectHomeScreenEventListTarget` picks what the lists compute for. Past entries are never loaded. The served `events-calendar` is date-indexed with multi-day entries repeated per date and deduplicated by `dedupeCalendarEntries`; authored occurrences carry `occurrenceId`, projected placeholders carry `occurrenceId: null`.

## Decisions

### D1. Instance key

An instance is keyed by `occurrenceId` when present, else `${definitionId}@${startUtc}` (placeholders have no id but are unique by definition and start). The key is what the URL carries. Keys are opaque to the user.

### D2. One instance list, derived once

`listHomeScreenEventInstances(entries, definitionsById, nowMs)` returns every HSE entry with `{ key, entry, status: "running" | "upcoming" | "past" }`, ordered by `startUtc` ascending then definition id. The existing `selectActiveHomeScreenEvent` keeps computing the default (its overlap rule is unchanged) from the same list. The switcher, the Previous / Next buttons and the page all read this one list; no second selection path.

The hook loads entries from 400 days back to 400 days ahead (the calendar holds a few months of history today, so the cost is small) and exposes `instances` next to `active`, `next`, `upcoming`.

### D3. URL owns the selection; the page owns resolution

`HsePage` reads `event` from `useSearchParams`. Resolution: a key found in the list wins; a missing or unknown key falls back to the default (running, else next) and an unknown key is removed with `replace` so Back does not loop. Picking the default instance clears the param, so a bookmark of the plain tab always means "current". A key is only judged unknown against a synced calendar: on a fresh device the init gate renders the page while the first catalog sync downloads, when the tables are empty, so `useActiveHomeScreenEvent` stays `loading` until `hasEventsCalendarSynced()` (the `events-calendar` and `event-definitions` metadata rows exist, the guard `use-npcs-catalog.ts` uses) and a shared `?event=` link is not stripped. The Dailies layout state (project selection) is untouched; the param is HSE-only and is not carried to sibling tabs.

### D4. What each status renders

| Selected            | Status line                                                   | Lists and raid header controls |
| ------------------- | ------------------------------------------------------------- | ------------------------------ |
| running, with rule  | name, time left                                               | yes                            |
| running, no rule    | name, time left, "does not earn points from campaign raiding" | no                             |
| upcoming, with rule | name, start date, countdown                                   | yes, preview banner            |
| upcoming, no rule   | name, start date, countdown                                   | no                             |
| past                | name, "Ended on" date                                         | no                             |

`selectHomeScreenEventListTarget` becomes `selectListTarget(instance)` returning `{ entry, live }` for running or upcoming rule-bearing instances only.

### D5. Desktop and mobile

Desktop (>= 768px): the switcher sits on the title row, `[<] [select] [>]`, left of the raid header controls. Mobile: the switcher takes its own full-width row under the title, arrows at both ends, so the select keeps a usable width. Same component, layout by container classes; the tour targets the same `data-testid="hse-event-switcher"` on both.

### D6. Live tick

The 60-second tick still re-derives the default. When the URL pins an instance it stays pinned across boundaries; its status (running to past) updates on the tick.

## Risks

- A long history makes the select long. Past instances are listed newest first and the list is grouped; if it grows past a few dozen entries a "show older" cut can follow.
