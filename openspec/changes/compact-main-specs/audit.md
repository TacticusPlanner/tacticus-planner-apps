# OpenSpec main-spec compaction audit — tacticus-planner-apps

Scope: `tacticus-planner-apps/openspec/specs/*/spec.md`. Paths below are relative to that directory. Line numbers are as of 2026-10-28.

Read-only. Every entry was checked against the spec text.

Confidence is high unless an entry is marked **(low)**. Low entries are real overlaps that save little, or that depend on a judgement call. Skip them if in doubt.

Notation:

- **MODIFIED** gives the requirement header verbatim.
- "drop scenario X" means remove that scenario inside the MODIFIED requirement.
- **REMOVED** entries give their reason.
- OpenSpec requires at least one scenario per requirement. Every proposal below leaves at least one.

---

## 1. Requirements specified twice (D)

### The eight repeated requirement names

| Name                                                    | Files                                                              | Verdict                                                                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Desktop and mobile layouts                              | legendary-event-master-table:120, quest-event-tracker:148          | Page-specific. Different pages and content. Keep both.                                                                              |
| Desktop and mobile present distinct layouts             | npc-library:258, raid-boss-library:271                             | Page-specific (NPC tiles and combobox; boss tabs and grouped Select). Keep both. raid-boss-library restates its own L9; see D27.    |
| Distinct desktop and mobile presentations               | daily-shop-recommendations:120, library-shops:104                  | Page-specific (recommendation cards vs slot browser). Keep both.                                                                    |
| Estimates degrade by data state                         | legendary-event-clear-estimates:89, quest-event-clear-estimates:94 | Different datasets (horde-mode-tiers vs npcs/unit-power) and different fallbacks. Keep both. LE copy overlaps eligibility; see D14. |
| The page has an onboarding tour covering both platforms | npc-library:277, raid-boss-library:357                             | Page-specific step lists. Keep both. raid-boss-library has an internal duplicate; see D27.                                          |
| Sticky unsaved-changes bar                              | campaign-event-progress-editing:165, onslaught-progress-entry:105  | Same rule on two pages. See D1.                                                                                                     |
| Save conflicts and errors are translated                | campaign-event-progress-editing:206, onslaught-progress-entry:142  | Same rule on two pages. See D1.                                                                                                     |
| Leaving with unsaved edits asks first                   | campaign-event-progress-editing:229, onslaught-progress-entry:158  | Same rule, word for word. See D1.                                                                                                   |

**D1. Unsaved-changes editor pattern, stated in two page specs** — campaign-event-progress-editing and onslaught-progress-entry

- The three requirements above are the same rule: identical text for "Leaving…", and the same sticky-bar and revision-conflict rules, with only nouns changed (event card vs alliance card).
- No shared capability owns the pattern today. `api-error-handling` owns only issue-code handling, and `goal-edit-dialog` has its own dialog-scoped guard.
- Smallest compaction: none without adding a capability. Recommended only if you accept a new capability `progress-editor-draft` that holds the three requirements once. Each page spec would then keep one line: "The page's draft follows `progress-editor-draft`", plus its page-specific nouns and scenarios.
- If you would rather not add a capability, leave these as they are. They are not contradictory.
- **(low)** Do not mix this into the cleanup unless you want the new capability.

_(D2 onwards are numbered by area.)_

### App shell, account, auth, errors

**D2. account-menu restates its own identity header (stale copy)** — account-menu/spec.md:9 vs :56

- `### Requirement: Desktop account menu shows the signed-in user's identity above its actions` is a strict subset of `### Requirement: Desktop account card is organised into identity, preferences, account, and session sections`.
- Its action list "(importing from V1, managing the account, and signing out)" is outdated.
- Its scenario "Existing menu actions are unaffected" is change-delta text: "the same actions available before this change".
- Its sentence "This identity header SHALL NOT be interactive" conflicts with the edit button.
- Action: **REMOVED** `Desktop account menu shows the signed-in user's identity above its actions`. Reason: covered by "Desktop account card is organised into identity, preferences, account, and session sections".

**D3. No sidebar account trigger** — account-menu/spec.md:25 vs app-navigation/spec.md:436

- account-menu: "No duplicate account trigger SHALL remain in the sidebar."
- app-navigation `Desktop global bar…`: "Search and account access SHALL no longer appear in the sidebar."
- Action: **MODIFIED** `### Requirement: Desktop global bar account trigger shows the account avatar`. Delete the sentence "No duplicate account trigger SHALL remain in the sidebar." app-navigation is canonical.

**D4. Search launcher has no tooltip** — app-navigation/spec.md:39 vs :482

- `A desktop keyboard shortcut toggles navigation search` already says "The Search button SHALL NOT show a hover tooltip" and requires the shortcut hint.
- Action: **MODIFIED** `### Requirement: Persistent desktop section menu lists the active section's child pages`. Drop scenario "Search launcher has no tooltip".

**D5. Dailies parent live indicator, stated three times** — app-navigation/spec.md:567 / :753 / :767

- HRE requirement: "The parent Dailies entry SHALL show the indicator while an HSE or an HRE is running."
- Quest requirement: "…while an HSE, an HRE or a quest is running; this supersedes the HSE-or-HRE rule."
- Action:
  - **MODIFIED** `### Requirement: Navigation shows a live indicator for a running Hero Release Event`. Delete the sentence "The parent Dailies entry SHALL show the indicator while an HSE or an HRE is running." Keep its scenarios: the "Only an HRE running" Dailies assertion still holds under the Quest rule.
  - **MODIFIED** `### Requirement: Navigation shows a live indicator for a running Quest Event`. Replace "; this supersedes the HSE-or-HRE rule." with ".".
  - Keep the HSE copy: it adds the collapsed-menu and bottom-bar reason.

**D6. Anonymous My Game shows only Collection** — app-navigation/spec.md:632 vs :695 **(low)**

- Action: **MODIFIED** `### Requirement: Events is a top-level authenticated section with Legendary Events as its child`. In scenario "Anonymous users do not see Events", the THEN becomes "**THEN** Legendary Events is absent, like Plan and Guild". Owner: `A section can mix anonymous and sign-in-only children`.

**D7. Submit Feedback search action, restated in userjot-widget** — userjot-widget/spec.md:144 vs app-navigation/spec.md:309, :343, :383

- app-navigation owns these rules:
  - availability for signed-in and anonymous users, disabled with an explanation when not ready (L309)
  - "close and reset search…, Submit Feedback SHALL open the existing widget without posting feedback" (L343)
  - "release focus/pointer restrictions before another form/widget/tour opens" (L383)
- Action: **MODIFIED** `### Requirement: Search quick action opens the feedback widget`.
  - Replace the body with: "The Submit Feedback quick action in desktop navigation search and mobile Menu search (availability and search hand-off: see `app-navigation`) SHALL open the same feedback/roadmap/updates widget, retaining verified identity, anonymous fallback, theme, language, and suppression of proactive UI, and SHALL NOT open Conversations."
  - Drop scenarios "Desktop feedback from search" and "Mobile feedback from search".
  - Keep "Identification failure preserves anonymous feedback".

**D8. Feedback identity refresh after a name change** — account-display-name/spec.md:42 vs userjot-widget/spec.md:95

- account-display-name: "Successful save SHALL refresh the account header/avatar and feedback identity…".
- userjot-widget: "After a successful display-name update, it SHALL fetch a fresh token and refresh the widget identity within the session", plus scenario "Editing name refreshes identity".
- Action: **MODIFIED** `### Requirement: Manage Account edits the name`.
  - Replace "refresh the account header/avatar and feedback identity in the same signed-in session" with "refresh the account header/avatar in the same signed-in session (feedback identity: see `userjot-widget`)".
  - In scenario "Name change updates public identity", the THEN becomes "**THEN** the account menu/avatar use `Commander Ada` without requiring sign-out".

**D9. Edit-name control in the account menu** — account-display-name/spec.md:50 vs account-menu/spec.md:58 ("an edit button that opens Account settings on its profile tab", scenario "Edit button opens the profile tab"; the mobile drawer shares the layout)

- Action: **MODIFIED** `### Requirement: Manage Account edits the name`. Drop scenario "Name edit is one tap from the user menu".

**D10. Loading identity while the account resolves** — account-display-name/spec.md:62 vs account-menu `### Requirement: Account identity shows a loading state until the planner account is known`

- Action: **MODIFIED** `### Requirement: Identity is neutral until a name is set`.
  - Replace "While the account is still loading the shell SHALL show a loading identity rather than the neutral copy, since whether a name is set is not yet known." with "While the account is still loading, the loading identity of `account-menu` applies instead of the neutral copy."
  - Drop scenario "Name not yet known".

**D11. Silent-attempt failure fallback** — redirect-authentication/spec.md:61 vs silent-sign-in "Failed restore falls back to manual sign-in without error" and "API token requests coordinate with the restore attempt"

- Action: **MODIFIED** `### Requirement: Silent session checks and token refresh are not blocked by the identity provider's cross-origin isolation policy`.
  - Replace "When a silent attempt fails for any reason, the system falls back to interactive sign-in rather than surfacing an error for the background attempt." with "What happens after a silent attempt fails is defined in `silent-sign-in`."
  - In the scenario about browser privacy restrictions, cut the THEN's trailing ", and the system falls back to interactive sign-in".

**D12. "Failure handling is unchanged"** — api-contract-sync/spec.md:62 vs api-error-handling/spec.md:9 and its conflict-adoption requirement

- This is a change-era "no regression" requirement, and its scenario reads "exactly as before the change".
- Action: **REMOVED** `### Requirement: Failure handling is unchanged`. Reason: the error shape is owned by `api-error-handling`; this restated it as a non-regression check for the codegen change.
- The same item is listed as L-type in L10.

