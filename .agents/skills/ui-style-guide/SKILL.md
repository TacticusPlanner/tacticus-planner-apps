---
name: ui-style-guide
description: Style guide for the V2 web app — page header, page toolbar slots, which control to use for which option, tabs, density and touch sizes, game icon sizes, UI copy, and overlays (dialogs, sheets, popovers, tooltips, confirms). Use when adding or changing a page, a toolbar, a filter, a group-by/sort/view control, a game icon (unit portrait, upgrade, equipment, faction, trait…), a dialog, sheet, popover or confirm, or any user-facing string in apps/web or packages/ui.
---

# UI style guide

The same job looks the same and sits in the same place on every page. This
guide covers layout, controls, game icons, copy and overlays; the `ui-sizing` skill is
its sizing chapter (type, icon, control and spacing scale, and the lint rule
that bans hardcoded px) and still applies in full.

Base: [Material 3](https://m3.material.io/) where it has an answer (segmented
buttons, chips, top app bar, 48dp touch target), our shadcn tokens for colour
and shape (`.design-sync/conventions.md`).

Status: `PageHeader` and `PageToolbar` (`@/shared/ui`) are on every page.
The icon sizes in rule 6 are the `size` prop of `EntityIcon` and `RarityIcon`
and the `UnitPortrait` component (`@/entities/unit`). Every call site uses
them, and `entity-icon-sizes.test.ts` fails on a fixed size class in an
`EntityIcon` or `RarityIcon` `className`. Every dialog, sheet and
confirm follows rule 8 (overlays). Nothing adds a new page-specific variant of
anything below.

Lint enforces two rules in `apps/web` (`no-restricted-syntax`): a hand-written
`aria-pressed` (rule 3) and an `<h1>` outside the app shell's layout (rule 1).
Hits that predate the rule are counted in `apps/web/eslint-suppressions.json`.
When you fix one, run `pnpm --filter web lint:eslint --prune-suppressions` so
it can't come back. A screen outside the app shell (landing, account setup,
legal pages, the route error screen) disables the `<h1>` check with a reason.

`apps/web/e2e/style-guide.spec.ts` checks the rendered pages on a signed-in
stack: every page in the navigation has one `<h1>` in the shell's header, and on
a phone every control in the page has a hit area of at least 44px (fields 40px).
Run it after changing a page's controls (instructions at the top of the spec).

## 1. Page header

- Order: title (`text-2xl`), help action ("Tour this page"), one-line
  description (`text-sm text-muted-foreground`), then the divider. Every page
  has the divider.
- Page settings: one labelled "Settings" button at the right end of the header
  row. Never a bare gear beside the title, never inside section tabs, never in
  the middle of the toolbar. The one icon-only exception is the phone header,
  which is app chrome: there Settings is an icon button beside the tour button,
  named "Settings".
- Every page in the navigation registers its own tour (`useTourPageSteps` from
  `@/shared/tour`, in a `*.tutorial.ts` file next to the page), so "Tour this
  page" is always there. Mark a step `data: { optional: true }` when its target
  can be missing (empty, loading, leaders-only), so the tour skips it.
- The first heading inside the page never repeats the page title.
- App shell on desktop: the top bar is 56px (`--desktop-top-bar-height`, set
  in `packages/ui` `globals.css`) with a 40px logo, the same logo size as the mobile
  header; its search launcher and icon buttons are 40px with 20px icons.
  Anything sticky under the bar offsets by the variable, never `top-12`.
- The shell renders the page's only `<h1>` (the `PageHeader` title on desktop,
  the mobile header on phones). Headings inside a page start at `<h2>`.

## 2. Page toolbar

One row directly under the header, three fixed slots, left to right:

| Slot         | Holds                                                                                     | Desktop                  | Mobile                                                      |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------- |
| Find         | Search, then the "Filters" button (badge = active count), then up to 4 quick-filter chips | Left; search grows       | Search + "Filters" on row 1; chips scroll sideways on row 2 |
| View         | Layout (Cards / Table), then Group by, then Sort                                          | Right                    | One "View" button that opens a sheet with all three         |
| Page actions | The page's primary create action ("Create goal")                                          | Far right, filled button | End of row 1, or the bottom-nav action                      |

