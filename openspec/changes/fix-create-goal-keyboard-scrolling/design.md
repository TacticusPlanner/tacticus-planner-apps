## Context

`CreateGoalSheet` renders a modal `SheetContent` with header and footer; `UnitGoalFormFields` owns an `overflow-y-auto` form between them. The reported failure is not yet reproduced, so the cause may be focus placement, flex sizing, the sheet primitive, or a nested control's key handling.

## Goals / Non-Goals

**Goals:** Preserve the modal focus trap and make the actual form scroller keyboard reachable at short heights.

**Non-Goals:** Remove focus containment, redesign the form, or change its validation/submission semantics.

## Decisions

- First reproduce in a supported browser at a short viewport with keyboard only; identify which element owns scroll and which element receives focus/key events. Fix that layer, not global body scrolling.
- Keep header/footer fixed only if the form receives a bounded height and can actually scroll. Ensure focused fields are revealed, including controls that open popovers inside the sheet portal.
- Add focused interaction regression tests for tab order and focus containment; verify scroll geometry manually because jsdom does not model it faithfully.

## Risks / Trade-offs

- A generic keydown handler could break text inputs or comboboxes → prefer native scrolling and only intercept keys if a reproduced failure requires it.
- A sheet CSS change could disturb touch scrolling → verify both input modes.

## Open Questions

- Which precise focused control and supported browser reproduces `UI-001`? The first implementation task records the failing path; the contract and fix location remain the same regardless.
