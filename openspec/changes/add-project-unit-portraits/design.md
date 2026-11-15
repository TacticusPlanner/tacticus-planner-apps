## Decisions

1. **Portraits come from data already joined.** The card already joins `goalIds` with the goals list for its unit count. The first 4 distinct units, by the global priority of their highest goal, render as overlapping round portraits (`size-6` on the Projects page, `size-5` in the home widget, per `ui-sizing`), with "+N" for the rest. No extra read.
2. **Owning slice.** `features/project-management/ui/project-unit-portraits.tsx`, which uses `entities/unit` for portraits. The goals list reaches the card the way the unit count already does.
3. **Accessibility.** The group has one accessible label, "Kharn, Abaddon, Typhus, Lucius and 2 more", and the images are decorative.
4. **Desktop and mobile.** Same row on both, beside the colour dot; the card layout does not change otherwise. No tour step.