- Bulk actions (Pause, Delete, Add to project…) appear in a contextual bar only
  while items are selected. No permanent row of disabled buttons.
- Everything else (snapshots, compare, select mode) goes in the Find row or the
  View sheet, not on extra toolbar rows.
- The filter entry point is always called "Filters" — not "Raids Filters",
  "Controls" or an unlabelled funnel.
- The chips may also hold on/off plan options that change how a result is
  computed, not only what is shown (Today's Fewer raids, Combine goals). Label
  the row for what its chips do: "Plan options" there, not "Quick filters"
  (and not "Quick actions": an action is a one-shot command).
- A page scoped to a project puts the shared `ProjectSelect`
  (`@/entities/project`) first in the Find slot, showing the chosen project's
  name on every viewport. A page about one event at a time (Event shop, HSE,
  HRE) puts the shared `EventInstanceSwitcher` (`@/shared/ui`) first instead:
  Previous / Next around a select grouped Running / Upcoming / Past. No page
  builds its own chip row or picker for either.
- A page with views inside it puts its tabs directly under the header, and
  each tab owns its toolbar (Tier list: Heroes / Enemies, each with its own
  Find row). A control that scopes every tab (the event picker, the shop
  search that jumps to a day, the day on Daily Shops, the LE countdown and
  "Plan this event") sits above the tabs instead.

## 3. Which control for which option

| Option type                           | Control                                                                 | Example                                 |
| ------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------- |
| 2–4 exclusive choices, always visible | Labelled segmented button: `ToggleGroup`, `type="single"`, one style    | Cards / Table, Group by: None / Faction |
| 5+ exclusive choices, or no room      | `Select` with a visible label                                           | Sort, Group by with many keys           |
| On/off that changes what is shown     | Filter chip in the Find slot (`FILTER_CHIP_CLASS_NAME`)                 | Owned only, Raidable only               |
| On/off that is a saved preference     | `Switch`, in the Settings sheet                                         | Rank shading                            |
| Many filters                          | `FiltersControl`: "Filters" button → popover or dialog; sheet on mobile | NPC filters, Collection filters         |
| Views of one thing                    | Tabs (rule 4)                                                           | Overview / Teams / Plan                 |

- Group by is always labelled "Group by", sits in the View slot after Layout,
  and is a segmented button with a "None" option (`Select` when more than 3
  keys).
- Do not hand-roll toggle buttons with `aria-pressed` or `rounded-full border`
  pills; use `ToggleGroup` or the filter chip.
- Icon-only segmented buttons are allowed only with a tooltip and an
  `aria-label`, and only where the label would not fit (mobile).
- A `Select` is never icon-only: it shows its value on every viewport.
- Up to two filters may sit in the toolbar as labelled selects, each in a
  `ToolbarField` (`@/shared/ui`) with its label outside the trigger (Season
  fit on Goals). A third filter moves them all into `FiltersControl`.
- Browsing a set of items (characters, MoWs, NPCs, raid bosses) is a list
  whose items open their own page. That page starts with the shared unit top
  bar: Back to the list, then Previous / Next with "N of M" in the order the
  list showed. Never a list beside the detail, and never a picker in place of
  the list on phones.
- A name search is the shared `SearchField` (`@/shared/ui`): search icon,
  clear X, "Search by name" unless it searches something else. Pass
  `debounceMs` when the search writes the URL.
- An empty list or page shows the shared `EmptyState`: `variant="empty"` says
  what is missing and offers the action that fills it ("Create goal") unless
  the toolbar already has it; `variant="no-match"` offers "Clear filters", or
  "Clear search" when only the search is set. No bare grey line, no card with a
  title and no action.
- Filters go through the shared `FiltersControl` (`@/shared/ui`): the
  "Filters" button with the active count as a badge, and its panel.
  `size="compact"` is a `w-80` popover on desktop, for a short list that fits
  without scrolling; `size="form"` is a form-width dialog, for longer lists.
  Both are a bottom sheet on mobile. Inside, each field has its visible label
  above it (`FilterField`; `inline` for a switch or a short number), led by
  the filter's game icon (`icon`, from `FilterLabelIcon` so a filter looks
  the same on every page), and options of a game entity show its icon in the
  list and in the trigger (rule 6). Changes
  apply as they are made; the footer is ghost "Clear filters" at the left and
  "Done". The one exception is a filter set that starts a slow calculation
  (Raids): it keeps an "Apply" button.
