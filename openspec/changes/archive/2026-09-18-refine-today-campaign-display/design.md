## Context

See proposal.md — Why.

Two existing structures shape this change.

**The location label.** `useCampaignDisplay().fullLabel` (`shared/lib/use-campaign-display.ts`) composes a campaign's display name and its tier words into one string through a three-branch conditional, with a deliberate special case: the mirror base tier returns "Indomitus Mirror" with no difficulty word, because "Indomitus Mirror Standard" would read as redundant on a single line. `use-daily-raids.ts` stores that string as `DailyRaidLocationViewModel.fullName`, and three renderers pair it with `t("dailies:schedule.battle", { number: nodeNumber })`:

- `pages/dailies/ui/resource-card.tsx` — Today's and Bonus Raids' resource cards
- `pages/dailies/ui/today-page.tsx` — Today's Attempts
- `features/daily-raids/ui/location-row.tsx` — the Home page's Daily Raids widget

The same view model also carries `shortLabel` ("Fall of Cadia E 40"), which Raids Plan's compact chips use and this change does not touch.

**The active campaign event.** Two unrelated sources describe it, and neither is sufficient alone:

```
  WHICH campaign event                    WHEN IT ENDS
  --------------------                    ------------
  live-progress.activeCampaignEventId     events-calendar entry,
  (player-synced campaign group id;       definitionId "campaign-event"
   already read in use-daily-raids.ts     (startUtc/endUtc, but no
   to gate event-node eligibility)         campaign identity at all)
```

`getEventsActiveAt(now)` and `formatRelativeTime` already exist and need no changes.

## Goals / Non-Goals

**Goals:**

- One label rule that covers every descriptor shape with no special case.
- The three renderers stay three near-identical blocks or become one — either way, the label rule lives in exactly one place.
- The campaign-event status line never asserts something Today's own schedule contradicts.

**Non-Goals:**

- Changing Raids Plan's chips, the Create Goal shard-locations field, Character Lookup, or any other `fullLabel` consumer.
- Any change to which nodes are farmable. Event-node eligibility (`daily-raids-today` — "Only the active campaign event is farmable") is untouched; this change only explains it on screen.
- A live-ticking countdown.
- Reconciling the events calendar's projected campaign-event slots with the game's real event boundaries.

## Decisions

### `tierLabel` owns the tier-word composition; `fullLabel` is derived from it

Add `tierLabel(descriptor)` to `useCampaignDisplay`, returning only the tier words, and re-express `fullLabel` as `` `${name(d)} ${tierLabel(d)}` ``. This is output-identical for every descriptor shape, including the mirror special case:

| descriptor             | `name()`         | `tierLabel()` | joined                    | `fullLabel` today         |
| ---------------------- | ---------------- | ------------- | ------------------------- | ------------------------- |
| `standard1`            | Indomitus        | Standard      | Indomitus Standard        | Indomitus Standard        |
| `elite1`               | Fall of Cadia    | Elite         | Fall of Cadia Elite       | Fall of Cadia Elite       |
| `mirror1`              | Indomitus        | Mirror        | Indomitus Mirror          | Indomitus Mirror          |
| `eliteMirror1`         | Saim-Hann        | Mirror Elite  | Saim-Hann Mirror Elite    | Saim-Hann Mirror Elite    |
| event, `eventStandard` | Adepta Sororitas | Standard      | Adepta Sororitas Standard | Adepta Sororitas Standard |
| event, `eventExtremis` | Death Guard      | Extremis      | Death Guard Extremis      | Death Guard Extremis      |

`tierLabel` still branches, on the same three cases `fullLabel` does today:

| case       | tier words                                                              |
| ---------- | ----------------------------------------------------------------------- |
| `isEvent`  | the event difficulty word — "Standard" or "Extremis"                    |
| `isMirror` | "Mirror", plus " Elite" when the difficulty is elite — never "Standard" |
| otherwise  | the storyline difficulty word — "Standard" or "Elite"                   |

The mirror base tier's suppressed "Standard" is a real branch and survives this change: "Indomitus" / "Mirror 12" is the intended reading, and "Mirror Standard 12" would be the same redundancy the current code avoids. What this decision buys is therefore **one** composition of the tier words, not the elimination of branches — `fullLabel` stops composing them independently and becomes a join over `tierLabel`. The branch count is unchanged; the number of places that can disagree goes from two to one.

