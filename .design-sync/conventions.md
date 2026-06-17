# Tacticus UI Kit — conventions

A React + Tailwind v4 component library (shadcn-style, built on Radix). Import
everything from the package root: `import { Button, Card, CardHeader } from '@workspace/ui'`
(at runtime these are `window.TacticusUi.*`).

## Setup & wrapping

- **No global provider is required** — components are self-contained.
- **`Tooltip` is the one exception**: wrap it (or your app) in `<TooltipProvider>`.
- **Dark mode**: add `className="dark"` to any ancestor element. All color tokens
  flip automatically. The default (no `.dark`) is the light theme.
- **Fonts** ship with the kit: body text is **DM Sans**; use the `font-heading`
  utility for **Raleway** headings.

## Styling idiom — Tailwind utility classes with semantic tokens

Style components by passing Tailwind utility classes to `className` (they merge
correctly with the component's own classes via `tailwind-merge`). **Always prefer
the semantic token classes below over raw colors** (`bg-blue-500`) — they are what
make a design on-brand and dark-mode-correct.

| Purpose | Classes (real, verified) |
|---|---|
| Surfaces | `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-accent` |
| Brand / actions | `bg-primary` + `text-primary-foreground`, `bg-secondary` + `text-secondary-foreground` |
| Danger | `bg-destructive`, `text-destructive` |
| Text | `text-foreground` (default), `text-muted-foreground` (secondary), `text-card-foreground`, `text-popover-foreground`, `text-accent-foreground` |
| Borders | `border-border`, `border-input` (focus rings are built into the interactive components — no class needed) |
| Radius | `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl` |
| Type | `font-heading`, `font-medium`, `font-semibold`, `font-bold` |

Each token also exists as a CSS variable (`var(--primary)`, `var(--muted-foreground)`,
`var(--border)`, `--radius`, …) if you need it in inline styles.

## Variants are props, not classes

Visual variants come from typed props, not utility classes:
- `Button` / `Badge`: `variant` (`default | secondary | outline | ghost | destructive | link`) and Button `size` (`xs | sm | default | lg | icon | icon-*`).
- `Toggle` / `ToggleGroup`: `variant`, `size`. `Alert`: `variant` (`default | destructive`).
Check each component's `.d.ts` for the exact union.

## Compound components — compose from sibling exports

Many components are a family of parts you nest yourself (there is no `Card.Header`
dot-notation — import each part):

- **Card**: `Card › CardHeader › {CardTitle, CardDescription, CardAction}`, `CardContent`, `CardFooter`
- **Dialog**: `Dialog › DialogTrigger`, `DialogContent › {DialogHeader › DialogTitle/DialogDescription, DialogFooter, DialogClose}`
- **Select**: `Select › SelectTrigger › SelectValue`, `SelectContent › SelectGroup › {SelectLabel, SelectItem}`
- **DropdownMenu**: `DropdownMenu › DropdownMenuTrigger`, `DropdownMenuContent › {DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut}`
- **Table**: `Table › {TableHeader › TableRow › TableHead, TableBody › TableRow › TableCell, TableCaption}`
- Also compound: **Accordion, Tabs, Command, Popover, Tooltip, RadioGroup, ToggleGroup, Field, InputGroup**.

## Where the truth lives

Read `styles.css` (and its `@import`ed `_ds_bundle.css`) for the full token and
utility set, and each component's `.d.ts` / `.prompt.md` for its exact props and
usage. Those files are authoritative; this header is the orientation.

## Idiomatic snippet

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@workspace/ui'

<Card className="w-80">
  <CardHeader>
    <CardTitle>Deploy project</CardTitle>
    <CardDescription>Ship to production in one click.</CardDescription>
  </CardHeader>
  <CardContent className="text-sm text-muted-foreground">
    Your changes are ready to go live.
  </CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="ghost">Cancel</Button>
    <Button>Deploy</Button>
  </CardFooter>
</Card>
```