- Save model. Progress the game also tracks (Onslaught, Incursion stars,
  campaign event tracks, collection edits) is edited as a draft: the shared
  `UnsavedChangesBar` with Save and Discard, and `UnsavedChangesGuard` before
  leaving. Planner-only inputs (filters, settings, plan inputs, goals) save as
  you change them, with no Save button.

## 4. Tabs

- One style: left-aligned underline tabs, `text-sm`, for views inside a page
  or a dialog. Build them with `PageTabsList` and `PageTabsTrigger`
  (`@/shared/ui`) inside a `Tabs` root: natural-width tabs, no border under
  the strip, and a strip that scrolls sideways when it doesn't fit.
- Tabs stay tabs on a phone. They never turn into a select, a grid or wrapped
  rows.
- Pills and segmented buttons are never tabs.
- Section navigation (the strip under the mobile header) is app chrome, not
  page tabs.

## 5. Density and touch

- Touch means a coarse pointer (`pointer-coarse:`), not a screen width.
- Shared primitives are 32px with a mouse. On touch, buttons, toggles and tabs
  are 40px visual with a 48px hit area; inputs and selects are 40px with no
  hit-area wrapper. Size them in `packages/ui`, not per page.
- Toolbar buttons use the default size. `size="sm"` is only for buttons inside
  dense rows (table cells, cards).
- Body copy and descriptions are `text-sm`; `text-xs` is for captions and
  metadata only.
- Selection colour in content is `primary`. The gold `accent` is only for app
  navigation (active nav item).
- Section labels are sentence case `text-sm font-medium`, not small uppercase.
- A divider between parts of one list (Raided, Shops, Cleared, Flex, a season
  cut-off) is the shared `ListDivider`: label at the left, rule to the right.
  Never a centred label between two rules or a bare border with a caption.
- A drag handle is the shared `DragGrip` (shown on row hover or keyboard focus,
  always on touch; 32px hit area). A bar that floats over a page (selection,
  unsaved changes, totals) is the shared `FloatingBar`.

## 6. Game icon sizes

Every datamine/curated icon (`EntityIcon`, unit portraits) uses one of these
sizes, chosen by its role, never by the page.

| Role        | What                                                                                       | Mouse                       | Touch |
| ----------- | ------------------------------------------------------------------------------------------ | --------------------------- | ----- |
| Inline      | Next to text or a number: faction, trait, damage type, stat, currency, medal, rank in text | 20px `size-icon`            | 20px  |
| Badge       | Overlay on a portrait: rarity stars, rank, shard, faction corner                           | ⅓ of the portrait, min 16px | same  |
| Emblem      | Solid emblem in a list/table row beside rank emblems: rarity icon in the Goals table       | 24px `size-6`               | 24px  |
| Row         | Item in a list/table row: upgrade material, equipment, ability, reward, event icon         | 32px `size-8`               | 32px  |
| Tile        | Item in a card or grid: shop offer, reward tile, ability on a detail page                  | 48px `size-12`              | 48px  |
| Portrait sm | Unit in a row, chip, LRE lane, table                                                       | 40px `size-10`              | 40px  |
| Portrait md | Unit in a grid, LRE lane on touch                                                          | 64px `size-16`              | 64px  |
| Portrait lg | Unit card, detail header (128px `size-32` only for the detail hero)                        | 96px `size-24`              | 96px  |

- In code: `<EntityIcon size="inline" | "emblem" | "row" | "tile" | "badge-sm" … />`
  (a badge names the portrait it sits on; `portrait-sm` … is a bare,
  ringless portrait such as an NPC or a unit in a chip) and
  `<UnitPortrait size="sm" | "md" | "lg" | "hero" />` for a unit with its
  rarity ring. Keep size classes out of
  their `className`; it is for placement only. Fills of a sized frame
  (`size-full`) and wide art sized by height (`h-4 w-auto`) are the only
  exceptions.