**D13. v1-profile-import: unselected parts are excluded, stated twice** — v1-profile-import/spec.md:197 vs :314

- Action:
  - **REMOVED** `### Requirement: Each selected part's outcome is reported`. Reason: covered by "An unselected part occupies no row in the result", whose scenario "Selected parts each keep a row" already asserts the positive half.
  - **MODIFIED** `### Requirement: An unselected part occupies no row in the result`. Replace "The result SHALL list only the parts the import was asked to process" with "The result SHALL report an outcome for every part the import was asked to process, and only those parts".

**D13b. MoW ability panel missing-text state** — mow-unit-details/spec.md:157 vs character-unit-details/spec.md:247

- mow-unit-details repeats the character sentence word for word ("When the game text has no complete rules text… "Rules text isn't in the planner yet."…"), even though its requirement already says "behaving as the character unit page's ability panels".
- Action: **MODIFIED** `### Requirement: MoW ability panels`. Replace that sentence with "A panel without complete rules text SHALL show the character unit page's missing-text state."

**D13c. Rank-up tab synced default range** — character-unit-details/spec.md:491. The requirement already defers to "the existing range-default… rules" (`character-lookup-range-defaults` "Synced character data seeds an advancing lookup range").

- Action: **MODIFIED** `### Requirement: Rank-up materials tab`. Drop scenario "Synced default range". Its THEN also carries the "as before this change" leftover (L5).

**D13d. Relic ability icon check on regeneration** — equipment-item-icons/spec.md:52 vs ability-rules-text "The rules-text namespace is reproducible" (exit non-zero when a relic ability has no icon)

- Action: **MODIFIED** `### Requirement: Item and relic ability icons load by exact catalog id`. Drop scenario "Relic ability icon coverage is checked on regeneration".
- Note that the two disagree on the file extension: `.png` here, `.webp` in ability-rules-text. Check which is right before dropping.

**D13e. Range controls: desktop/mobile consistency restated** — character-lookup-range-controls/spec.md:81 vs :64 (`Desktop and mobile rank-range editing stay consistent`) **(low)**

- Action: **MODIFIED** the requirement containing L81 (`A range edit that stays valid keeps the other side`). Delete "This SHALL behave the same on the desktop slider and the mobile selects."

**D13f. client_error payload** — product-analytics/spec.md:127 scenario vs client-error-reporting "Captured errors are reported only for identified users" **(low)**

- Action: **MODIFIED** `### Requirement: Client errors are a declared event`. Replace scenario "Error while editing a goal" with:
  ```
  #### Scenario: client_error is the only error-derived event
  - **WHEN** an uncaught error occurs for an identified user
  - **THEN** exactly one `client_error` event is reported and no other error-derived event is sent
  ```

### Legendary / Quest events, power

**D14. Character power is the single power figure** — character-combat-power/spec.md:14 vs unit-power/spec.md:11

- Action: **MODIFIED** `### Requirement: Character in-game power`. Delete "It is the single character power figure in the app: every feature that shows, sums, ranks or compares character power SHALL read it." `unit-power` "One power formula across the app" owns this rule.

**D15. LE leaderboard Clears rendering, stated in both clear-estimates and eligibility** — legendary-event-clear-estimates/spec.md:91 vs legendary-event-eligibility/spec.md:102

- eligibility already specifies "~n" owned, "—" locked or unknown, a placeholder dash while loading, absent when estimates are unavailable, and the "roster not synced" note.
- Action: **MODIFIED** `### Requirement: Estimates degrade by data state` (legendary-event-clear-estimates).
  - Replace the body with: "When the `horde-mode-tiers` dataset is absent, estimates SHALL still be shown with every character untiered. When it failed to load, no estimate SHALL be shown anywhere and team depths SHALL behave exactly as manual-only depths. While the dataset or the lane's battle powers are loading, or when the roster could not be read, no estimate SHALL be shown. Each surface's rendering of these states (leaderboard: `legendary-event-eligibility`) is specified with that surface."
  - Drop scenario "Locked unit on the leaderboard".
  - Before applying, check the body against the current text so that no state is lost. See also contradiction X7.

**D16. Objective icon mapping** — legendary-events-hub/spec.md:212 vs legendary-event-synced-progress/spec.md:116 (`Objective icons use the V1 icon set`, the detailed superset)

- Action: **MODIFIED** `### Requirement: Objective labels and icons are derived from the catalog filter`. Replace "Each objective SHALL carry an icon: trait, damage-type or faction icon for those kinds; a hits glyph for Min/Max hits; a ranged or melee glyph for attack type." with "Each objective SHALL carry its icon (`legendary-event-synced-progress`)."

**D17. Unknown-run state restated piece by piece** — legendary-event-run-resolution/spec.md:95. Each clause is owned elsewhere:

- token supply: run-forecast:13, scenario "Unknown run"
- reward projection: reward-projection:14, scenario "Unknown run counts no future inputs"
- depths on run 1: teams:53
- no run number: run-resolution:61, in the same file
- Action: **MODIFIED** `### Requirement: The unknown state plans one conservative run`.
  - New body: "In the unknown state the run forecast header SHALL read "By the end of the next run: …". The token supply (`legendary-event-run-forecast`), reward projection (`legendary-event-reward-projection`) and clear depths (`legendary-event-teams`) follow their own unknown-run rules."
  - Scenario "Forecast for an unknown run": the THEN becomes "**THEN** its header reads "By the end of the next run: …", and no run number appears on the Overview".

**D18. Next token card "for when run N starts" suffix** — legendary-event-token-plan/spec.md:113 vs legendary-event-run-resolution:81 (`The Next token card names the next run`, the superset)

- Action: **MODIFIED** `### Requirement: Next token card heads the Overview tab`. Replace "When the event is upcoming it SHALL add "for when run N starts"." with "When the event is upcoming it SHALL add the next-run suffix of `legendary-event-run-resolution`."

**D19. How marks steer the token plan** — legendary-event-synced-progress/spec.md:135 vs legendary-event-token-plan:16–20

- Action:
  - **MODIFIED** `### Requirement: Uncleared objectives can be marked Maybe clear or Stop here`.
    - Replace "They SHALL steer the token plan (see `legendary-event-token-plan`): a Stop here cell is never planned and a Stop here defeat-all stops planning on that lane at that battle; a token that clears a Maybe clear cell is planned but flagged." with "They SHALL steer the token plan as `legendary-event-token-plan` specifies."
    - Drop scenario "Marks steer the token plan". It equals token-plan's "Stop here on defeat-all stops the lane there", plus "Marks do not change points".
  - **MODIFIED** `### Requirement: Token plan from synced progress, teams, depths and marks`. Replace the bullet "Only marks in effect count (`applicableAnnotations`: a mark on a cell sync shows cleared is ignored)" with "Only marks in effect count (`legendary-event-synced-progress`)."

**D20. Plan write success/conflict/failure handling** — legendary-event-run-inputs/spec.md:55 and legendary-event-synced-progress/spec.md:135 vs legendary-event-teams:112 (`The plan is persisted through the API with one revision`)

- Action:
  - **MODIFIED** `### Requirement: Run inputs save per run through the plan revision`. Replace "On success the returned plan SHALL replace the cached plan. On a stale-revision conflict the plan from the response SHALL replace the cached plan, the "plan reloaded" toast SHALL show, and the drawer SHALL show the adopted values. Any other failure SHALL restore the stored values and show a translated error toast." with "Success, conflict and failure SHALL follow the plan write queue (`legendary-event-teams`, "The plan is persisted through the API with one revision"); after a conflict the drawer SHALL show the adopted values."
  - **MODIFIED** `### Requirement: Uncleared objectives can be marked Maybe clear or Stop here`. Replace "On a 409 the queue SHALL adopt the returned plan with the existing "reloaded" toast; on another error the mark SHALL roll back with a translated error toast." with "Conflicts and failures follow the plan write queue (`legendary-event-teams`)."

**D21. Event page tour order restated outside the hub** — owner: legendary-events-hub/spec.md:262 (`The Events pages have Joyride tours`)

- Action:
  - **MODIFIED** `### Requirement: The run inputs drawer is in the event page tour` (legendary-event-run-inputs:74).
    - Body becomes "The event page tour's Run inputs step SHALL explain that missions and packs the game does not report feed the reward outlook."
    - Keep one scenario that asserts the copy, rewritten if needed; drop "Tour step order".
    - Blocked by contradiction X8 (stale hub order). Fix the hub order list in the same change.
  - **MODIFIED** `### Requirement: Eligibility leaderboard section on the event page`. Drop scenario "Tour step" (legendary-event-eligibility:155).
  - **(low)** **MODIFIED** `### Requirement: Synced progress grid section on the event page`, scenario "Tour step" (L109): the THEN keeps only "the progress grid step's copy mentions that not-cleared cells can be marked Maybe clear or Stop here".

**D22. Teams card: cleared-objective marking stated twice in legendary-event-teams** — :11 and :228 vs :263 (`Covered objectives already cleared through the depth are marked`)

- Action:
  - **MODIFIED** `### Requirement: Each lane tab has a Teams section with one card per team`. Delete the clause ", and one already cleared through the team's depth shows as already cleared".
  - **MODIFIED** `### Requirement: A team card shows the points it has left within its depth`. In scenario "Worked example on Lysander Alpha", drop the line "- **AND** the No Resilient chip shows as already cleared". It equals scenario "Card marks a spent objective".

**D23. Unlock base state defined three times** — legendary-event-goals-preview/spec.md:13 (canonical) vs :22 (assumption) and legendary-event-upgrade-impact/spec.md:43

- Action:
  - **MODIFIED** `### Requirement: Goal targets map onto a previewed unit`. Drop the assumption bullet "Unlocking a character gives it rank Stone1, ability levels 1 and its initial rarity…".
  - **MODIFIED** `### Requirement: Next upgrade steps of a team member`. Replace "to its base state (the first progression step of its catalog `initialRarity`, rank Stone1, no applied upgrades, abilities 1/1)" with "to its base state (`legendary-event-goals-preview`)".

**D24. Leaderboard control persistence restated in eligibility** — legendary-event-eligibility/spec.md:102 (canonical: "Filter and toggle state are shared by the three lanes and the Overview leaderboard, persist while on the page and reset on leaving it.")

- Action:
  - **MODIFIED** `### Requirement: Deduct scored points toggle`. Delete ", shared by the three lanes and the Overview leaderboard" and the sentence "The toggle persists while on the page and resets to on when leaving it." "On by default" stays in the same requirement.
  - **MODIFIED** `### Requirement: Objective multi-select filter`. Delete "The selection is shared by the lane and Overview leaderboards, persists while on the page and resets on leaving it."

**D25. Smaller LE restatements** **(low)**. Each replaces a re-derived definition with a pointer.

- legendary-event-master-table:136. Delete "An archived event with no synced entry SHALL show Remaining equal to All." It is a subset of L40 in the same file.
- legendary-event-run-forecast:60. Replace "+ (regular + premium missions) × (25, + 15 with premium missions) + the bundle (300, + 15 with premium missions) when bought, with paid inputs read as 0 when Show paid options is off" with "+ the run's mission and bundle currency (`legendary-event-reward-projection`)".
- quest-event-battle-detail:82. Delete "While `npcs` is loading, tiles SHALL show the raw id with no level." It repeats the shared tiles' rule in legendary-event-battle-preview:178.
- legendary-event-team-editor-workflow:60. Replace '"n/5 · at least 3" below three' with "the member count (`legendary-event-team-size`)".
- legendary-events-hub:17. Replace the assumption about the synced `currentEventRun` with "- Run numbers are resolved by `legendary-event-run-resolution`."
- legendary-event-tier-list:11. Replace "The effective multiplier SHALL be the character's own `multiplier` when set, else its tier's multiplier" with "The effective multiplier SHALL be the character's base horde-mode multiplier (`legendary-event-clear-estimates`)".

### Dailies, HSE/HRE, Home, Library

**D26. Dailies primary-tab list restated five times, each "superseding" the last** — dailies-navigation/spec.md:9, :89, :123, :156, :198

- `Dailies primary navigation` still says "4 primary tabs — Raids, HSE, Shops, Guild Raids", which is false today.
- Later requirements patch it with "This supersedes any statement of the number…".
- There are four "Tab order" scenarios. The "Direct navigation" scenarios at :98, :132 and :165 are instances of :75 `Each primary tab is its own route`.
- Action:
  - **MODIFIED** `### Requirement: Dailies primary navigation`. Replace the first sentence with "The system SHALL present a `/dailies` section with 5 primary tabs, in order Raids, HSE, HRE, Quest, Guild Raids, in section tabs, the desktop section menu and navigation search, and SHALL land the user on the Raids tab by default." In its scenarios, "4" becomes "5".
  - **MODIFIED** `### Requirement: Dailies has an HSE tab`, `### Requirement: Dailies has an HRE tab`, and `### Requirement: Dailies has a Quest tab`:
    - Delete the "positioned directly after …, so the primary tabs are …" clause and the "This supersedes …" sentence.
    - Drop scenarios "Tab order" and "Direct navigation".
  - **MODIFIED** `### Requirement: Shops is not a Dailies tab`:
    - Delete "The primary tabs SHALL be Raids, HSE, HRE, Quest, Guild Raids, in section tabs, the desktop section menu and navigation search."
    - Delete "This supersedes any statement of the number or order of Dailies primary tabs, and any mention of a Shops tab, elsewhere in this capability."
    - Drop scenario "Tab order". Keep "Old Shops link".
  - Also fix the stale mentions: the "Raids, HSE or Shops" scenario under `Every Dailies primary tab opens its implemented page` (L28 area), and the `/dailies/shops` example in `Each primary tab is its own route`. Replace it with `/dailies/hse`.
  - In scenario "Opening another implemented primary tab", the WHEN becomes "**WHEN** the user opens Raids, HSE, HRE or Quest".

**D27. raid-boss-library duplicates within the file**

- **MODIFIED** `### Requirement: The Raid Bosses list shows Bosses and Primes as two sections`. Drop scenario "Both sections render" (L42). It equals "Details tab shows both entity sections" (L35).
- **MODIFIED** `### Requirement: Route selection follows the shared Library contract`:
  - Drop scenario "Bare collection URL canonicalizes" (L112). It is word for word the same as L105.
  - Drop "Unknown entity id falls back" (L125). It is a subset of "Unknown URL state is repaired".
- **MODIFIED** `### Requirement: Loading, dataset-absent, and failure states are distinct`. Drop scenario "Core raid-boss data is unavailable" (L322). It is the union of "Dataset unavailable" and "Sync failure".
- **REMOVED** `### Requirement: The page tour covers the adjusted-stats view` (L262). Reason: "The page has an onboarding tour covering both platforms" already says "The Details tour covers … adjusted stats", and its scenario "A Details tour includes adjusted stats" equals "Tour includes the adjusted-stats step". If the i18n key prefix is load-bearing, append to L357: "Adjusted-stats step copy uses the `tour.raidBosses.steps.*` keys."
- **MODIFIED** `### Requirement: The page has an onboarding tour covering both platforms`. Drop scenario "Tour runs on desktop and mobile" (L397). It is covered by "Tour runs on an entity detail on both platforms".

**D28. Home: Token Availability / Events row stated twice, with a "supersedes" patch** — home-token-availability/spec.md:100 vs home-events-widget/spec.md:7

- Action:
  - **REMOVED** `### Requirement: Token Availability shares its row with the Home Screen Events card`. Reason: covered by `home-events-widget` "Home renders a Home Screen Events card beside Token Availability". Its "This supersedes…" sentence is a change leftover.
  - **MODIFIED** `### Requirement: Home page renders Token Availability as its first section`. Replace `(see "Token Availability shares its row with the Home Screen Events card")` with ``(see `home-events-widget` "Home renders a Home Screen Events card beside Token Availability")``.

**D29. Home: Daily Raids placement stated twice** — home-raids-widget/spec.md:9 is a strict subset of home-projects-widget/spec.md:9

- Action: **MODIFIED** `### Requirement: Home page renders Daily Raids after Your Projects`.
  - Body becomes "The authenticated home page SHALL render a Daily Raids section in the position defined by `home-projects-widget` "Home page renders Your Projects after Token Availability"."
  - Drop scenario "Mobile stacks Daily Raids after Projects". Keep "Desktop shows Daily Raids beside Projects" as the one remaining scenario, or drop both and add a one-line scenario.
- Side note, not a duplicate: home-projects-widget's mobile order "(Token Availability, Your Projects, Daily Raids, events calendar)" omits the Events card.

**D30. "Event points never change Today or the Plan" stated in five places** — canonical: daily-raids-home-screen-event `### Requirement: Event points affect only the HSE tab's farm list` (L66)

- Action:
  - **MODIFIED** `### Requirement: Today is not event-optimised` (daily-raids-today:654).
    - Replace "the schedule SHALL be identical whether or not an HSE is active" with "its schedule is event-agnostic (see `daily-raids-home-screen-event` "Event points affect only the HSE tab's farm list")". Keep its no-event-UI rules.
    - Scenario "Active event does not change Today": the THEN becomes "**THEN** no event UI is shown on Today". The schedule-equality half equals the HSE scenario "Today unchanged by an active event".
  - **MODIFIED** `### Requirement: Raids Plan is not event-optimised` (daily-raids-plan:385).
    - Body becomes: "The Raids Plan SHALL NOT show event points or event names on day cards, whether or not an HSE is active or scheduled within the plan horizon; its schedule is event-agnostic (see `daily-raids-home-screen-event` "Event points affect only the HSE tab's farm list")."
    - Scenario "Event inside the plan horizon": the THEN becomes "**THEN** no day card shows event points or event names".
  - **MODIFIED** `### Requirement: The HSE tab handles states with no usable event`. Delete the last sentence, "A selected upcoming or past event SHALL NOT change Today, Bonus Raids, the Home raids widget or the Raids Plan."
  - **MODIFIED** `### Requirement: The HSE tab previews the next event`. Delete the last sentence, "A preview SHALL NOT change Today, Bonus Raids, Home or the Plan."

**D31. HSE default instance stated twice** — daily-raids-home-screen-event:320 (canonical) vs :296 and :7

- Action:
  - **MODIFIED** `### Requirement: The HSE tab previews the next event`. Delete "With no selection a running event always wins over a preview."
  - **(low)** In `### Requirement: At most one Home Screen Event is active, derived from the calendar` (L7), scenario "No HSE running", cut the THEN's clause "…and the next upcoming HSE, if any, is known and is what the HSE tab previews".

**D32. hse-points-projection: "past instances not projected" stated twice** — hse-points-projection:17 vs :131 (`The projection handles its states`)

- Action: **MODIFIED** `### Requirement: Tokens available per mode come from the synced buckets`. Delete "Past instances SHALL NOT be projected."

**D33. Raids Filters on the HSE tab: scenarios also owned by the HSE spec** — daily-raids-filters:142 vs daily-raids-home-screen-event:80/:133/:248

- Action: **MODIFIED** `### Requirement: Filters constrain Today, Bonus Raids and the HSE tab only`:
  - Drop scenarios "HSE farm list is filter-then-pick" and "HSE top-10 lists honor the filter".
  - **D34**: also delete "The Home raids widget, which shows the Today list, SHALL reflect the same filtered Today." That is owned by `Filter persistence and scope` (L213, scenario "Shared with the Home widget").

**D35. Enemy-traits matching and badge count restated** — daily-raids-filters:79 bullet, and :246 vs :7

- Action:
  - **MODIFIED** `### Requirement: Location matching semantics`. The bullet becomes "- Enemy traits: see "Enemy traits filter"." This also fixes the dangling pointer to a non-existent requirement "Enemy traits" (L12).
  - **(low)** **MODIFIED** `### Requirement: Enemy traits filter`. Change "SHALL be cleared by Reset, and SHALL count as one active group." to "SHALL be cleared by Reset." Counting is owned by `Raids Filters entry point`.

**D36. Today/Schedule project narrowing and "selection does not leak", stated twice**

- daily-raids-today:615 restates :43 `Today's schedule scope`.
- daily-raids-plan:347 restates :9.
- The scenario "Schedule's selection does not leak into Today" (today) equals "Today is unaffected" (plan).
- Action:
  - **MODIFIED** `### Requirement: Today's project selector defaults to all goals`.
    - Replace "With no project selected Today SHALL use the account-wide Active-goal sequence and SHALL NOT derive its scope from Current plan or Default. Selecting a project SHALL narrow the run to that project's Active goals, still in canonical global priority order." with "With no project selected Today SHALL NOT derive its scope from Default; the scope with and without a selection is defined by "Today's schedule scope"." "Current plan" no longer exists (L-type).
    - Drop scenario "Schedule's selection does not leak into Today".
  - **MODIFIED** `### Requirement: Schedule owns its project selection`. Delete "Selecting a project SHALL narrow the plan to that project's Active goals, still in canonical global priority order and from the one global run."

**D37. Bonus Raids ordering scenario stated three times in daily-raids-today** — :109 vs :59 and :87 **(low)**

- Action: **MODIFIED** `### Requirement: Bonus Raids`. Drop scenario "Bonus Raids ordering".

**D38. Shops section: one selector narrows raids and shops** — daily-shop-recommendations:185 vs :137

- Action: **MODIFIED** `### Requirement: Shop recommendations are a section of the Raids tab`.
  - Replace "It SHALL have no project selector of its own: it reads the Dailies project that the Raids tab's selector sets, so one selection narrows both the raids and the shop buys." with "It SHALL have no project selector of its own; its scope follows "Shops is a Dailies page defaulting to all goals with an optional project filter"."
  - Drop scenario "One selector narrows raids and shops".
- Also stale: the L137 header and L120 still call it "the Shops page".

**D39. HRE "Fight by hand": lightning-first and faction-kill rules stated twice, with a circular pointer** — hre-campaign-raids:212 vs :286

- Action:
  - **MODIFIED** `### Requirement: Manual objectives get a list of battles to fight by hand`. Change `nodes with a lightning-victory condition SHALL come first (see "Faction kills get their own list of battles");` to `nodes with a lightning-victory condition SHALL come first, so a quick win counts for both;`.
  - **MODIFIED** `### Requirement: Faction kills get their own list of battles`. Delete "While the mission's lightning victories are also open, nodes with a lightning-victory condition SHALL come first, so a quick win counts for both." Also delete its restatement of "only nodes with that faction's enemies… each battle SHALL count the node's enemies of that faction".
  - Read both bodies before applying, so the "from any campaign" and "most enemies per energy" ordering survive. They are unique to L286.

**D40. HRE Onslaught team of up to 8 units** — hre-mission-teams:65 vs :115 (`Onslaught pools keep to one alliance`)

- Action: **MODIFIED** `### Requirement: Every token objective gets a team for its mode`. Replace "An Onslaught team SHALL hold up to 8 units from one alliance, so fallen units can be replaced;" with "An Onslaught team is a pool (see "Onslaught pools keep to one alliance");".

**D41. HRE preview is read-only, stated twice** — hre-mission-tracker:9 scenario "Preview of the next event" vs :69 scenario "Preview is read-only" **(low)**

- Action: **MODIFIED** `### Requirement: The HRE tab shows the running or next Hero Release Event`. In scenario "Preview of the next event", cut the trailing "and its mission list is read-only".

**D42. Onslaught entry: unset alliance and tier options stated twice** — onslaught-progress-entry:52/:82 and :33/:68 **(low)**

- Action:
  - **MODIFIED** `### Requirement: Each alliance card shows its shards per run` (L82). Drop scenario "Unset alliance".
  - **MODIFIED** `### Requirement: Sector and tier mean the position being farmed` (L68). Delete 'The Tier options SHALL read "Tier 1", "Tier 2", "Tier 3"'. It is owned by L33.

**D43. NPC collection-route redirect** — npc-library:52 scenario vs library-entity-routes:39 ("Another collection selects its first available entity", same URL and outcome)

- Action: **MODIFIED** `### Requirement: The route carries the NPC group and the query carries variation and level`. Drop scenario "Collection route redirects to the first listed NPC".

**D44. Guild Raid Meta heroSlots shape** — guild-raid-meta-catalog:43 vs :123 (superset) **(low)**

- Action: **MODIFIED** `### Requirement: Typed query access preserves the curated Meta contract`. Replace the heroSlots parenthetical with `(see "Typed Meta access preserves explicit variant rules")`.

**D45. "start inclusive, end exclusive" restated by calendar consumers** **(low)** — canonical: game-events-calendar "Active event determination from UTC time"

- In home-events-widget:26, daily-raids-home-screen-event:7 and hre-mission-tracker:9, replace the inline UTC window rule with "active per `game-events-calendar` "Active event determination from UTC time"".
- Optional: drop daily-raids-home-screen-event's scenarios "Event inside its window" and "Boundary is exclusive at the end".

### Goals and projects

**D46. "Goals can be filtered by project membership" (stale; superseded)** — goal-project-membership/spec.md:261

- It describes a "Goals Overview" membership filter.
- Its scenario "Filtering applies on every status tab" uses an Archived status filter that no longer exists. goals-navigation:30 says "There SHALL be no "Archived" option".
- goals-navigation owns project scope in three requirements:
  - `Goals project scope is URL state` (:176)
  - `Goals project scope chip row` (:214)
  - `Goals project filter is independent of the project selection` (:146)
- Action: **REMOVED** `### Requirement: Goals can be filtered by project membership`. Reason: superseded by the goals-navigation project-scope requirements.

**D47. Row project removal is specified twice** — project-management/spec.md:91 vs goal-project-membership `Membership is removable from the project context` (:170) and `The scoped Goals page's row menu hosts project removal` (:357)

- The project-management scenarios match goal-project-membership scenarios one-to-one: "A goal row offers both actions", "Removed goal leaves the viewed list" and "Relocation destination is reported".
- Action: **REMOVED** `### Requirement: Project goal rows offer removal alongside deletion`. Reason: covered by goal-project-membership.

**D48. Default project as fallback home** — project-management/spec.md:124 vs goal-project-membership `Every goal retains at least one project membership` (:48, scenario "Last membership relocates to the Default project")

- Action: **MODIFIED** `### Requirement: The Default project is permanent`.
  - Replace "and SHALL be the fallback home of a goal whose last other membership is removed" with "and SHALL be the relocation destination defined by `goal-project-membership` ("Every goal retains at least one project membership")".
  - Drop scenario "A goal's last membership is removed".

**D49. "Archive unavailable for Default" appears three times in project-management**

- Canonical: "The Default project is permanent", scenario "Default project cannot be archived".
- Action:
  - **MODIFIED** `### Requirement: Project lifecycle actions are Edit and Archive/Restore in an overflow menu`: drop scenario "Archive is unavailable for the Default project".
  - **MODIFIED** `### Requirement: The Projects row menu hosts every project-specific action`: delete "Archive SHALL remain unavailable, with explanatory text, for the Default project."

**D50. "A project opens on Goals"** — project-management:207 repeats the surface-owned scenarios "Card opens the scoped Goals page" in project-management:246 and home-projects-widget:110.

- Action: **MODIFIED** `### Requirement: A project is viewed on the Goals page scoped to that project`: drop scenario "A project opens on Goals". The scenario "The former detail path is not a route" remains.

**D51. Scoped row-menu rules restated within goal-project-membership**

- Delete-confirmation naming removal is owned by :246 `Account-wide deletion is distinguishable from project removal`.
- "No removal item without scope" is owned by :185, scenario "Removal is absent without project scope".
- Action: **MODIFIED** `### Requirement: The scoped Goals page's row menu hosts project removal`:
  - Delete "Without a project scope the menu SHALL offer no project-removal item."
  - Delete "While scoped, the row's delete confirmation SHALL name removal from the scoped project as the alternative."
  - Drop scenarios "Unscoped menu has no removal" and "Delete confirmation names the alternative while scoped".
- Action: **MODIFIED** `### Requirement: The goal row's project-removal action offers a chosen destination when relocation is needed`: drop scenarios "Removal without a destination when other memberships exist" and "Moving to an existing project". They are subsets of :367 "Removal happens without a picker" and :373 "Last project asks for a destination".

**D52. Bulk pause does not cascade (pasted scenario)**

- goal-status-actions:49 "Bulk pause does not cascade" has the same GIVEN/WHEN/THEN as goal-bulk-actions:94 "An unselected prerequisite is left alone".
- Action: **MODIFIED** `### Requirement: Pausing or resuming a goal cascades to its prerequisites`: drop scenario "Bulk pause does not cascade". The requirement text already points to `goal-bulk-actions`.

**D53. Planning Settings on Schedule** — goals-navigation:9 vs planning-settings-access:9 (`Raids exposes shared Planning Settings`, which already covers Plan > Schedule)

- Action: **MODIFIED** `### Requirement: Planning Settings is a Goals-only control`.
  - New text: "The Plan section SHALL render its Planning Settings entry point on the Goals subpage. Projects and Insights SHALL NOT render a Planning Settings entry point of their own. The Schedule and Raids entry points are defined by `planning-settings-access`; every entry point opens the same dialog over the same persisted setting."
  - Drop scenario "Planning Settings visible on Schedule".

**D54. "Project views are projections of the one global run" is stated five times** — canonical: global-goal-priority `One global active sequence drives all execution surfaces` (:100)

- Action: **REMOVED** `### Requirement: Goal order drives priority-sensitive calculations` (project-management:81). Reason: it is a strict subset of the global-goal-priority requirement, and its scenario equals "Mixed Character and Machine-of-War demand" there.
- Action: **MODIFIED** `### Requirement: Project-aware browsing defaults to all goals` (goals-navigation:107).
  - Replace "Choosing a project SHALL only filter or summarize that project's goals from the global result" with "Choosing a project narrows the global result as `global-goal-priority` ("One global active sequence drives all execution surfaces") requires".
  - Drop scenario "A project filter narrows without re-planning". It equals global-goal-priority "Project projection does not change schedule".
- **(low)** Delete two sentences that restate their own requirement's first sentence. Look up each requirement header at the line before editing.
  - goal-farming-estimates:353: "Project views SHALL project per-goal results from this single run, not recalculate a smaller pool."
  - plan-completion-outlook:11: "Filtering to a project SHALL not reallocate inventory or energy or change a member's date."

**D55. goal-edit-dialog restates other goal specs**

- **MODIFIED** `### Requirement: The Edit goal dialog contains only editable fields`: drop scenarios "Rank goal needing a Mythic material" and "Editing the target updates the control". goal-mythic-material-sources owns them ("Adamantine rank range shows the control" / "Range below Adamantine hides the control"), and its text names the Edit goal dialog.
- **MODIFIED** `### Requirement: One Save submits every change`: drop scenario "Stale target revision". It is a subset of goal-target-editing "Stale revision".
- **MODIFIED** `### Requirement: Edit omits creation-only controls` (L263): delete "The Edit goal dialog SHALL show the unit and goal type read-only." It is owned by L37.
- **MODIFIED** `### Requirement: The target is saved with the dialog's single Save and preserves context` (goal-target-editing): drop scenario "Other detail draft exists". It equals goal-edit-dialog "Several fields at once".

**D56. Ability "at least one track" validity** — goal-creation:33 vs goal-target-editing `An Ability goal raises at least one track` (:235, which applies in both dialogs)

- Action: **MODIFIED** `### Requirement: The Ability card has an independent target selector per ability track`.
  - Replace the submittability sentence ("The goal SHALL remain submittable only when at least one track's target is above that track's current level; when neither … block submission") with "Validity follows `goal-target-editing` ("An Ability goal raises at least one track")." Copy the exact span from the file.
  - Drop scenario "Neither track advances". It equals "Neither track raised".

**D57. Ability target range: list vs stepper** **(low; read both first)** — goal-creation:70 `The Ability target selectors offer the full level range` vs goal-target-editing `Ability levels use a stepper` (:226). Both cover the same range: start (no change) up to 60, in both dialogs.

- If goal-creation:70 has no clause the stepper lacks (it describes a list with rarity-tier headers that the stepper replaced): **REMOVED**, reason "superseded by `goal-target-editing` "Ability levels use a stepper"". Otherwise leave it.

**D58. "Already a goal" scenarios** — goal-creation:496 "Taken target in the Rank picker" vs goal-target-editing:191 "Taken steps". Both use the same Incisus Gold III example. **(low)**

- Action: **MODIFIED** `### Requirement: Target pickers mark targets that are already a goal`: drop scenario "Taken target in the Rank picker" only if another scenario remains in that requirement. Otherwise leave it.

**D59. Create dialog presentation restated** — goal-creation vs goal-edit-dialog `Edit and create goal dialogs use the available space on desktop` (:165)

- **MODIFIED** `### Requirement: Goal creation opens as a dialog on desktop`: drop scenario "Mobile presentation unchanged". It equals goal-edit-dialog "Mobile".
- **MODIFIED** `### Requirement: Goal creation preselects a character and keeps a compact layout` (:317):
  - Delete 'The creation form SHALL NOT show helper paragraphs for project membership or for "Create paused"'. It is a subset of goal-edit-dialog:167, "Neither dialog SHALL show explanatory helper paragraphs".
  - **(low)** Drop scenario "Mobile footer layout". It is implied by `Mobile creation is a three-step flow` + `Mobile step navigation keeps values`.

**D60. Create-another retention vs consecutive context** — goal-creation:26 is a subset of :269 (`Consecutive creation retains compatible context`) plus :176 (start-paused resets).

- Action: **MODIFIED** `### Requirement: Create-another success remains immediately usable`.
  - Replace the span from "retain compatible project and goal-type context" through "The user SHALL be able to edit the retained choices" with "carry over only the context "Consecutive creation retains compatible context" allows". Copy the exact span from the file.
  - Keep its scenario.

**D61. Level-requirement placement restated** — canonical: goal-list-layout `A Rank or Ability goal shows its level requirement as sub-lines of its own row or card` (:47)

- **MODIFIED** `### Requirement: A Rank or Ability goal's level requirement carries its own remaining text and explanation` (goal-progress-display:159).
  - Replace the placement clause (Progress cell, nothing in Remaining) with "Its placement in the row is defined by `goal-list-layout` ("A Rank or Ability goal shows its level requirement as sub-lines of its own row or card")."
  - Drop scenario "Requirement with a raw XP gap" only if it asserts placement alone. Read it first.
- **MODIFIED** `### Requirement: The Remaining column shows resource chips, not prose` (goal-list-layout): drop scenario "A goal needing a level-up shows no level text in Remaining".
- **(low)** In the mobile card requirement (goal-list-layout:~300; use its exact header), delete the paragraph that restates the requirement sub-lines, and drop its scenario at :316.

**D62. Smaller goal restatements** **(low)**

- partial-goal-planning:81 restates goal-blocker-reasons:173. Delete "Both presentations are the same underlying blocked state for filtering, tab placement, and remedy actions."
- global-goal-priority:68 "Project-level reorder appears in the plan" uses the same data and the same move as :74 "Filtered plan". Drop :68.
- goals-navigation:134 restates global-goal-priority:11. Replace "Goals SHALL list goals in canonical global priority order and SHALL NOT offer a Sort control or any other sort mode." with "Goals lists goals in the order `global-goal-priority` defines and offers no Sort control."
- goal-creation-entry-points:14: replace "The separate `remember-consecutive-goal-context` change may offer remembered membership on such a launch; an explicit project-scoped launch always wins." with "Remembered membership and its precedence follow `goal-creation` ("Consecutive creation retains compatible context")." This also removes a change-name reference (L-type).
- goal-creation-entry-points `Existing project controls can start a new goal`: drop scenario "Create from project menu", which equals the canonical "Creating from a non-default project preselects it".
- goals-navigation: drop scenario "Scoped Create goal preselects the project". Its text already says "see `goal-creation-entry-points`".
- goal-farming-estimates:387 `Campaign farming considers only unlocked nodes` overlaps partial-goal-planning:52 `Every estimate surface uses one campaign node-eligibility rule`. Replace the eligibility definition with a pointer and drop scenario "Consumers agree". Read both first: the goal-farming-estimates text carries V1 notes worth keeping.
- rank-milestone-planning:31: replace "Each material occurrence, level-XP interval, and owned resource SHALL be assigned to at most one milestone" with "Each material occurrence and owned resource SHALL be assigned to at most one milestone, in effective priority order; level XP is allocated per `rank-level-progression` ("Level XP is counted once across a unit's targets")."
- goal-acquisition-source-picker `The Edit goal dialog shows the Onslaught yield from saved progress` (:386) restates :144 and :15. Reduce it to its one unique rule, with a single scenario: the yield falls back to the goal's saved start progression when the unit is not in the roster.

---

## 2. Scenarios pasted under several requirements (S)

I checked the repeated titles from the brief one by one. These are page-specific or rule-specific: each asserts a different outcome on a different subject. Not reported:

- "Desktop layout"/"Mobile layout", "On mobile"/"On desktop", "Desktop grid", "Loading"
- "Power data unavailable", "Estimates unavailable", "Locked unit", "Signed out"
- "V1 parity", "Unknown run", "No active event"
- the Uthar Alpha and Lysander Alpha worked examples

The real pasted scenarios are folded into the D entries above, because each is removed in the same MODIFIED requirement:

| id  | where                                                                                                                              | duplicate of                                                                                            | entry |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----- |
| S1  | goal-status-actions "Bulk pause does not cascade"                                                                                  | goal-bulk-actions "An unselected prerequisite is left alone" (identical text)                           | D52   |
| S2  | dailies-navigation "Tab order" ×4, "Direct navigation" ×3                                                                          | each other / "Direct navigation to a primary tab's URL"                                                 | D26   |
| S3  | raid-boss-library "Bare collection URL canonicalizes"                                                                              | "Bare collection URL canonicalizes to Details" (verbatim)                                               | D27   |
| S4  | raid-boss-library "Both sections render"                                                                                           | "Details tab shows both entity sections"                                                                | D27   |
| S5  | raid-boss-library "Tour runs on desktop and mobile"                                                                                | "Tour runs on an entity detail on both platforms"                                                       | D27   |
| S6  | daily-raids-today "Schedule's selection does not leak into Today"                                                                  | daily-raids-plan "Today is unaffected"                                                                  | D36   |
| S7  | project-management "A goal row offers both actions" / "Removed goal leaves the viewed list" / "Relocation destination is reported" | goal-project-membership :365/:367/:373                                                                  | D47   |
| S8  | eligibility "Tour step", run-inputs "Tour step order"                                                                              | hub tour order                                                                                          | D21   |
| S9  | home-token-availability "Desktop half-width" / "Mobile full width"                                                                 | home-events-widget row scenarios                                                                        | D28   |
| S10 | daily-raids-filters "HSE farm list is filter-then-pick" / "HSE top-10 lists honor the filter"                                      | daily-raids-home-screen-event "Filter-then-pick" / "Top 10 honors the Raids Filters"                    | D33   |
| S11 | npc-library "Collection route redirects to the first listed NPC"                                                                   | library-entity-routes "Another collection selects its first available entity"                           | D43   |
| S12 | goal-target-editing "Other detail draft exists"                                                                                    | goal-edit-dialog "Several fields at once"                                                               | D55   |
| S13 | goal-creation "Mobile presentation unchanged"                                                                                      | goal-edit-dialog "Mobile"                                                                               | D59   |
| S14 | goal-edit-dialog "Same action on Overview and Project Detail"                                                                      | n/a: Overview and Project Detail are now the same page, so the scenario asserts nothing                 | L17   |
| S15 | goal-deletion "The goal disappears everywhere it was cached"                                                                       | same page now (see L17)                                                                                 | L17   |
| S16 | goal-progress-display "Both bars render in the goal-detail sheet"                                                                  | asserts that removed UI renders nothing; goal-edit-dialog L37 already says the dialog shows no progress | L16   |

These are byte-identical across files but kept, because they cover a different dataset or page and have no shared owner:

- game-shops-catalog vs raid-boss-catalog: "Schema rejects…" and "Existing databases upgrade…"
- campaign-event-progress-editing vs onslaught-progress-entry: "Other API error" and the others (see D1)

---

## 3. Leftovers from archive (L)

### Placeholder Purposes

**L1. datamine-source/spec.md:5** — "TBD - created by archiving change add-datamine-pin. Update Purpose after archive."
Replacement: "Pins the web app's generated game text and catalog images to one `tacticus-planner-data-mines` commit, and defines how generators read only allowlisted data-mines files from an uncommitted cache, copy game sprites unchanged, keep game sprites apart from curated images, and generate the game name namespaces from that pin."

**L2. goal-season-fit/spec.md:5** — "TBD - created by archiving change add-goal-season-fit…"
Replacement: "Lets the Goals page show, for a chosen season type (Battle Pass, Guild Raid or Guild War), how many season boundaries each eligible goal's estimated completion falls beyond, using season windows from the events catalog, and marks the season cut-off with a divider."

**L3. v1-profile-import/spec.md:5** — "TBD - created by archiving change rewrite-v1-goal-import…"
Replacement: "Defines the V1 profile import dialog: it takes V1 credentials and a selection of profile parts, leaves goal and Legendary Event plan creation to the import operation, and reports each selected part's outcome — per-goal and per-event outcomes in four buckets with translated reasons — without silent no-ops or retained credentials."

### Stale Purposes (describe a state the specs no longer have)

**L4a. account-menu/spec.md:5**

- Current: "the authenticated desktop account menu only; … the mobile account drawer, are unaffected and out of scope".
- Why stale: "Desktop account card is organised…" defines the mobile drawer ("desktop popover and mobile drawer share the same layout"), and "Signed-out desktop users retain account preferences access" covers signed-out users.
- Replacement: "Defines the account menu: its global-bar trigger, the account card's position and sections (shared by the desktop popover and the mobile drawer), preference access for signed-out users, and the loading identity shown until the planner account is known."

**L4b. home-projects-widget/spec.md:5**

- Current: "Current plan first, … jump straight into a project's detail".
- Replacement: "Gives players a glanceable summary of their projects on the home page — the Default project first, then the others — so they can open a project on the Goals page without visiting the Projects page first."

**L4c. home-raids-widget/spec.md:5**

- Current: "for their Active project". The Active project was removed, and this contradicts the requirement "The widget scopes to all Active goals, matching Today".
- Replacement: "for all their Active goals".

**L4d. goals-navigation/spec.md:5**

- Current: "so Overview, Projects, and Insights…".
- Replacement: replace "Overview" with "Goals".

**L4e. daily-shop-recommendations/spec.md:5–10**

- Current: "a first cut of the shop recommendations V1 shows … on a dedicated Shops page under Dailies. (V1 additionally matches forge badges … tracked as a follow-up (TacticusPlanner/tacticus-planner-apps#104) and out of scope here.)"
- Why stale: the Shops page is gone (dailies-navigation "Shops is not a Dailies tab"), and the text carries a follow-up note.
- Replacement: "Tells a player which of today's daily-shop offers are worth buying for their goals (optionally one project's) — matching each shop's rotating rewards against outstanding character-shard, mythic-shard and mythic uncraftable upgrade-material needs — as a section of the Dailies Raids tab. Forge badges and machine-of-war components are not matched."

**L4f. goal-status-actions/spec.md:5**

- Current: mentions Archive availability and a "project-scoped bulk pause/resume action". project-management:28 forbids project-scoped bulk pause, and bulk actions live in goal-bulk-actions.
- Action: rewrite it to cover single-goal pause/resume and its prerequisite cascade only.

### "this change" / "before this change" / delta wording

**L5.** Each row is a **MODIFIED** requirement with the sentence or scenario rewritten as shown.

| #   | location                                                         | requirement                                                                                 | current                                                                                                                                                                                                                               | replacement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | account-menu:21                                                  | Desktop account menu shows the signed-in user's identity above its actions                  | scenario "Existing menu actions are unaffected"                                                                                                                                                                                       | gone with D2 (REMOVED)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| b   | account-menu:60                                                  | Desktop account card is organised into identity, preferences, account, and session sections | paragraph "Export backup, Restore from backup, a Keyboard shortcuts list, and Delete account rows (and any Import & export submenu) are out of scope for this change; they are follow-up work …, and this change SHALL NOT add them." | delete the whole paragraph (the requirement already enumerates the rows and says "The card SHALL NOT have an Import & export submenu.")                                                                                                                                                                                                                                                                                                                                                                                                                        |
| c   | account-menu:58                                                  | same                                                                                        | "Existing loading states, fallbacks, and authentication guards SHALL remain. Mobile account and theme behavior SHALL remain unchanged."                                                                                               | delete both sentences. The second contradicts the requirement's own mobile-drawer scenario; loading is owned by "Account identity shows a loading state…"                                                                                                                                                                                                                                                                                                                                                                                                      |
| d   | account-menu (scenario "Mobile drawer keeps the tour reachable") | same                                                                                        | "…, and the mobile tour's drawer orchestration and test targets are unchanged"                                                                                                                                                        | delete that clause                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| e   | account-menu:39                                                  | Desktop account card opens below its top-right trigger                                      | "SHALL now open below"                                                                                                                                                                                                                | "SHALL open below"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| f   | app-navigation:11                                                | Mobile menu drawer lists top-level sections with their child pages nested beneath them      | "SHALL continue to list … — unchanged from its behavior before this capability. This capability does not remove or restructure anything from the mobile drawer."                                                                      | "The mobile bottom navigation's "Menu" drawer SHALL list every top-level navigation section, with each section's child pages (if any) shown nested beneath it as direct links."                                                                                                                                                                                                                                                                                                                                                                                |
| g   | app-navigation:16                                                | same, scenario "Drawer keeps listing child pages"                                           | "…shown as direct links in the drawer, exactly as before this change"                                                                                                                                                                 | "…shown as direct links in the drawer"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| h   | app-navigation:21                                                | same, scenario "Mobile bottom bar keeps primary destinations unchanged"                     | "it continues to show only the sections and primary actions already designated `mobilePlacement: "primary"`, unaffected by this capability"                                                                                           | "it shows only the sections and primary actions designated `mobilePlacement: "primary"`"                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| i   | app-navigation:5 (Purpose)                                       | —                                                                                           | "The mobile menu drawer's existing full-tree listing is deliberately left intact."                                                                                                                                                    | "The mobile menu drawer keeps the full tree."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| j   | app-navigation:234                                               | The shared page header hosts each section's child-page picker                               | ", replacing any tab row a page previously rendered on its own"                                                                                                                                                                       | delete (the next sentences already forbid nested tabs)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| k   | app-navigation:236                                               | same                                                                                        | "— that duplication with the mobile header's tab row is intentional and out of scope for this capability to remove."                                                                                                                  | "— that duplication with the mobile header's tab row is intentional."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| l   | api-contract-sync:62–69                                          | Failure handling is unchanged                                                               | whole requirement                                                                                                                                                                                                                     | REMOVED (D12)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| m   | character-unit-details:495                                       | Rank-up materials tab                                                                       | "…, as before this change"                                                                                                                                                                                                            | scenario dropped in D13c; if kept, delete the clause                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| n   | dailies-guild-raid-status:11                                     | Ready guild members see current raid status                                                 | "It SHALL NOT calculate or display a subsequent-boss preview in this change."                                                                                                                                                         | "It SHALL NOT calculate or display a subsequent-boss preview."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| o   | dailies-guild-raid-status:20                                     | same, scenario "Active raid status loads"                                                   | "the page shows all available current-position fields and no team recommendation section is required by this change"                                                                                                                  | "the page shows all available current-position fields"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| p   | equipment-item-icons:18–31                                       | Item and relic ability icons load by exact catalog id                                       | "This change SHALL close these gaps:" plus a 6-row Today/Fix table, plus "The known gaps after this change are …"                                                                                                                     | delete the sentence and the table; the last sentence becomes "The known gaps are the equipment items `I_Block_E005` (Master-Crafted Power Field) and `I_Block_L005` (Artificer Power Field), for which neither V1 nor the game data ships an asset." (scenario "Case-sensitive host" keeps the ids as examples)                                                                                                                                                                                                                                                |
| q   | game-shops-catalog:33                                            | The `shops` dataset is synced and stored one record per shop                                | "a client with an earlier game-catalog database version loads the app after this change"                                                                                                                                              | "a client whose game-catalog database predates the `shops` store loads the app"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| r   | raid-boss-catalog:25                                             | The `raid-bosses` dataset is synced, validated, and stored                                  | "…loads the app after this change"                                                                                                                                                                                                    | "a client whose game-catalog database predates the raid-boss store(s) loads the app"                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| s   | goal-edit-dialog:191                                             | Edit and create goal dialogs use the available space on desktop                             | "it is the bottom-anchored sheet with one column, as before this change"                                                                                                                                                              | "it is the bottom-anchored sheet with one column"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| t   | goal-farming-estimates:304                                       | A Machine-of-War Ability goal costs every advancing ability track                           | "A goal that advances only one track SHALL be unaffected by this requirement."                                                                                                                                                        | "A goal that advances only one track SHALL be costed for that track only."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| u   | goal-farming-estimates:319                                       | same, scenario "Only one track advances"                                                    | "the result covers only the primary 3→6 transitions, unchanged from prior behavior"                                                                                                                                                   | "the result covers only the primary 3→6 transitions"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| v   | goal-farming-estimates:349                                       | Resource need for an already-attained goal target is zero                                   | "…(40 required minus 5 owned), unchanged from today"                                                                                                                                                                                  | "…(40 required minus 5 owned)"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| w   | goal-farming-estimates:433                                       | Within a goal's turn, the longest-to-finish material is farmed first                        | scenario "Equal time to finish keeps the existing order": "they are farmed in the order they were before this requirement"                                                                                                            | "they are farmed in their existing material order"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| x   | goal-farming-estimates:572                                       | A shop offer's daily capacity is shared across goals in priority order                      | scenario "Shard offers are unaffected": "each goal's shard supply is the same as before this change"                                                                                                                                  | rename to "Shard offers of different units are not shared"; THEN "each goal draws only on its own unit's shard offer, unreduced by the other goal"                                                                                                                                                                                                                                                                                                                                                                                                             |
| y   | goal-mythic-material-sources:98                                  | Every available offer is selected by default                                                | "so goals created before this control existed get it too"                                                                                                                                                                             | "so a goal saved without a selection gets it too"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| z   | goal-mythic-material-sources:113                                 | same, scenario "Existing goal picks up the default"                                         | "GIVEN a Ragnar Rank Adamantine 2 goal created before this change, with no saved selection … THEN … and it is no longer reported as blocked for Venerable Battle Mark"                                                                | rename to "Goal without a saved selection uses the default"; GIVEN "a Ragnar Rank Adamantine 2 goal with no saved selection"; THEN "…every listed Venerable Battle Mark offer supplies it, and it is not reported as blocked for Venerable Battle Mark"                                                                                                                                                                                                                                                                                                        |
| aa  | goal-acquisition-source-picker:257                               | The selected source set persists with the goal and is restored on edit                      | scenario "Goal created before this control existed": "a goal whose farming config predates this control"                                                                                                                              | rename to "Goal saved with a single source choice"; WHEN "a goal whose farming config holds a single source choice and no group selection is opened for editing". Or drop it if the old config shape is no longer accepted (V2 is pre-production; check the code)                                                                                                                                                                                                                                                                                              |
| ab  | goal-acquisition-source-picker:268                               | Default selection preserves campaign-only estimates                                         | "so a goal the user does not further configure produces the same estimate it would have produced before this control existed."                                                                                                        | "so a goal the user does not further configure is estimated from its lowest-energy campaign node(s) only."                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ac  | goal-acquisition-source-picker:162                               | (the Onslaught-yield requirement starting at :144)                                          | "the goal's ascension-orb requirement is unaffected by this control regardless"                                                                                                                                                       | "this control does not change the goal's ascension-orb requirement" (low)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ad  | goals-navigation:377                                             | Goals list controls are URL state                                                           | "…all types, exactly as before this change"                                                                                                                                                                                           | "…all types"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ae  | quest-event-clear-estimates:87                                   | The power ratio can be calibrated from samples                                              | mangled sentence ending "there is no in-app calibration UI in this change"                                                                                                                                                            | "The planner SHALL provide `calibrateQuestPowerRatio(samples)`, where a sample is `{ E, B, cleared }`, returning the ratio r that the fewest samples contradict (a cleared sample contradicts r when E < r × B; a failed one when E ≥ r × B), choosing the median of the tied range, or null with fewer than 5 samples. Nubari's recorded powers against their NPC sums SHALL also be checked by a unit test that reports the ratio, to judge the NPC fallback. The app SHALL ship r as a constant set from this function; there is no in-app calibration UI." |
| af  | ability-rules-text:34                                            | Every catalog ability with complete source text has rules text                              | scenario "Coverage after this change": frozen counts ("434 entries … 301 of the 302 it held before"), pinned to game 1.43 and V1 `develop` at 02b7166, although the requirement's own Assumptions say V1 is no longer a source        | drop the scenario (its numbers go stale on every datamine bump; the requirement keeps its other scenarios)                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ag  | hre-mission-tracker:151                                          | Mission progress persists per event instance in this browser                                | scenario "Entry stored before this change": "none of the new fields" … "it loads as before"                                                                                                                                           | rename to "Entry without the optional fields"; GIVEN "a stored entry with mission 20, its progress, points and rank, and no owned inputs, rank time or target"; THEN "it loads with no owned inputs, no rank time, and the other missions at 0 and 0"                                                                                                                                                                                                                                                                                                          |
| ah  | goal-creation:407                                                | An Upgrade goal persists the range it was created against                                   | "the card offers the whole ladder as today"                                                                                                                                                                                           | "the card offers the whole ladder"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ai  | goal-season-fit:96                                               | Each eligible goal shows its season fit                                                     | "it shows its blocked indicator as today"                                                                                                                                                                                             | "it shows its blocked indicator"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| aj  | goal-progress-display:21                                         | Progress renders as one stacked bar with an actual fill over a potential fill               | "Wherever a goal's progress previously rendered as two separate progress bars (…), it SHALL instead render as a single bar…"                                                                                                          | "A goal's progress (Actual Progress and, when applicable, Potential Progress) SHALL render as a single bar…"                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ak  | goal-progress-display:105                                        | The Unlock goal's flavor text moves from an inline row caption to a name tooltip            | "SHALL no longer render as a persistent line under the goal row/card. It SHALL instead be available as a tooltip…"                                                                                                                    | "SHALL NOT render as a persistent line under the goal row/card; it SHALL be available as a tooltip…" (renaming the delta-style header would need REMOVED + ADDED, so it is not worth it)                                                                                                                                                                                                                                                                                                                                                                       |
| al  | goal-progress-display:211                                        | A Rank or Ascension goal's displayed current value never reads past its own target          | "…between 0% and 100%, unchanged from today"                                                                                                                                                                                          | "…between 0% and 100%"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| am  | goal-project-membership:194                                      | The goal row's project-removal action offers a chosen destination when relocation is needed | "— unchanged from today's behavior."                                                                                                                                                                                                  | delete the clause                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| an  | project-management:68                                            | Project cards communicate planning value                                                    | ", as the Current plan project did before it was removed,"                                                                                                                                                                            | delete the clause                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ao  | project-management:178                                           | Project lifecycle actions are Edit and Archive/Restore in an overflow menu                  | "Project actions SHALL no longer render as an always-visible inline icon cluster."                                                                                                                                                    | "Project actions SHALL NOT render as an always-visible inline icon cluster."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ap  | legendary-event-team-editor-workflow:134                         | Picker tiles show remaining points                                                          | ' (previously "152 pts")'                                                                                                                                                                                                             | delete                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| aq  | legendary-event-teams:227                                        | A team card shows the points it has left within its depth                                   | ' (previously "152 points per battle")'                                                                                                                                                                                               | delete                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ar  | legendary-event-plan-wizard:59                                   | Creation files goals in a project targeting the event                                       | "Review SHALL offer the destination project as today (`project-event-target`)."                                                                                                                                                       | "Review SHALL offer the destination project (`project-event-target`)."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| as  | legendary-events-hub:287                                         | The Overview tab summarises the event                                                       | "the Run status card (unchanged from its requirement)"                                                                                                                                                                                | "the Run status card"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| at  | userjot-widget:171                                               | The widget SDK is loaded on demand from app code                                            | "…identified with the signed identity token as today"                                                                                                                                                                                 | "…identified with the signed identity token"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| au  | home-token-availability:70                                       | Each token card shows its per-type icon, with a distinct capped treatment                   | the "Implementation note: …" paragraph (FSD-layer rationale, plus "now inside the sidebar's user menu", which is stale)                                                                                                               | "No informational or sync-prompting banner is shown for stale or capped data; the widget only reflects the last-synced snapshot."                                                                                                                                                                                                                                                                                                                                                                                                                              |
| av  | daily-raids-plan:329                                             | Schedule is a Plan section page                                                             | "The multi-day plan formerly presented as Dailies › Raids › Raids Plan SHALL be …" and "…the page's content, calculations, density toggle, day paging, and Raided split are unchanged by the move."                                   | "The multi-day plan SHALL be …"; drop the "unchanged by the move" clause; keep the alias sentence (see L15)                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| aw  | app-navigation:767                                               | Navigation shows a live indicator for a running Quest Event                                 | "; this supersedes the HSE-or-HRE rule."                                                                                                                                                                                              | see D5                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ax  | dailies-navigation :91, :125, :158, :200                         | Dailies has an HSE / HRE / Quest tab; Shops is not a Dailies tab                            | "This supersedes any statement of …"                                                                                                                                                                                                  | see D26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ay  | home-token-availability:102                                      | Token Availability shares its row…                                                          | "This supersedes the "full width…" wording…"                                                                                                                                                                                          | see D28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### Change names cited as capabilities; dangling references

**L6. goal-visual-accessibility:39**, in `Reorder controls and states are perceivable`.

- Current: "(see `consolidate-goals-into-plan-and-remove-active-project`)".
- Replacement: "(see `goal-list-layout`)". The account-wide priority number on rows is owned by goal-list-layout:77.

**L7. goals-navigation:77**, in `Goals controls compress on mobile`.

- Current: "with the density control from `add-goals-overview-density-option`".
- Replacement: "with the density control (`goal-list-layout`)".

**L8. goal-creation-entry-points:14** — "The separate `remember-consecutive-goal-context` change …". The replacement is in D62.

**L9. goal-creation:411**, in `The slot pre-check compares each goal's target`.

- Current: "(`support-multiple-goals-per-unit` in the API)". That is an archived change name in the API repo.
- Replacement: "(the API's per-target uniqueness rule)", or the API capability name if one exists.

**L10. Dangling requirement pointers**

- daily-raids-filters:90: `see "Enemy traits"` → `see "Enemy traits filter"` (D35).
- daily-raids-today:305: `see "Today's raid schedule"` → `see "Today's raid schedule shows what is left to farm"`.

### One-off migration and transition requirements

**L11. hre-mission-tracker:156**, `Progress stored in the old objective order is migrated`. This is a one-off local-storage migration for the 2026-10 reorder.

- Recommendation: keep it while the migration code exists, because pre-October entries can still be in browsers.
- REMOVE it, together with the code, only when you retire the migration. Flagged, not proposed.

**L12. game-shops-catalog:13 and raid-boss-catalog:9.** The "version-cascade upgrade" sentences are an ongoing convention, so keep them. Only the "after this change" wording changes (L5 q/r).

### Glossary patches standing in for stale terms

Each of these exists only because older requirements were not rewritten after a consolidation.

- **L13. goals-navigation:134**: "Wherever another requirement … says "Overview", "Goals Overview", "All Goals", or "Global Plan" for this page, it means Goals."
- **L14. project-management:205**: "Wherever another spec says "project detail route", "Project Detail", "a project's page", or "the detail route", it means the Goals page scoped to that project."
- **L15. daily-raids-plan:329**: "Wherever another spec says "Raids Plan", it means Schedule". There are 81 such mentions in 12 files.

Recommendation:

- Keep L15's alias. Renaming 81 mentions is churn, not compaction.
- For L13 and L14 the stale terms are few: about 17 "Overview" in goal specs, "Global Plan" ×5, "Project Detail"/"project detail" ×10, "detail route" ×8.
- Many of those mentions assert things that are now vacuous (L16, L17). Fixing those is real compaction; rewording the rest is optional.

**L16. Scenarios about removed UI**

- **MODIFIED** `### Requirement: Actual Progress and Potential Progress captions carry a visible explanation on every goal kind` (goal-progress-display:219): drop scenario "Both bars render in the goal-detail sheet" ("which replaced the former goal-detail sheet … the read-only goal detail no longer exists"). goal-edit-dialog already says the dialog shows no progress.
- **(low)** Same requirement: scenario "Both bars render on a project detail card" ("…as Global Plan") is now equivalent to the compact-list scenario, because project detail is the scoped Goals list. Drop it.

**L17. Scenarios comparing two views that are now one page**

- **MODIFIED** `### Requirement: Each goal offers an Edit action that opens the Edit goal dialog` (goal-edit-dialog:9):
  - Drop scenario "Same action on Overview and Project Detail".
  - In the text, replace "(desktop table and mobile cards, on Overview and on a project's detail route)" with "(desktop table and mobile cards, with or without a project scope)".
- **MODIFIED** `### Requirement: Deleting a goal removes it immediately, without waiting for the network` (goal-deletion:12), scenario "The goal disappears everywhere it was cached". Either:
  - set GIVEN to "a goal is visible on the Goals page and counted in a project's summary (Projects page or Home projects widget)" and THEN to "it disappears from the list and the summaries immediately", or
  - drop the scenario; "The goal row disappears on confirmation" remains.
- goal-creation:278, scenario "Project-scoped launch wins": replace "launches creation from Project Detail" with "launches creation from the Goals page scoped to a project".
- **(low)** goal-visual-accessibility:11 and :39: replace "the Goals page, Project Detail, and the goal dialogs" with "the Goals page (with or without a project scope) and the goal dialogs".

---

## 4. Contradictions found during the audit

These are not compaction items. Decide them before or during the change, because they block a clean merge of some entries above. The per-area reviews reported them; the ones marked ✓ I spot-checked.

- **X1 ✓ userjot-widget is stale against app-navigation and account-menu.**
  - userjot-widget:18 `Desktop entry point lives in the section header` puts the button "in the section header's icon row, alongside the theme and language switches". app-navigation:436 puts it in the global bar, and the header has no language selector.
  - The "Both entry points also link to the full public board" requirement has been replaced by the account card's Roadmap row.
  - A mobile "Changelog row" is not in the account card.
- **X2 ✓ language-switcher:74** says the switcher is mounted in "the desktop header, the mobile guest settings popover, and the signed-in account drawer". The header no longer hosts it; in the account card it is a row plus a picker.
- **X3 ✓ account-setup:14** says "if account state cannot be determined, the system SHALL fail open, show protected content". onboarding-gate:9 instead retries, then shows an error card with Retry.
- **X4 Issue codes for LE plans.** api-error-handling:51 uses `planRevisionStale`. legendary-event-teams:114 uses `legendaryEventPlanStale` / `legendaryEventOrderSetMismatch`.
- **X5 equipment-item-icons:12 paths.** `game_catalog/equipment/…` and `game_catalog/abilities/…` break datamine-source:66 ("Nothing else SHALL sit directly under `public/game_catalog/`" besides `datamines/` and `curated/`). There is also the `.png` vs `.webp` mismatch noted in D13d.
- **X6 home-token-availability:84** shows a local read failure as the empty state with no retry. local-data-read-state:71 requires a bounded wait, then a failure state with Retry.
- **X7 Clears when unit-power fails.** legendary-event-clear-estimates:71 says Clears show "—". legendary-event-eligibility:102 says the column is absent when estimates are unavailable.
- **X8 legendary-events-hub section orders are stale.** The lane-tab order (:115), tour order (:262) and Overview order (:287) omit Upgrade impact and the Last run card. run-history:96, token-plan:173 and run-inputs:76 each claim the slot "after the Run status card".
- **X9 Worked-example numbers differ.** legendary-event-teams:76 gives "21% above battle 6 · 32% short of battle 7". clear-estimates:35 computes 12% / 37% for the same team.
- **X10 legendary-event-run-inputs:11** defines the current run on its own, not via `legendary-event-run-resolution`.
- **X11 Raids Filters scope.** daily-raids-filters:142 says "Today, Bonus Raids and the HSE tab only … and nothing else". hre-campaign-raids:43/346 apply the Raids Filters to HRE suggestions.
- **X12 Raids Filters row.** daily-raids-filters:7 puts the Filters action "in the same row as the project selector". dailies-navigation:61 says that row holds the selector and Planning Settings "with nothing leading".
- **X13 home-events-widget row cap.** The Purpose and the "Cap of two" scenario title say two rows; the requirement says three.
- **X14 home-raids-widget scope.** Scenario "Widget opens Today" says "scoped to the same Active/Default project". That contradicts the requirement's "SHALL NOT select … a project".
- **X15 Missing estimate.** goal-list-layout:247 and scenario 263 omit the second line when there is no estimate. goal-list-estimate-display:21 shows "the unavailable placeholder".
- **X16 Target collisions.**
  - goal-target-editing:68 says a non-Rank edit "cannot collide".
  - goal-target-editing:116, goal-creation:409 and goal-milestone-planning say per-target collisions exist for every type.
  - goal-project-membership:100 still says one non-Rank goal per `goalType`.
- **X17 Raw remaining XP.** goal-farming-guidance:39 and rank-level-progression:11 keep it visible. goal-remaining-resources:162 says no raw XP is shown.
- **X18 Start-paused explanation.** goal-creation:176 requires it to be visible without hover. goal-creation:317 and goal-edit-dialog:167 forbid helper paragraphs.
- **X19 goal-project-membership:324** says per-goal pause/resume is "the only way" to change whether a goal is active, but bulk pause/resume exists.
- **X20 Default marker.** project-management:124 says the Default project carries a Default marker "wherever projects are listed". goals-navigation:321 says the scope chip row need not show one.
- **X21 account-menu identity header.** The "SHALL NOT be interactive" identity header removed in D2 conflicts with the edit button.

---

## Capability-level redundancy

No whole capability is redundant. The nearest cases:

- **home-raids-widget and home-token-availability.** Their placement and row requirements collapse into home-projects-widget and home-events-widget (D28, D29). Both capabilities keep real content.
- **api-contract-sync** loses one of its four requirements (D12).
- **Optional new shared capability.** campaign-event-progress-editing and onslaught-progress-entry share three identical draft/save/leave requirements with no owner (D1). Extracting them is the only consolidation that would need a new capability.
