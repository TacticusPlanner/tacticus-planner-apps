# Skipped audit entries

These `audit.md` entries looked in scope but were left out of this change. Most of the reasons follow the scope rule in `design.md`: no meaning change, and the canonical copy must be at least as specific as the one removed. Entries marked **(low)**, D1, L11, L13–L15 and the Purpose edits (L1–L4, L5i) are out of scope by design and are not repeated here.

- **D2** (REMOVED account-menu identity header): its "SHALL NOT be interactive" sentence is one side of contradiction X21, so removing it would settle X21. L5a goes with it.
- **D11** (redirect-authentication silent-failure fallback): `silent-sign-in` owns restore failure only. It does not say that a failed background token refresh surfaces no error, so the canonical copy is less specific.
- **D12** (REMOVED "Failure handling is unchanged"): no other spec owns its "transient-failure classification" clause. Only the "exactly as before the change" leftover was reworded (L5l).
- **D13d** (drop relic-icon coverage scenario): the two specs disagree on the icon extension (`.png` vs `.webp`, related to X5).
- **D15** (rewrite of "Estimates degrade by data state"): it overlaps contradiction X7 (Clears "—" vs column absent).
- **D21** (tour-order scenarios in run-inputs and eligibility): the audit marks it blocked by X8, since the hub tour order it would defer to is stale.
- **D27 REMOVED part** ("The page tour covers the adjusted-stats view"): its `tour.raidBosses.steps.*` key namespace contradicts the canonical requirement's `library` keys. The scenario drops of D27 are kept.
- **D35 bullet rewrite** (Enemy traits matching → pointer only): the bullet's "at least one enemy has a selected trait" wording would be lost. Only the dangling pointer was fixed (L10).
- **D39** (HRE lightning-first ordering): the faction list's own "most per energy first" ordering interacts with the lightning-first rule, so the canonical copy is not clearly at least as specific.
- **D56 text part** (Ability "at least one track"): `goal-target-editing` says "valid / no-change message" but not "block submission". Only the duplicate scenario is dropped.
- **D59 sentence** (creation helper paragraphs): it is one side of contradiction X18 (start-paused explanation). Only the "Mobile presentation unchanged" scenario drop is kept.
- **D60** (create-another retention): the replaced span also carries the start-paused reset, which the pointer target "Consecutive creation retains compatible context" may not own (related to X18).
- **D61** (level-requirement placement): it touches raw remaining-XP display, which is contradiction X17.
- **D62** (all low, apart from its L8 sentence): skipped as low. The L8 change-name replacement in `goal-creation-entry-points` was applied.
- **home-token-availability:88 "Implementation note"** (failed-to-load state): left in place because it is part of contradiction X6. Only the :70 note (L5au) was replaced.
