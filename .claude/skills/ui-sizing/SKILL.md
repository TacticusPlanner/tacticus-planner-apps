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
| Icon inline with text                        | 16px                       | 16px                         | `size-4`                         |
| Icon in a button / nav item                  | 20px                       | 16px                         | `size-5` / `size-4`              |
| Standalone icon                              | 24px                       | 20px                         | `size-6` / `size-5`              |
| Decorative icon inside a badge               | 12–14px                    | 12–14px                      | `size-3` / `size-3.5`            |
| Button / input height                        | 40px visual, 48px hit area | 32px (`sm` 28px in toolbars) | `h-10` / `h-8`                   |
| Smallest tap target                          | 48px                       | 24px                         | —                                |
| Portrait in a list or lane                   | ≥ 40px                     | ≥ 36px                       | `size-10` / `size-9`             |
| Portrait in a card                           | 88–96px                    | 88–96px                      | `size-22` / `size-24`            |
| Spacing                                      | 4px grid                   | 4px grid                     | `gap-2` / `gap-3` / `gap-4` …    |

Text classes: `text-2xs` (only numerals or glyphs such as ≥ on a solid badge over art; labels and captions never), `text-xs`, `text-sm`,
`text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`. Never
an arbitrary `text-[…]`. Line height: the class default, a `leading-*` step,
or the `text-sm/5` shorthand.

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
| `size-[13px]`, `size-[18px]`, `size-[22px]`        | `size-3.5`, `size-5`, `size-6`                           |
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
