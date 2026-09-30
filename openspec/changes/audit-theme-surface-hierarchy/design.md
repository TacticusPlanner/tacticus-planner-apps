## Context

See proposal.md for motivation. Source inspection establishes the following baseline in packages/ui/src/styles/globals.css. These are OKLCH lightness values, not contrast ratios or a completed browser audit.

| Role              | Light L | Dark L | Interpretation                                                          |
| ----------------- | ------- | ------ | ----------------------------------------------------------------------- |
| Canvas            | 0.955   | 0.252  | Light canvas is off-white; dark canvas is lighter than cards            |
| Card / popover    | 1.000   | 0.205  | Light raised relationship is useful; dark relationship is inverted      |
| Sidebar           | 0.955   | 0.120  | Light navigation almost matches canvas; dark navigation is much darker  |
| Muted / secondary | 0.949   | 0.305  | Light muted fills are near the canvas; dark muted fills are above cards |
| Border / input    | 0.888   | 0.305  | Usage and alpha determine actual separation                             |

Desktop page header and mobile header/bottom bar currently use bg-sidebar. The shared Card and custom Schedule day cards use bg-card with a faint ring. Dialog, Sheet, and Popover use bg-popover. Input uses bg-input/50 with a transparent border. Button ghost/outline variants use neutral muted backgrounds, while some app consumers use the gold accent for interaction. Therefore token inspection identifies likely hierarchy inconsistencies, but cannot by itself certify rendered contrast or establish that all gold accents are inappropriate.

ThemeProvider already persists Light/Dark/System, responds to system changes, and synchronizes storage events. Existing goal-visual-accessibility specifies goal-specific contrast and redundant state cues. Preserve those behaviors and obligations.

## Goals / Non-Goals

**Goals:** Evaluate each theme on its own merits, implement corrections through semantic roles, and verify the actual composited colors in representative real screens.

**Non-Goals:** Azure palette matching, mandatory neutralization of every hue, light/dark symmetry, new theme modes, typography/radius/layout redesign, changing rarity/rank/event identities, or altering navigation/action behavior.

## Decisions

### Audit dimensions and evidence

Use the existing UI Kit and real Home, Goals, Schedule, and Library pages. Capture the same content in each theme at desktop and mobile sizes; include populated and empty states, an input form, search, account menu, dialog/sheet/drawer, tooltip, and semantic status badges. Record role, token/class, computed foreground/background, alpha-composited color where applicable, text/control contrast, visual hierarchy finding, retain/change decision, and post-change result in audit.md inside this change. Link screenshots and identify viewport/state. A result can be retained; light mode is not presumed broken because dark mode has a finding.

Separate decorative surface separation from text/control accessibility. Ordinary text targets 4.5:1; meaningful control/focus/state cues target 3:1 against the relevant adjacent surface. Do not demand 3:1 between every card and canvas or inflate decorative borders to meet an unrelated criterion. Disabled controls remain visibly recognizable but are evaluated separately from enabled control targets. Document the actual compositing calculation, including translucent rings and input backgrounds.

### Surface roles instead of a copied palette

Use existing background/card/popover/sidebar tokens where their meanings fit. Add semantic shell roles for global bar, section navigation, and page header when needed to decouple their consumers; define both light and dark values together. These roles can share values intentionally. The page heading area should visually continue the canvas; navigation is separated using measured tonal difference or a restrained divider, not a near-black band repeated over the page.

Dark direction: canvas lower in luminance than cards; overlays at least as light as cards with a clear edge/elevation treatment; navigation remains in the same restrained color family. Light direction: retain white cards over a slightly darker canvas, distinguish navigation without requiring a dark sidebar, and use outlines/elevation for white overlays on white cards. Do not darken light cards merely to mimic dark mode.

Exact colors are implementation tuning within these relationships, not a frozen Azure hex palette. Preserve the Planner's blue primary actions. Change a foreground, alpha, or border locally when that resolves an issue more precisely than changing the whole theme. Alternative: globally invert or brighten all tokens. Rejected because light mode already has a useful base hierarchy and alpha/state consumers behave differently.

### Component and state coverage

Tokens belong in packages/ui styles, shared component treatments in packages/ui components, and shell-specific role assignments in app/layout. Reuse semantic classes in direct consumers such as Schedule rather than adding local arbitrary hex colors. No new FSD feature/public behavior API is needed. Do not hand-edit .design-sync generated documentation.

Audit all consumers of any changed token with rg before changing it, including input alpha, nested cards, menu item selection, tabs, disabled states, badge/status fills, progress tracks, and chart legends. Maintain distinct hover, selected, focus, and disabled presentation; selected navigation needs a non-hue cue such as a marker or weight. Do not blindly repurpose --accent, which also serves meaningful colored content. Preserve goal accessibility and rank/rarity/event meanings; fix a badge's text/backplate/outline before changing domain hue.

### Desktop/mobile and companion changes

This is a shared theme change: mobile cards, drawers, headers, and bottom navigation are in scope. Navigation structure and breakpoints are unchanged. Apply after revamp-desktop-navigation to style its global bar and section menu; before it lands, baseline evidence records that these surfaces are planned rather than pretending they exist. Quick-action search adopts these same tokens if already implemented, with no dependency on its behavior.

Keep tour selectors and steps stable because no flow changes. Verify callout/overlay readability in both themes and platforms. Update translated tutorial copy only if a necessary affordance description actually changes; any new user-facing copy must be translated in en/de/es/fr. No new labels or tours are expected for a palette correction.

## Risks / Trade-offs

- Global token changes can improve one surface while harming another -> consumer inventory and matching before/after page states, plus numeric contrast checks on rendered combinations.
- Screenshot preference can obscure measured readability -> report visual hierarchy and accessibility separately; neither substitutes for the other.
- Light surfaces may appear indistinguishable on some displays -> subtle dividers/elevation and enabled-control boundaries rather than unnecessary saturated fills.
- Domain colors may lose contrast on a new canvas -> test representative goal status/progress, project colors, rank/rarity, and events without redefining their meanings.
- A large audit can grow into page redesign -> limit corrections to shared surfaces and direct consumers; preserve layout, density, and interactions.

## Migration Plan

Use an isolated apps worktree after the navigation revamp. Establish baseline evidence, implement semantic role corrections, and record matching after-state measurements. No storage/data migration. Validate theme switching/System preference and complete automated and browser gates before PR review and archive. Rollback reverts styling only. This proposal's source-level audit is complete; live composited measurements and final palette selection are explicit implementation verification, not claimed results.
