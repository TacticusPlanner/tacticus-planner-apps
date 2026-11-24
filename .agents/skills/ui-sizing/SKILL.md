---
name: ui-sizing
description: Sizing guideline for the V2 web app — which Tailwind text, icon, control, spacing and radius classes to use on mobile and desktop, the lint rule that bans hardcoded px/rem sizes, and what to use instead. Use when adding or changing UI in apps/web or packages/ui, when picking a text/icon/button size, or when the better-tailwindcss/no-restricted-classes rule fires.
---

# UI sizing

Every size comes from the theme scale. Hardcoded lengths (`text-[11px]`,
`size-[13px]`, `h-[22px]`, `rounded-[10px]`, px tracks in `grid-cols-[…]`) are
banned by `better-tailwindcss/no-restricted-classes`
(`packages/ui/eslint.tailwind-sizing.js`, used by `apps/web` and
`packages/ui`). Keeping everything on the scale means a later root-size change
(or a user "UI size" setting) scales the whole app consistently.

The guideline follows [Material 3](https://m3.material.io/foundations/designing/structure)
with [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
as the hard floor. "Touch" means a coarse pointer (`pointer-coarse:`), not a
screen width.

## Allowed sizes

| Role                                         | Touch                      | Mouse                        | Class                            |
| -------------------------------------------- | -------------------------- | ---------------------------- | -------------------------------- |
| Page title                                   | 24px                       | 24px                         | `text-2xl`                       |
| Section / card title                         | 18px                       | 18px                         | `text-lg`                        |
| Reading text, inputs                         | 16px                       | 14px                         | `text-base pointer-fine:text-sm` |
| Default UI text (labels, table cells)        | 14px                       | 14px                         | `text-sm`                        |
| Caption, metadata — the floor                | 12px                       | 12px                         | `text-xs`                        |
| Numerals or glyphs on a solid badge over art | 10px                       | 10px                         | `text-2xs` (badges only)         |
| Icon: the baseline (see Icons below)         | 20px                       | 20px                         | `size-icon`                      |
| Standalone icon, or beside `text-2xl`        | 24px                       | 24px                         | `size-6`                         |
| Icon exception: 16px (see Icons below)       | 16px                       | 16px                         | `size-icon-sm`                   |
| Icon exception: 12px (see Icons below)       | 12px                       | 12px                         | `size-icon-xs`                   |
| Button / input height                        | 40px visual, 48px hit area | 32px (`sm` 28px in toolbars) | `h-10` / `h-8`                   |
| Smallest tap target                          | 48px                       | 24px                         | —                                |
| Portrait in a list, chip or lane             | 40px                       | 40px                         | `size-10`                        |
| Portrait in a grid                           | 64px                       | 64px                         | `size-16`                        |
| Portrait in a card                           | 96px                       | 96px                         | `size-24`                        |
| Spacing                                      | 4px grid                   | 4px grid                     | `gap-2` / `gap-3` / `gap-4` …    |

Text classes: `text-2xs` (only numerals or glyphs such as ≥ on a solid badge over art; labels and captions never), `text-xs`, `text-sm`,
`text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`. Never
an arbitrary `text-[…]`. Line height: the class default, a `leading-*` step,
or the `text-sm/5` shorthand.

## Icons

Every icon is 20px (`size-icon`) on mouse and touch: inline with `text-sm` or
larger text, in a button, toggle, tab, menu, select or command item, input
adornment, alert, nav item or the top bar. A 20px icon fits the 20px line height
of `text-sm`, so it doesn't make a row taller. The shared controls in
`packages/ui` already default their icons to `size-icon`; don't pass a size to
an icon inside them.

An icon is smaller only when what is around it is smaller than 20px:

| Exception                                                                                                          | Size | Class          |
| ------------------------------------------------------------------------------------------------------------------ | ---- | -------------- |
| In a `text-xs` line (captions, metadata)                                                                           | 16px | `size-icon-sm` |
| Trailing affordance: select / combobox chevron, sort arrow, disclosure chevron, external-link mark, selected check | 16px | `size-icon-sm` |
| Compact control: `xs`, `icon-xs`, `icon-sm` buttons, `xs` input group                                              | 16px | `size-icon-sm` |
| Inside a badge, count badge or status pill                                                                         | 12px | `size-icon-xs` |
| Corner mark on a portrait or tile (selected check, lock, plus), on a solid badge                                   | 12px | `size-icon-xs` |

No icon uses `size-3`, `size-3.5`, `size-4` or `size-5`: use the tokens, so a
later retune is one line in `packages/ui/src/styles/globals.css`. A size other
than 20px needs one of the reasons above; when none fits, use 20px. Standalone
icons with no label beside them are 24px (`size-6`); the empty state's icon is
32px. Not icons, so not covered here: status dots, the checkbox check and radio
dot, colour swatches and legend squares.

Game icons (portraits, upgrades, equipment, factions, traits…) use the role
sizes in the `ui-style-guide` skill (rule 6). Layout, controls and copy are
there too; this skill is its sizing chapter.

Today's app is still denser than this table in places (see the UI sizing
plan); new code should follow the table, and existing code moves to it page by
page.

## Replacing a hardcoded size

Snap to the nearest allowed class within ±2px; on a tie pick the larger one.

| Hardcoded                                          | Use                                                      |
| -------------------------------------------------- | -------------------------------------------------------- |
| `text-[8px]`…`text-[10px]` on a badge              | `text-2xs`                                               |
| `text-[10px]`, `text-[11px]` elsewhere             | `text-xs`                                                |
| `text-[13px]`, `text-[15px]`                       | `text-sm`, `text-base`                                   |
| `text-[22px]`, `text-[26px]`                       | `text-2xl`                                               |
| `size-[13px]`, `size-[18px]`, `size-[22px]` (icon) | `size-icon-sm`, `size-icon`, `size-6`                    |
| Layout lengths (`w-[420px]`, `min-h-[52px]`)       | the exact spacing step: `w-105`, `min-h-13` (px ÷ 4)     |
| `rounded-[10px]`, `rounded-[5px]`, `rounded-[2px]` | `rounded-lg`, `rounded-sm`, `rounded-xs`                 |
| `ring-[3px]`, `border-b-[3px]`                     | `ring-3`, `border-b-3`                                   |
| `tracking-[0.06em]`, `tracking-[0.12em]`           | `tracking-wider`, `tracking-widest`                      |
| `grid-cols-[28px_minmax(0,1fr)_70px]`              | rem tracks: `grid-cols-[1.75rem_minmax(0,1fr)_4.375rem]` |

Tailwind v4 spacing takes any 0.25 step (`h-5.5` = 22px, `w-17.5` = 70px), so
layout boxes map exactly. Text and icons snap to the table above instead, so
the app keeps a small set of sizes.

## Escape hatch

Only for sub-pixel offsets that are off the spacing scale (shadcn arrow and
input-group hairlines):

```tsx
// eslint-disable-next-line better-tailwindcss/no-restricted-classes -- shadcn hairline offset, off the spacing scale
```

Always give the reason after `--`. A size that "needs" to be 11px or 13px is
not a reason; use the scale.
