## MODIFIED Requirements

### Requirement: Bonus Raids

Below a visible separator, Today SHALL show a Bonus Raids section: upgrades or shards that receive zero raids under the real daily energy budget but would receive at least one raid if energy were unlimited. An upgrade or shard that already receives at least one raid in the real schedule SHALL NOT appear in Bonus Raids. Bonus Raids SHALL be ordered by the same goal-priority order the main schedule uses.

Bonus Raids SHALL initially display only the top 3 qualifying entries in that order. When more than 3 entries qualify, Today SHALL show a "Show more" control beneath the visible entries; activating it reveals the remaining entries (still in the same order, still grouped by goal per the grouping requirement above).

Once the real energy spent today (from the player's synced attempts, the same figure Today's energy-usage bar shows) reaches or exceeds the daily energy limit (`planningSettings.dailyEnergy`), Bonus Raids SHALL be the only raids list on Today: the Today's-plan lane SHALL NOT be shown, and the Bonus Raids section SHALL be shown with a short caption stating that the daily energy limit has been reached. The Bonus Raids entries keep the same goal grouping, goal-priority order, exhausted-node exclusion, and top-3 truncation with a "Show more" control described above. When the limit is reached and no Bonus Raids entry remains, the Bonus Raids section SHALL still be shown, with a caption stating that the limit is reached and no bonus raids are left. Below the limit, Today's plan and Bonus Raids render unchanged. When no synced attempt data is available the energy spent is 0, so Today renders unchanged; a daily energy limit of 0 or less is treated as no limit. The Raids Plan tab is unaffected.

Assumptions:

- Energy spent today is the account-wide real spend from synced attempts at standing campaign nodes (Today's "Today shows real daily energy usage" requirement); it is not capped at the limit.
- The daily energy limit is `planningSettings.dailyEnergy` (default 288 when unset).
- Bonus Raids are computed from an unlimited energy budget and are not recomputed when the limit is reached; the header's energy and raid totals keep describing the real schedule.

#### Scenario: A zero-raid upgrade appears as a bonus raid

- **GIVEN** an upgrade has an in-scope goal need but the real energy budget is exhausted before any raid against it is planned, while an unlimited budget would raid it at least once
- **WHEN** Today loads
- **THEN** that upgrade appears in Bonus Raids, listing the node(s) and raid count an unlimited budget would have used

#### Scenario: A partially-raided upgrade is excluded from Bonus Raids

- **GIVEN** an upgrade receives at least one raid in the real schedule but not enough to fully clear its need
- **WHEN** Today loads
- **THEN** that upgrade does not appear in Bonus Raids, even though additional energy would raid it further

#### Scenario: Bonus Raids ordering

- **GIVEN** two or more upgrades qualify for Bonus Raids, belonging to goals of different priority
- **WHEN** Today loads
- **THEN** Bonus Raids lists them in the same goal-priority order as the main schedule, not by any other ranking

#### Scenario: Bonus Raids truncated to top 3 with a Show more control

- **GIVEN** more than 3 entries qualify for Bonus Raids
- **WHEN** Today loads
- **THEN** only the first 3 entries (in goal-priority order) are shown, followed by a "Show more" control, and the remaining entries are not rendered until that control is activated

#### Scenario: Show more reveals the rest

- **GIVEN** Bonus Raids is showing its truncated top-3 view with a "Show more" control
- **WHEN** the user activates "Show more"
- **THEN** the remaining qualifying entries are revealed in place, in the same goal-priority order, still grouped by goal

#### Scenario: 3 or fewer entries need no truncation

- **GIVEN** 3 or fewer entries qualify for Bonus Raids
- **WHEN** Today loads
- **THEN** all qualifying entries are shown and no "Show more" control is displayed

#### Scenario: No bonus raids available

- **GIVEN** no upgrade or shard qualifies for Bonus Raids (every farmable need is either fully covered by the real schedule or would still receive zero raids even with unlimited energy)
- **WHEN** Today loads
- **THEN** Today shows an explicit empty state for the Bonus Raids section, not a blank section

#### Scenario: Bonus Raids become the only list once the energy limit is spent

- **GIVEN** the daily energy limit is 288 and the player's synced attempts today have spent 288 energy, and Bonus Raids has entries at nodes with attempts left
- **WHEN** Today loads
- **THEN** the Today's-plan lane is not shown, and Bonus Raids is the only raids list, captioned that the daily energy limit has been reached

#### Scenario: Bonus Raids keep the top-3 truncation after the limit is spent

- **GIVEN** the energy limit is spent and more than 3 Bonus Raids entries have a node that is not exhausted
- **WHEN** Today loads
- **THEN** Bonus Raids shows the first 3 of them followed by a "Show more" control that reveals the rest

#### Scenario: Below the energy limit nothing changes

- **GIVEN** the daily energy limit is 288 and the player's synced attempts today have spent 287 energy
- **WHEN** Today loads
- **THEN** Today's plan and Bonus Raids are both shown as before, with no limit-reached caption

#### Scenario: No synced attempts leave Today unchanged

- **GIVEN** no synced attempt data is available for today
- **WHEN** Today loads
- **THEN** the energy spent is 0, and Today's plan and Bonus Raids are shown as before

#### Scenario: Limit spent with no bonus raids left

- **GIVEN** the energy limit is spent and no Bonus Raids entry remains
- **WHEN** Today loads
- **THEN** the Today's-plan lane is not shown, and the Bonus Raids section says the daily energy limit is reached and no bonus raids are left