- No game icon below 16px.
- Migrating an off-scale size: round to the nearest step, ties go up (14 to 18 →
  20 inline; 22/28 → 32 row; 36 → 40; 56/62 → 64). Emblem is chosen by role,
  never by rounding: a solid icon (the rarity hexagon) fills its box, so beside
  a row-size rank emblem, whose art leaves space around it, it reads the same
  at 24px.
- Item icons at row and tile size sit on their rarity frame
  (`ui_frame_upgrades_*`); inline icons never have a frame.
- Portrait badges: `sm` shows one (rank or stars), `md` two, `lg` all.
- When a game entity has an icon (unit, faction, alliance, rarity, rank,
  stat, ability, trait, damage type, resource, event, game mode), show it:
  the icon before the name, or the icon alone with the name as its tooltip
  and accessible name. Text alone only inside a sentence that can't hold an
  icon. Never show a raw id (`guild_boss_season_config_1`,
  `necroBossWardenLEG`): name it, or number it ("Season 1", "Other 2").

## 7. Copy

Short, true right now, written for players — not developers.

| #   | Rule                                                              | Don't                                                                                  | Do                                                                   |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Numbers first, words second                                       | "Next: Unlock. 1 more chest costing 350 currency. Enough currency for the chests now." | "375 / 400 shards · 1 chest left (350)"                              |
| 2   | At most one line of page description: what it is for              | A how-to paragraph under the title                                                     | "Spend today's energy on your active goals."                         |
| 3   | Explanations, assumptions, formulas collapsed by default          | An open "How this is worked out" block                                                 | A closed `HowToRead` disclosure (`@/shared/ui`)                      |
| 4   | Empty state = what's missing + one action                         | Two cards explaining "no active goals" in different words                              | "No active goals." + "Create goal"                                   |
| 5   | Never describe the code or the spec                               | "…plus your inputs for later runs; runs already started are not added again."          | Cut it, or "Includes runs 2–3 if you clear them"                     |
| 6   | "Now" only for what is true now; projections name their condition | "Enough currency now" (counts future runs)                                             | "Enough by run 3"                                                    |
| 7   | Game words, one word per concept across pages                     | "Filters" / "Raids Filters" / "Controls"                                               | "Filters" everywhere                                                 |
| 8   | Labels say what is shown, not what is hidden                      | "Hide unowned" next to "Only owned"                                                    | "Owned only"                                                         |
| 9   | Sentence case, no ALL CAPS labels                                 | "NORMAL CAMPAIGNS", "CAPPED"                                                           | "Normal campaigns", "Capped"                                         |
| 10  | Buttons are verb + object                                         | "Open Today", "Go"                                                                     | "Open today's raids", "Create goal"                                  |
| 11  | Dates, durations and counts come from one shared formatter        | "Nov 22, 2026 to Dec 6, 2026" and "Nov 22 – Dec 6" on one page                         | "Nov 22 – Dec 6" (year only if not this year), "in 4 days", "12,590" |
| 12  | "Create" makes a new record; "Add" puts a thing into another      | "Add goal", "Add team", "New project"                                                  | "Create goal", "Create team"; "Add to project"                       |
| 13  | A count beside a label is a `CountBadge`, not parentheses         | "Resume (2)"                                                                           | "Resume" with a 2 badge                                              |

Game terms follow the repo glossary (shards, orbs, promote, ascend, D3, A2…).
Strings live in `apps/web/public/locales/en`; see the `react-i18next` skill.

## 8. Overlays

Pick the overlay by the job, then use its shared component. Mobile means below
`md` (768px), as `useIsMobile` does.

