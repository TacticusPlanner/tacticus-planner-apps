# Design

## Context

`lane.killPoints` feeds `unitLanePotential` (`pointsPerBattle = killPoints + objective scores`), `teamPointsPerBattle`, the master table's cells and the leaderboard's remaining points; per-battle progress and the token plan use the catalog's `defeatAll[i]` instead. The test fixture `apps/web/src/test/fixtures/legendary-events.json` is a copy of the served `lres` view of Lysander, Uthar and Farsight built from the API's raw files, so it carried Uthar's wrong values. The master table spec's worked examples use the fixture's Uthar lanes. See the proposal and the API half's design for the evidence (Uthar `killPoints` 34 / 26 / 17 against `defeatAll[0]` 30 / 34 / 43; V1 shows 30 / 34 / 43).

## Goals / Non-Goals

**Goals:**

- Keep the fixture and the specs true to the corrected catalog.
- Prove the figures by test, not by hand.

**Non-Goals:**

- Changing how the base is computed (a constant per lane, as V1; using `defeatAll[i]` per battle in leaderboards is a separate product decision).
- Renaming `killPoints` in the apps (its meaning is documented in the API spec; the rename is a contract change).

## Decisions

**D1. Refresh the fixture from the catalog, not by hand-editing three numbers.** The fixture header says it is built from the real catalog source; regenerating the Uthar block from `lres-votanuthar.json` after the API change keeps that claim true and would also pick up any other drift. Alternative: edit the three numbers. Rejected: it hides whatever else differs.

**D2. The worked examples are recomputed from the corrected lane values and pinned in tests.** Dante's Uthar cell: Alpha 30 + 65 + 90 = 185 × 18 = 3,330; Gamma 43 + 50 = 93 × 18 = 1,674; cell 5,004; with Lysander's 6,534 the total is 11,538. The Remaining example keeps the 13 cleared battles on Lysander Alpha (5,774) so the total is 10,778. The Estimated example uses 185 × 6 = 1,110 and 93 × 9 = 837 for Uthar (cell 1,947) with Lysander's 1,148 (total 3,095). Existing tests already encode these examples, so updating them is the verification.

**D3. Find the other Uthar figures by running the suite.** Any test that reads Uthar's lane base fails with a figure diff; each is recomputed from the formula and updated with its derivation in the test name or a comment rather than pasted.

## Risks / Trade-offs

- [The fixture changes before the API half is deployed] → The fixture is only test data; production reads the served catalog, so ordering matters only for staging verification (after the API half).
- [A test is updated to match without checking the maths] → Each updated figure carries its derivation (lane base + objectives × battles); the spec examples are the reference.
- [Other pages show Uthar figures users remember] → They now match V1 and the game; noted in the PR for the release notes.

## Migration Plan

None. Merge after the API half; verify on staging that Uthar's leaderboard and master table figures changed as expected.