_Alternative considered:_ leave `fullLabel` alone and add `tierLabel` beside it. Rejected — two independent compositions of the same words drift apart, and this repo has already had one campaign-label bug of exactly that kind (tacticus-planner-apps#119, a dropped "Mirror" naming the wrong campaign).

### The view model carries two ready strings; the renderers stay dumb

`DailyRaidLocationViewModel` replaces `fullName`/`nodeNumber` with:

```
  campaignName  = name(descriptor)                                  "Fall of Cadia"
  nodeLabel     = `${tierLabel(descriptor)} ${nodeNumber}`          "Elite 40"
                  + (challenge ? "B" : "")                          "Extremis 12B"
```

Both are fully localized at construction, in the hook that already holds the bound `t`. Each renderer drops its `t("schedule.battle", …)` call and renders `location.nodeLabel` verbatim, which is why `dailies:schedule.battle` can be deleted outright.

**The no-descriptor fallback loses a line rather than inventing one.** `campaignDescriptor` returns `undefined` for a battle whose group id the catalog does not recognize, and both fields are built from it. Today that case still renders two lines — the battle id, then "Battle B1" from `nodeNumber ?? battleId` — but with `schedule.battle` deleted there is no localized string left to put on the second line, and a bare number with no tier word is exactly what this change removes. So the fallback is: `campaignName` = the raw battle id, `nodeLabel` = empty, and each renderer omits the second line when it is empty. A battle id like `B1`/`AME12` already encodes its campaign and node, so nothing is lost by not restating it.

_Alternative considered:_ a shared `<CampaignLocationLabel>` component in `features/daily-raids/ui`, deduplicating the markup as well as the label logic. It is the better factoring if a fourth consumer ever appears, but today it trades three two-line JSX blocks for a new file, a new prop type, and a new import in each of the three call sites — a larger diff for the same rendered output. The label rule is already centralized by this decision; only the surrounding flex markup is duplicated, and it differs slightly per call site (icon sizes, test ids, badge contents) anyway. Revisit when a fourth caller lands.

_Note:_ `nodeNumber` is dropped from the view model rather than kept alongside `nodeLabel`. Nothing else reads it (`shortLabel` is composed in the same hook from the battle record directly), and V2 is pre-production, so per `tp-destructive-changes-policy` no compatibility shim is warranted.

### `activeCampaignEventId` is authoritative for "active"; the calendar only supplies the end time

```
                       calendar has an active "campaign-event" slot?
                            yes                      no
                   +------------------------+------------------------+
  activeCampaign   | name + time remaining  | name, no time shown    |
  EventId set,     | (the normal case)      |                        |
  resolves         |                        |                        |
                   +------------------------+------------------------+
  set, does NOT    | "a campaign event is   | "a campaign event is   |
  resolve to a     |  active" + time        |  active", no time      |
  descriptor       |                        |                        |
                   +------------------------+------------------------+
  not set          | "Campaign event is     | "Campaign event is     |
  (null/absent)    |  not active"           |  not active"           |
                   +------------------------+------------------------+
```

The bottom-left cell is the interesting one: the calendar says an event is running, and Today still says none is. That is correct and intended. `activeCampaignEventId` is the exact signal the raid engine gates event-node eligibility on, so a status line driven by anything else could tell the player an event is live while Today refuses to schedule a single one of its nodes. The status line's job is to explain the schedule in front of the player, not to report the game's global calendar.

The top-right cell degrades by omission: the campaign is named, the time is simply absent. Campaign-event calendar entries are projected placeholders (`game-events-calendar` — "Campaign Event and Incursion placeholders require no confirmation step"), so their boundaries can drift from the game's real ones; showing no time is better than showing a wrong one.

_Alternative considered:_ calendar-authoritative, or requiring both. Both make the bottom-left cell claim an event is active that Today will not farm.

### A page-local hook, not a wider feature view model

The status line reads `getLiveProgress()` and `getEventsActiveAt()` from a hook co-located with Today under `pages/dailies/ui/`, rather than adding fields to `useDailyRaids`'s ready view model. `useDailyRaids` lives in `features/daily-raids` and is shared with the Home widget, which has no use for this; and reading `getLiveProgress()` page-locally via `useLiveQuery` is the established pattern here (`pages/dailies/ui/guild-raids/use-guild-raids-view-model.ts`, `pages/home/ui/token-availability/token-availability.tsx`, `pages/goals/model/insights/use-plan-insights.ts`).

Resolving the id to a display name reuses `campaignDescriptor(activeCampaignEventId, "Standard")` → `nameKey` → `useCampaignDisplay().name(...)`, the same resolution `pages/progress/model/campaign-events.model.ts` already performs for the Campaign Events page. The "Standard" argument only selects a tier for descriptor lookup; `nameKey` is the same for both tiers of a group.

**`campaignDescriptor` returns `undefined` and the result must be guarded.** It has no entry for a group id absent from its `eventNames` map, and `activeCampaignEventId` arrives from synced _player_ data, not the catalog — so a campaign event that goes live in-game before a catalog release names it produces exactly that. This is a strictly weaker guarantee than the Campaign Events page's, which starts from a catalog-sourced `definition.groupId` and still guards (`campaign-events.model.ts:54`: `descriptor?.nameKey ?? definition.groupId`). An unguarded `.nameKey` here would throw and take Today's whole header down on the first unrecognized event.

The status line treats an unresolvable id as **detected but unnamed**, not as "no event": an event _is_ active and Today _is_ gating event nodes on it, so claiming none is active would be the one thing this decision exists to prevent. It renders generic "a campaign event is active" copy, with the remaining time when the calendar has it, and never shows a raw group id.

### The countdown is coarse and does not tick

The remaining time renders through the existing `formatRelativeTime(endUtcMs, language)`, whose coarsest-unit output ("in 3 days", "in 5 hours") does not change often enough to justify a timer, matching how the Guild Raids season banner and Home's token countdowns already present remaining time. The value recomputes on render and whenever the underlying Dexie tables change. No `setInterval`, no re-render loop.

The end-time math is the same shape as `seasonEndCountdown` in `pages/dailies/ui/guild-raids/guild-raid-countdowns.ts` (nullable timestamp → pending/due/unavailable). That file is page-local to `pages/dailies` and so is this hook, so it is imported directly rather than copied.

### Desktop and mobile place the status block differently

```
  mobile (<768px)                      desktop (>=768px)
  +------------------------------+     +-------------------------------+------------------------------+
  | Today's raids        [E] [S] |     | Today's raids         [E] [S] | Campaign event               |
  +------------------------------+     | [==========--------]      42% | [icon] Adepta Sororitas      |
  | [==========--------]     42% |     |                               |         · ends in 3 days     |
  +------------------------------+     +-------------------------------+------------------------------+
  | Campaign event               |
  | [icon] Adepta Sororitas      |
  |        · ends in 3 days      |
  +------------------------------+
```

One element, one DOM position, a Tailwind reflow of the existing header block into a `md:` flex row
of two `md:w-1/2` halves — not two conditionally-rendered variants. The status block follows the
energy half in DOM order, so it reads second stacked on mobile and sits right of it on desktop; the
energy bar's percentage stays at its own half's trailing edge. Each half owns its full width, so a
long campaign name wraps inside the trailing half rather than shortening the bar.

The block carries its own heading at the schedule heading's weight, which is what makes the two
halves read as peers rather than as a caption tacked onto the energy bar, and the detected event's
campaign icon (the group's Standard tier — both tiers share one icon stem) sits beside its name.

Because it is a single element in a single DOM position, Today's Joyride tour needs one step
targeting one `data-testid`, shared by both the desktop and mobile step arrays — consistent with
`today.tutorial.tsx`, whose steps are already identical across both.

## Risks / Trade-offs

- **A player whose sync is stale sees "Campaign event is not active" while an event is genuinely running.** → Accepted and intended: Today's schedule is in exactly the same state, excluding every event node, so the line is an accurate description of the page. The existing player-data sync affordance is the remedy, and the line's copy states a fact about detection, not about the game.
- **A projected campaign-event slot's `endUtc` may not match the game's real end.** → The time is only ever rendered when a slot is actually active now; when the calendar and the player's synced id disagree about a window, the time is omitted rather than guessed.
- **Dropping `schedule.battle` and `fullName`/`nodeNumber` breaks any consumer this change missed.** → Both are repo-internal, and `pnpm typecheck` catches every `fullName`/`nodeNumber` reader; the i18n key is verified removed by grep across `apps/web/src` before deleting it from the four locale files. Existing tests in `dailies-pages.test.tsx`, `raid-schedule.test.tsx`, and `use-campaign-display.test.ts` assert the current strings and are updated in the same tasks.
- **`tierLabel` and `fullLabel` could still drift if a future descriptor shape is added to one and not the other.** → `fullLabel` is defined _in terms of_ `tierLabel`, so a new shape handled in `tierLabel` propagates automatically; a regression test asserts the join identity across every descriptor shape in the table above.
