## Context

The common Radix wrapper in `packages/ui/src/components/slider.tsx` renders a visually 1-unit-high horizontal track and a 4-unit thumb. Planning Settings, Progress, and character lookup consume the wrapper; page-local padding would not solve the shared defect.

## Goals / Non-Goals

**Goals:** Enlarge the interactive root's cross-axis box while centering the existing thin track; retain Radix input and ARIA behavior.

**Non-Goals:** Change the Energy tier scale, slider value semantics, or surrounding dialog layout.

## Decisions

- Adjust the shared root's horizontal and vertical cross-axis size, keeping the visual track thin and thumb unchanged. Prefer the root over a pseudo-element that might not participate in Radix hit testing. Do not put a transparent overlay above the thumb.
- Keep existing caller props and `className` overrides. Validate all current consumers, especially the Energy dialog where labels and actions sit close to the slider.
- Use component-level interaction tests for values and disabled/keyboard behavior, plus a real touch/viewport check for geometry that DOM tests cannot prove.

## Risks / Trade-offs

- Larger boxes may intercept clicks intended for nearby labels or buttons → inspect each consumer at narrow widths and keep the hit region within its allocated layout.
- Root sizing may differ by orientation → cover both horizontal and vertical styles even though current product consumers are horizontal.

## Open Questions

- None that alter the agreed behavior. Choose the smallest target height that is reliably usable in the actual touch viewport during implementation; document the measured size in tests or review evidence.
