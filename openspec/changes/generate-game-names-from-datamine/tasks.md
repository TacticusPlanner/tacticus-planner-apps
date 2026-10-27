# Tasks

## 1. Generator

- [x] 1.1 Add `generate-game-names-i18n.mjs` and `datamine/curated-names.json`; add the three config files it reads to `datamine/files.txt`.
- [x] 1.2 Run it twice and confirm the second run changes nothing and it exits 0.
- [x] 1.3 Diff the output against the hand-ported files and list every changed term in the proposal.

## 2. Tests and docs

- [x] 2.1 Add `game-name-translations.test.ts`: the same ids in every locale for all eight namespaces, no empty term, curated English terms applied.
- [x] 2.2 Update the legendary-event tests that expected "Uthar" and the comments that called these namespaces English-only; list the generator in AGENTS.md.
- [x] 2.3 Run the full Vitest suite, eslint on the script and test, typecheck and `knip`.