| Job                                                                 | Desktop                                                                              | Mobile                                                                         | Use                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| A task: fields to fill, a list to pick from, an editor              | Centered dialog                                                                      | Bottom sheet                                                                   | `ResponsiveDialog`                                                            |
| Filters                                                             | Popover (`size="compact"`) for a short list; dialog (`size="form"`) for a longer one | Bottom sheet                                                                   | `FiltersControl`                                                              |
| Confirm one step that can't be undone (delete, discard, overwrite)  | Small centered dialog                                                                | Same                                                                           | `ConfirmationDialog`                                                          |
| A panel the page keeps reacting to (run inputs, a shopping list)    | Right `Sheet`                                                                        | Bottom sheet                                                                   | `Sheet side="right"` / `ResponsiveDialog`                                     |
| Details of one thing the player tapped (a unit, an enemy, a reward) | `Popover`                                                                            | Content-height bottom sheet with a drag handle                                 | `DetailsOverlay` (or `DetailsSheet` when desktop shows them another way)      |
| Name or explain one control or icon                                 | `Tooltip` on hover and focus                                                         | A tap does the control's job; the name is also in `aria-label` or visible text | `IconButton`, `HintTrigger`, `TruncatedText`, `disabledReason` (see Tooltips) |
| Choose one of a few actions                                         | `DropdownMenu`                                                                       | Same                                                                           | `DropdownMenu`                                                                |

- No raw `Dialog` for a task: on a phone it is a cramped box, not a sheet.
  Raw `Dialog` is only for `ConfirmationDialog` and desktop-only chrome.
- The vaul `Drawer` is for app chrome (mobile navigation, account menu) and
  for details of one tapped item, through `DetailsSheet` (`@/shared/ui`): as
  tall as its content, up to 90% of the screen, swipe down to close, the page
  still visible above. Every other bottom sheet is full screen on a phone and
  comes from `ResponsiveDialog` or `Sheet side="bottom"`.
- No overlay opens another overlay, except a confirm on top of the dialog it
  guards (unsaved changes, delete).

**Tooltips.** Never a native `title`: it shows late, can't be styled, and never
shows on touch or to keyboard users. Pick the wrapper by what carries the name:

