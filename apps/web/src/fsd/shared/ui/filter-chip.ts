/**
 * The selected state of a filter chip (a `ToggleGroupItem`) on the Legendary Event pages: a 2px
 * primary border and a primary tint, so a selected chip differs from an unselected one by border
 * weight as well as colour in both themes. Radix exposes the state as `data-state="on"` (and as
 * `aria-checked` in a single-select group, `aria-pressed` in a multi-select one); both fills are
 * set so the shared toggle's `aria-pressed:bg-muted` never wins.
 *
 * Applied at the call sites rather than in `@workspace/ui`'s toggle group, whose other consumers
 * (theme switcher, goal forms, library header) keep their own look until reviewed.
 */
export const FILTER_CHIP_CLASS_NAME =
  "data-[state=on]:border-2 data-[state=on]:border-primary data-[state=on]:bg-primary/10 aria-pressed:bg-primary/10"
