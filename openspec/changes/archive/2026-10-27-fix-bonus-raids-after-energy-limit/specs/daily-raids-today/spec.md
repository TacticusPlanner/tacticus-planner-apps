# Spec Delta

## MODIFIED Requirements

### Requirement: Bonus Raids

Below a visible separator, Today SHALL show a Bonus Raids section: upgrades or shards that receive zero raids under the real daily energy budget but would receive at least one raid if energy were unlimited. While the daily energy limit is not spent, an upgrade or shard that already receives at least one raid in the real schedule SHALL NOT appear in Bonus Raids; once it is spent, the rule below applies instead. Bonus Raids SHALL be ordered by the same goal-priority order the main schedule uses.

Bonus Raids SHALL initially display only the top 3 qualifying entries in that order. When more than 3 entries qualify, Today SHALL show a "Show more" control beneath the visible entries; activating it reveals the remaining entries (still in the same order, still grouped by goal per the grouping requirement above).

Once the real energy spent today (from the player's synced attempts, the same figure Today's energy-usage bar shows) reaches or exceeds the daily energy limit (`planningSettings.dailyEnergy`), Bonus Raids SHALL be the only raids list on Today: the Today's-plan lane SHALL NOT be shown, and the Bonus Raids section SHALL be shown with a short caption stating that the daily energy limit has been reached. Bonus Raids SHALL then list every raid still open today rather than only the upgrades and shards the real schedule left unraided: today's schedule recomputed with unlimited energy and with each node's raids capped at the player's real attempts left today, so an upgrade or shard the real schedule already raided keeps its remaining farming, in goal-priority order ahead of lower-priority goals. A node whose real attempts-left data is unavailable keeps its full daily attempt cap. For such a capped node, the attempts left stand in for its daily attempt cap when the row decides whether to show "N upgrades left" (Today's raid schedule shows what is left to farm). The Bonus Raids entries keep the same goal grouping, goal-priority order, exhausted-node exclusion, and top-3 truncation with a "Show more" control described above. When the limit is reached and no Bonus Raids entry remains, the Bonus Raids section SHALL still be shown, with a caption stating that the limit is reached and no bonus raids are left. Below the limit, Today's plan and Bonus Raids render unchanged. When no synced attempt data is available the energy spent is 0, so Today renders unchanged; a daily energy limit of 0 or less is treated as no limit. The Raids Plan tab is unaffected.

Assumptions:

- Energy spent today is the account-wide real spend from synced attempts at standing campaign nodes (Today's "Today shows real daily energy usage" requirement); it is not capped at the limit.
- The daily energy limit is `planningSettings.dailyEnergy` (default 288 when unset).
- Below the limit, Bonus Raids are computed from an unlimited energy budget at each node's full daily attempt cap. Once the limit is reached they are the raids left today: an unlimited energy budget with each node capped at the player's real attempts left (`live-progress.battleAttempts[].attemptsLeft`, standing and event-campaign nodes alike). The header's energy and raid totals keep describing the real schedule.
- A node's daily attempt cap is shared by every goal and material raided there, in goal-priority order; the real attempts left lower that shared cap.
- Upgrades already farmed today are counted through the synced inventory, so each goal's remaining need already reflects them.

#### Scenario: A zero-raid upgrade appears as a bonus raid

- **GIVEN** an upgrade has an in-scope goal need but the real energy budget is exhausted before any raid against it is planned, while an unlimited budget would raid it at least once
- **WHEN** Today loads
- **THEN** that upgrade appears in Bonus Raids, listing the node(s) and raid count an unlimited budget would have used

#### Scenario: A partially-raided upgrade is excluded from Bonus Raids

- **GIVEN** an upgrade receives at least one raid in the real schedule but not enough to fully clear its need, and the daily energy limit is not yet spent
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

#### Scenario: Worked example, the top goal keeps its farming after the limit

- **GIVEN** the daily energy limit is 30 and the player's synced attempts today have spent 30 energy (3 raids at node B1, 10 energy each, daily cap 5, so 2 attempts are left)
- **AND** the top-priority goal (Snappa, Rank D1) still needs 8 of upgrade U1, dropped at B1 (1 per raid), and the second goal (Patermine, Rank B1) needs 2 of upgrade U2, dropped at node B2 (10 energy, cap 5, 1 per raid, no attempts used)
- **WHEN** Today loads
- **THEN** the real schedule at 30 energy would raid B1 3 times for U1 (30 energy), so the below-limit Bonus Raids would list only U2
- **AND** because the limit is spent, Bonus Raids instead list the raids left today: Snappa first with U1 at B1 for min(5 cap, 2 left) = 2 raids (8 − 2 = 6 still needed afterwards), then Patermine with U2 at B2 for min(5 cap, ⌈2 ÷ 1⌉ = 2) = 2 raids, 40 energy in all
- **AND** B1 shows no "N upgrades left" label, since its 2 planned raids reach its 2 attempts left

#### Scenario: A partly-raided upgrade stays in Bonus Raids after the limit

- **GIVEN** the energy limit is spent, and an upgrade received at least one raid in the real schedule but its node still has real attempts left today
- **WHEN** Today loads
- **THEN** that upgrade appears in Bonus Raids under its goal, at that node

#### Scenario: Raids left today respect the real attempts left

- **GIVEN** the energy limit is spent and a node with a daily cap of 5 has 2 real attempts left today
- **WHEN** Today loads
- **THEN** Bonus Raids plan at most 2 raids there across all goals, and a node with no real attempts left gets none