- Icon-only button or link: `IconButton` (`@workspace/ui/components/icon-button`).
  `label` is its accessible name and its tooltip; `shortcut` adds a key hint.
  On touch a tap runs the action and a long-press shows the label (an icon
  link keeps the phone's own long-press menu).
- Non-interactive icon, badge or value (a medal count, a reward, an info
  glyph): `HintTrigger` (`@/shared/ui`). It is a focusable button, so keyboard
  users reach it; on touch a tap opens the same text in a popover. Never put
  it inside another button or link: name the outer control in its
  `aria-label` instead.
- Text cut off by `truncate` or `line-clamp`: `TruncatedText` (`@/shared/ui`).
  The tooltip opens only while the text is cut off; inside a link or button a
  tap keeps its own job.
- A control that is disabled for a reason: `disabledReason` on `IconButton` or
  on a `SegmentedControl` option. It stays focusable (`aria-disabled`) and the
  reason shows on hover, focus and tap. A disabled menu item shows its reason
  as a muted second line in the item instead.
- Help on a segment or toggle chip: `hint` on the option (hover and focus
  only, since a tap picks it); give touch users one `HintTrigger` beside the group.
- The app's `TooltipProvider` waits 300 ms before the first tooltip, then
  opens the next ones instantly while the pointer moves between triggers.

**Anatomy.** Every dialog and sheet has a title (`…Title`; `sr-only` only when
the content's own heading says the same). An optional one-line description is
`ResponsiveDialogDescription` (or `SheetDescription`) in the header, never a
plain `<p>`: it names the dialog for screen readers and clears the close
button. Header and footer stay put and only the body scrolls
(`ResponsiveDialogBody`, `SheetBody`); nothing is taller than the viewport.
The shell owns the spacing: body padding, the 24px inset shared by header and
body, and the footer's top border. Pass no `pt-*`, `pb-*`, `py-*` or
`border-t` to them; a body sets only its own layout (`gap-*`, `grid`). A
popover doesn't scroll, except an option list (a combobox, search results);
other content that needs to is a sheet or dialog.

**Footer.**

- Buttons sit at the right on desktop. On a phone they share one row in equal
  parts: dismiss and primary 50/50, a single button the full width. The
  footer shells do this; pass no width or `flex-col` to their buttons.
- Source order is dismiss, then primary, so the primary is last (rightmost) on
  every screen.
- One primary (`default`) per footer. Dismiss is `outline`. A secondary action
  such as "Clear filters" or "Reset to suggested" is `ghost` and sits at the
  left (`md:mr-auto`).
- At most two buttons in a phone footer. A third, secondary one moves into the
  body on a phone (`useIsMobile`): at the top when it acts on the whole form
  ("Clear filters"), at the end when it follows from it ("Save and add
  another").
- A summary line (selection count, power, a save error) sits at the left on
  desktop (`md:mr-auto`) and takes its own row above the buttons on a phone
  (`max-md:basis-full`).
- Pagers (Previous · Close · Next, Back · Next) keep their own row.
- Dismiss says "Cancel" when it throws input away and "Close" when there is
  nothing to lose. Never both.
- A dialog whose changes apply as they are made (filters, view options,
  planner settings) ends with one primary "Done" and no dismiss.
- Exception: a filters dialog whose every change recomputes something slow
  (the Raids filters re-plan the day) keeps a draft and ends with "Cancel" and
  "Apply filters"; its ghost "Clear filters" applies at once and closes.
- The primary is verb + object (copy rule 10): "Save goal", "Delete project",
  "Apply filters", not "OK", "Yes" or "Submit".

**Confirming.** Confirm only what can't be undone; an action the player can
reverse in one tap doesn't ask. A confirm is `ConfirmationDialog` (no close
button: Cancel already says it):

- The title is the question: "Delete this project?"
- The description says in one sentence what is lost.
- Confirm repeats the verb + object ("Delete project") and is `destructive` when
  something is lost. Cancel is "Cancel".
- Escape and a click outside cancel.
- A delete that reaches past the player's own data (a guild purge) also asks
  them to type a word before the confirm button turns on.

**Widths.** Desktop dialogs use one of three widths, set with
`ResponsiveDialog`'s `width` prop. Never put a `sm:max-w-*` class in
`contentClassName`: it also reaches the phone sheet, which below 768px must
stay full screen.

| Width          | `width`  | For                                                 |
| -------------- | -------- | --------------------------------------------------- |
| Narrow (448px) | `narrow` | Confirms, one choice, up to three fields            |
| Form (672px)   | `form`   | Forms, pickers, filters                             |
| Wide (1024px)  | `wide`   | Tables, side-by-side panels, browsing (the default) |

Right sheets are `sm:max-w-md`. Popovers are `w-72` (the `PopoverContent`
default), or `w-80` for a unit or enemy card, and never wider than
`calc(100vw-2rem)`. Keep the default radius and padding; a popover heading is
`PopoverTitle` (`text-sm font-medium`).

**Touch and focus.** Footer buttons and the close button follow rule 5 (48px hit
area on touch). A dialog opened from state, not from its trigger, sends focus
back to the control that opened it (`onCloseAutoFocus`).

## Review checklist

- [ ] Page has the standard header; settings (if any) is the labelled button at its right.
- [ ] Page registers its own tour; steps that can be missing are optional.
- [ ] Toolbar controls are in the Find / View / Actions slots, in that order.
- [ ] Each option uses the control from rule 3; Group by is labelled and in the View slot.
- [ ] Empty states use `EmptyState`, explanations use `HowToRead`, and the save model follows rule 3.
- [ ] No new tab, segmented or pill style; no hand-rolled `aria-pressed` toggles.
- [ ] Controls meet 48px on touch; no `size="sm"` in toolbars.
- [ ] Every game icon uses a size from rule 6.
- [ ] Other icons are 20px (`size-icon`) unless they fall under an exception in `ui-sizing`.
- [ ] Every game entity with an icon shows it; no raw ids reach the screen.
- [ ] Each overlay is the one rule 8 names for its job, with a title, a rule 8 footer and one of the three widths.
- [ ] New or changed strings pass the copy rules.
- [ ] PR has desktop and mobile before/after screenshots.
